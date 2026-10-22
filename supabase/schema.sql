-- MANITO — shared multiplayer schema
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- It is idempotent: safe to re-run if you need to reset the schema.
--
-- Trust model: this is a private game for a small group of friends, not a public product.
-- Identity comes from Supabase Anonymous Auth (one stable auth.uid() per device, no password).
-- Row Level Security keeps each player's own task/manito/evidence hidden from the others until
-- the reveal phase — but a technically determined player who inspects their own network traffic
-- could still bypass the client UI and poke the API directly for *their own* row (not anyone
-- else's — RLS still blocks that). That's an acceptable trust level for a party game; this is not
-- hardened against an adversarial participant.

-- ───────────────────────── tables ─────────────────────────

create table if not exists games (
  id text primary key,
  phase text not null default 'lobby',
  deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Who has claimed which name, and whether they're ready. Publicly readable (this is the
-- "public" slice of the game — the same information selectPublic() exposes locally).
create table if not exists players (
  game_id text not null references games(id) on delete cascade,
  participant_id text not null,
  status text not null default 'waiting' check (status in ('waiting', 'joined', 'ready')),
  claimed_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (game_id, participant_id)
);

-- One row per giver: who their Manito is. Private to the giver until the reveal phase.
-- Rows are only ever inserted by begin_draw() below — never directly by a client.
create table if not exists manitos (
  game_id text not null references games(id) on delete cascade,
  giver_id text not null,
  receiver_id text not null,
  primary key (game_id, giver_id)
);

-- One row per participant: their secret task. Same privacy shape as manitos.
create table if not exists tasks (
  game_id text not null references games(id) on delete cascade,
  participant_id text not null,
  task jsonb not null,
  primary key (game_id, participant_id)
);

-- One row per participant: their consequence, only ever shown if they actually fail
-- (FEATURES.consequences). Same privacy shape as manitos/tasks.
create table if not exists punishments (
  game_id text not null references games(id) on delete cascade,
  participant_id text not null,
  punishment jsonb not null,
  primary key (game_id, participant_id)
);

-- One row per participant: their submitted evidence. Owner can always read/write their own;
-- everyone can read everyone's once the reveal phase is reached (the house rules say "everyone
-- reveals their task and shows their proof" — this is the row that makes that true later).
create table if not exists proofs (
  game_id text not null references games(id) on delete cascade,
  participant_id text not null,
  proof jsonb not null,
  submitted_at timestamptz not null default now(),
  primary key (game_id, participant_id)
);

-- ───────────────────────── row level security ─────────────────────────

alter table games enable row level security;
alter table players enable row level security;
alter table manitos enable row level security;
alter table tasks enable row level security;
alter table punishments enable row level security;
alter table proofs enable row level security;

drop policy if exists "games readable" on games;
create policy "games readable" on games for select using (true);

-- Phase/deadline advances are guarded application-side with a compare-and-swap
-- (UPDATE ... WHERE phase = <expected>), so any signed-in player may write here.
drop policy if exists "games advance" on games;
create policy "games advance" on games for update using (true) with check (true);

drop policy if exists "players readable" on players;
create policy "players readable" on players for select using (true);

-- Claim an unclaimed seat, or update a seat you already hold. You can never touch someone
-- else's claimed seat.
drop policy if exists "players claim or update own" on players;
create policy "players claim or update own" on players for update
  using (claimed_by is null or claimed_by = auth.uid())
  with check (claimed_by is null or claimed_by = auth.uid());

-- manitos/tasks/punishments: readable only by the owning player, until the reveal phase, when
-- the whole game can see them. Never directly insertable by a client (see begin_draw() below).
drop policy if exists "manitos own or revealed" on manitos;
create policy "manitos own or revealed" on manitos for select using (
  exists (
    select 1 from players
    where players.game_id = manitos.game_id
      and players.participant_id = manitos.giver_id
      and players.claimed_by = auth.uid()
  )
  or exists (
    select 1 from games
    where games.id = manitos.game_id and games.phase in ('midnight', 'failed', 'punishment', 'complete')
  )
);

drop policy if exists "tasks own or revealed" on tasks;
create policy "tasks own or revealed" on tasks for select using (
  exists (
    select 1 from players
    where players.game_id = tasks.game_id
      and players.participant_id = tasks.participant_id
      and players.claimed_by = auth.uid()
  )
  or exists (
    select 1 from games
    where games.id = tasks.game_id and games.phase in ('midnight', 'failed', 'punishment', 'complete')
  )
);

drop policy if exists "punishments own or revealed" on punishments;
create policy "punishments own or revealed" on punishments for select using (
  exists (
    select 1 from players
    where players.game_id = punishments.game_id
      and players.participant_id = punishments.participant_id
      and players.claimed_by = auth.uid()
  )
  or exists (
    select 1 from games
    where games.id = punishments.game_id and games.phase in ('punishment', 'complete')
  )
);

-- proofs: the owner can read and write their own at any time; everyone can read once revealed.
drop policy if exists "proofs own or revealed" on proofs;
create policy "proofs own or revealed" on proofs for select using (
  exists (
    select 1 from players
    where players.game_id = proofs.game_id
      and players.participant_id = proofs.participant_id
      and players.claimed_by = auth.uid()
  )
  or exists (
    select 1 from games
    where games.id = proofs.game_id and games.phase in ('midnight', 'failed', 'punishment', 'complete')
  )
);

drop policy if exists "proofs insert own" on proofs;
create policy "proofs insert own" on proofs for insert with check (
  exists (
    select 1 from players
    where players.game_id = proofs.game_id
      and players.participant_id = proofs.participant_id
      and players.claimed_by = auth.uid()
  )
);

drop policy if exists "proofs update own" on proofs;
create policy "proofs update own" on proofs for update using (
  exists (
    select 1 from players
    where players.game_id = proofs.game_id
      and players.participant_id = proofs.participant_id
      and players.claimed_by = auth.uid()
  )
);

-- ───────────────────────── the draw ─────────────────────────

-- Generates the pairing, deals one task and one consequence per participant, and moves the
-- game to 'assignment' — all inside one transaction, so two phones tapping "Find our Manitos"
-- at the same moment can never produce two different draws. The row lock on `games` makes the
-- second caller wait for the first to finish, then see phase <> 'ready' and quietly no-op.
--
-- p_tasks / p_punishments are the app's own catalogs (GAME_CONFIG.tasks / .punishments), passed
-- in as jsonb so this function never has to duplicate that content in SQL.
create or replace function begin_draw(
  p_game_id text,
  p_tasks jsonb,
  p_punishments jsonb,
  p_deadline_ms bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phase text;
  v_ids text[];
  v_n int;
  v_perm text[];
  v_ok boolean;
  v_swap text;
  fy_i int;
  fy_j int;
  v_tasks jsonb[];
  v_punishments jsonb[];
  v_tcount int;
  v_pcount int;
  v_attempt int;
begin
  select phase into v_phase from games where id = p_game_id for update;
  if v_phase is distinct from 'ready' then
    return; -- someone already drew, or the lobby isn't ready yet: no-op
  end if;

  select array_agg(participant_id order by participant_id) into v_ids
  from players where game_id = p_game_id;

  v_n := coalesce(array_length(v_ids, 1), 0);
  if v_n < 2 then
    return;
  end if;

  -- random derangement by rejection sampling (same approach as the TS version in assignments.ts)
  v_ok := false;
  for v_attempt in 1..200 loop
    v_perm := v_ids;
    for fy_i in reverse v_n..2 loop
      fy_j := 1 + floor(random() * fy_i)::int;
      v_swap := v_perm[fy_i];
      v_perm[fy_i] := v_perm[fy_j];
      v_perm[fy_j] := v_swap;
    end loop;
    v_ok := true;
    for fy_i in 1..v_n loop
      if v_perm[fy_i] = v_ids[fy_i] then
        v_ok := false;
      end if;
    end loop;
    exit when v_ok;
  end loop;

  if not v_ok then
    -- guaranteed single-cycle rotation (position i's receiver is position i+1, wrapping): a
    -- rotation by one is always a derangement for n >= 2, so nobody ever maps to herself here
    select array_agg(v_ids[(gi % v_n) + 1] order by gi) into v_perm
    from generate_series(1, v_n) gi;
  end if;

  insert into manitos (game_id, giver_id, receiver_id)
  select p_game_id, v_ids[gi], v_perm[gi] from generate_series(1, v_n) gi;

  select array_agg(elem order by random()) into v_tasks from jsonb_array_elements(p_tasks) elem;
  select array_agg(elem order by random()) into v_punishments from jsonb_array_elements(p_punishments) elem;
  v_tcount := array_length(v_tasks, 1);
  v_pcount := array_length(v_punishments, 1);

  insert into tasks (game_id, participant_id, task)
  select p_game_id, v_ids[gi], v_tasks[1 + ((gi - 1) % v_tcount)]
  from generate_series(1, v_n) gi;

  insert into punishments (game_id, participant_id, punishment)
  select p_game_id, v_ids[gi], v_punishments[1 + ((gi - 1) % v_pcount)]
  from generate_series(1, v_n) gi;

  update games
    set phase = 'assignment',
        deadline = case when p_deadline_ms is null then null else to_timestamp(p_deadline_ms / 1000.0) end,
        updated_at = now()
    where id = p_game_id;
end;
$$;

grant execute on function begin_draw(text, jsonb, jsonb, bigint) to anon, authenticated;

-- ───────────────────────── restart ─────────────────────────

-- Wipes the private tables and hands every seat back, then returns the game to the lobby.
-- Used by both "Play again" (from complete) and "Restart the game" (from anywhere).
create or replace function restart_game(p_game_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from manitos where game_id = p_game_id;
  delete from tasks where game_id = p_game_id;
  delete from punishments where game_id = p_game_id;
  delete from proofs where game_id = p_game_id;
  update players set status = 'waiting', claimed_by = null, updated_at = now() where game_id = p_game_id;
  update games set phase = 'lobby', deadline = null, updated_at = now() where id = p_game_id;
end;
$$;

grant execute on function restart_game(text) to anon, authenticated;

-- ───────────────────────── seed ─────────────────────────

-- The app only ever talks to a single shared room, 'default'. Re-running this is harmless.
insert into games (id, phase) values ('default', 'lobby')
  on conflict (id) do nothing;

insert into players (game_id, participant_id, status)
select 'default', p.id, 'waiting'
from (values ('tia'), ('lola'), ('ore'), ('ope'), ('dumade')) as p(id)
on conflict (game_id, participant_id) do nothing;

-- ───────────────────────── realtime ─────────────────────────

-- Lets clients subscribe to live changes on these tables. If your project already has the
-- supabase_realtime publication (most do by default), this adds these five tables to it.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'games'
  ) then
    alter publication supabase_realtime add table games;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players'
  ) then
    alter publication supabase_realtime add table players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'manitos'
  ) then
    alter publication supabase_realtime add table manitos;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table tasks;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'proofs'
  ) then
    alter publication supabase_realtime add table proofs;
  end if;
end $$;
