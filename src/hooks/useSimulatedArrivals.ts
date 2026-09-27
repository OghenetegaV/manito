import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";
import { shuffle } from "@/game/assignments";
import { useGameDispatch, usePublicGame } from "@/game/GameProvider";

/**
 * PREVIEW ONLY. With no backend there are no other players, so once you've taken your seat
 * the other four "arrive" and ready up on a staggered schedule. Replace this hook with
 * real presence updates and nothing else in the lobby has to change.
 */
export function useSimulatedArrivals(active: boolean) {
  const game = usePublicGame();
  const dispatch = useGameDispatch();
  const toast = useToast();

  const presenceRef = useRef(game.presence);
  presenceRef.current = game.presence;
  const me = game.currentUserId;
  const participants = game.participants;

  useEffect(() => {
    if (!active || !me) return;

    const timers: number[] = [];
    let t = 500;
    for (const p of shuffle(participants.filter((x) => x.id !== me))) {
      const current = presenceRef.current[p.id];
      t += 600 + Math.random() * 700;
      if (current === "waiting") {
        timers.push(
          window.setTimeout(() => {
            dispatch({ type: "JOIN", id: p.id });
            toast.push(`${p.name} is in`);
          }, t),
        );
      }
      if (current !== "ready") {
        timers.push(
          window.setTimeout(() => dispatch({ type: "SET_READY", id: p.id }), t + 1100 + Math.random() * 1300),
        );
      }
    }
    return () => timers.forEach(window.clearTimeout);
  }, [active, me, participants, dispatch, toast]);
}
