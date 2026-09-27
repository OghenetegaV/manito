import { formatBytes } from "@/game/mediaUtils";
import type { Proof } from "@/game/types";
import "./proof.css";

/** "EVIDENCE RECEIVED." plus a quiet echo of what was sent. Visible only to its owner. */
export function ProofStatus({ proof }: { proof: Proof }) {
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(proof.submittedAt);
  const { media } = proof;

  return (
    <div className="pstatus" role="status">
      <span className="stamp pstatus__stamp" aria-hidden="true">
        Received
      </span>
      <p className="eyebrow eyebrow--accent">Logged at {time}</p>
      {media.url && media.kind === "video" && <video className="pstatus__media" src={media.url} controls playsInline preload="metadata" aria-label="The video you submitted" />}
      {media.url && media.kind === "image" && <img className="pstatus__media" src={media.url} alt="The photo you submitted" />}
      <p className="pstatus__file">
        {media.name} · {formatBytes(media.size)}
      </p>
      {!media.url && <p className="pstatus__note">The preview is gone after a refresh, but your file is logged.</p>}
      {proof.note && <p className="pstatus__note">“{proof.note}”</p>}
    </div>
  );
}
