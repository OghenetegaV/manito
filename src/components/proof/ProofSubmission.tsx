import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Countdown } from "@/components/tasks/Countdown";
import { FEATURES } from "@/config/gameConfig";
import { useGameDispatch, usePrivateGame, usePublicGame } from "@/game/GameProvider";
import { fileToProofMedia, MediaError } from "@/game/mediaUtils";
import { fillTemplate } from "@/game/missionTemplate";
import type { ProofMedia } from "@/game/types";
import { audio } from "@/services/audio";
import { ProofStatus } from "./ProofStatus";
import { UploadArea } from "./UploadArea";
import "./proof.css";

/** PROVE IT. One video or photo, for whichever mission you opened, and an optional note. */
export function ProofSubmission() {
  const secret = usePrivateGame();
  const { deadline } = usePublicGame();
  const dispatch = useGameDispatch();

  const editing = secret?.editing;
  const existing = editing?.proof;
  const [editingExisting, setEditingExisting] = useState(false);
  const [note, setNote] = useState(existing?.note ?? "");
  const [media, setMedia] = useState<ProofMedia | undefined>(existing?.media);
  const [busy, setBusy] = useState(false);
  const [mediaError, setMediaError] = useState<string>();

  if (!editing) return null;
  const { mission } = editing;
  const manitoName = secret?.manito?.name;
  const kindWord = mission.proofRequired === "video" ? "video" : "photo";
  const missionTitle = manitoName ? fillTemplate(mission.title, manitoName) : mission.title;

  const takeFile = async (file: File) => {
    setMediaError(undefined);
    setBusy(true);
    try {
      const taken = await fileToProofMedia(file);
      const wantsVideo = mission.proofRequired === "video";
      if (wantsVideo !== (taken.kind === "video")) {
        setMediaError(`This mission needs a ${kindWord}, not a ${wantsVideo ? "photo" : "video"}.`);
        return;
      }
      setMedia(taken);
    } catch (err) {
      setMediaError(err instanceof MediaError ? err.message : "Something went wrong with that file.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!media) return;
    dispatch({
      type: "SUBMIT_PROOF",
      missionId: mission.id,
      proof: { note: note.trim() || undefined, media, submittedAt: Date.now() },
    });
    audio.play("proof_submitted");
    setEditingExisting(false);
  };

  /* ---- received ---- */
  if (existing && !editingExisting) {
    return (
      <section className="scene proof" aria-labelledby="proof-title">
        <div className="stack">
          <p className="eyebrow eyebrow--accent">{missionTitle}</p>
          <h1 id="proof-title" className="display display-lg">
            EVIDENCE RECEIVED.
          </h1>
        </div>
        <ProofStatus proof={existing} />
        <div className="actions">
          <Button variant="ghost" onClick={() => setEditingExisting(true)}>
            Replace evidence
          </Button>
          <Button size="lg" arrow onClick={() => dispatch({ type: "CLOSE_PROOF" })}>
            Done
          </Button>
        </div>
      </section>
    );
  }

  /* ---- form ---- */
  return (
    <section className="scene proof" aria-labelledby="proof-title">
      <div className="stack">
        <p className="eyebrow eyebrow--accent">{missionTitle}</p>
        <h1 id="proof-title" className="display display-lg">
          PROVE IT.
        </h1>
        <p className="lede">Upload your {kindWord}.</p>
      </div>

      <form className="proof__form" onSubmit={submit} noValidate>
        <UploadArea
          media={media}
          busy={busy}
          error={mediaError}
          accept={mission.proofRequired === "video" ? "video/*" : "image/*"}
          hint={
            mission.proofRequired === "video"
              ? "Don't film strangers' faces without their permission."
              : "Don't photograph strangers' faces without their permission."
          }
          onFile={takeFile}
          onClear={() => setMedia(undefined)}
        />

        <label className="field">
          <span className="eyebrow">A short note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={140}
            placeholder="How did it go?"
          />
        </label>

        <div className="proof__submit">
          <Button size="lg" arrow type="submit" disabled={!media || busy}>
            Submit evidence
          </Button>
          <Button
            variant="quiet"
            onClick={() => (existing ? setEditingExisting(false) : dispatch({ type: "CLOSE_PROOF" }))}
          >
            {existing ? "Keep what I sent" : "Back to my missions"}
          </Button>
        </div>
      </form>

      {FEATURES.schedule && deadline !== undefined && <Countdown deadline={deadline} size="md" label="Still counting" />}
    </section>
  );
}
