import { formatUnit, useCountdown } from "@/hooks/useCountdown";
import "./tasks.css";

type CountdownProps = {
  deadline: number | undefined;
  size?: "lg" | "md";
  label?: string;
};

/**
 * TIME REMAINING  02 : 14 : 36
 * Updates in real time. Intensity rises gently as the deadline nears (colour and a slow
 * breathing colon), and never flashes.
 */
export function Countdown({ deadline, size = "lg", label = "Time remaining" }: CountdownProps) {
  const c = useCountdown(deadline);
  const spoken = `${c.hours} hours, ${c.minutes} minutes, ${c.seconds} seconds remaining`;

  return (
    <div className={`countdown countdown--${size}`} data-urgency={c.urgency}>
      <p className="eyebrow countdown__label">{label}</p>
      <div className="countdown__digits numeral" role="timer" aria-label={spoken} aria-live="off">
        <Unit value={formatUnit(c.hours)} caption="Hours" />
        <span className="countdown__sep" aria-hidden="true">
          :
        </span>
        <Unit value={formatUnit(c.minutes)} caption="Minutes" />
        <span className="countdown__sep" aria-hidden="true">
          :
        </span>
        <Unit value={formatUnit(c.seconds)} caption="Seconds" />
      </div>
    </div>
  );
}

function Unit({ value, caption }: { value: string; caption: string }) {
  return (
    <span className="countdown__unit" aria-hidden="true">
      <span className="countdown__num">{value}</span>
      <span className="countdown__caption">{caption}</span>
    </span>
  );
}
