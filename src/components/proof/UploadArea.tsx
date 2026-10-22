import { useId, useRef, useState, type DragEvent } from "react";
import { Doodle } from "@/components/decor/Doodles";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/game/mediaUtils";
import type { ProofMedia } from "@/game/types";
import "./proof.css";

type UploadAreaProps = {
  media?: ProofMedia;
  busy?: boolean;
  error?: string;
  /** Restricts the file picker/drop target. Defaults to accepting either. */
  accept?: string;
  /** Hint line under the drop zone. Defaults to a generic video-or-photo note. */
  hint?: string;
  onFile: (file: File) => void;
  onClear: () => void;
};

/** Drop zone with a real file input behind it, so keyboard and screen-reader users are covered. */
export function UploadArea({ media, busy, error, accept = "video/*,image/*", hint, onFile, onClear }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [dragging, setDragging] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="upload">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-describedby={hintId}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />

      {media ? (
        <figure className="upload__preview">
          {media.url && media.kind === "video" && <video src={media.url} controls playsInline preload="metadata" aria-label="Your video" />}
          {media.url && media.kind === "image" && <img src={media.url} alt="Your photo, as it will be submitted" />}
          {!media.url && (
            <p className="upload__gone">
              Your video is saved on this device but can't be previewed after a refresh.
            </p>
          )}
          <figcaption>
            <span className="upload__file">
              {media.name} · {formatBytes(media.size)}
            </span>
            <Button variant="quiet" onClick={onClear}>
              Remove
            </Button>
          </figcaption>
        </figure>
      ) : (
        <div
          className={`upload__drop ${dragging ? "is-dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <Doodle name="sparkle" size={28} className="upload__spark" />
          <p className="eyebrow">
            {busy ? "Getting it ready…" : accept === "video/*" ? "Drop your video here" : accept === "image/*" ? "Drop your photo here" : "Drop your video or photo here"}
          </p>
          <p className="upload__or hand">or</p>
          <Button variant="ghost" onClick={() => inputRef.current?.click()} loading={busy}>
            Choose file
          </Button>
        </div>
      )}

      <p id={hintId} className="upload__hint" role={error ? "alert" : undefined} data-error={!!error}>
        {error ?? hint ?? "Don't film or photograph strangers' faces without their permission."}
      </p>
    </div>
  );
}
