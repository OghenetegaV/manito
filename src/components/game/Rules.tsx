import { RULES } from "@/config/gameConfig";
import "./game.css";

export function Rules() {
  return (
    <div className="rules">
      <p className="rules__intro">{RULES.tagline}</p>

      <p className="eyebrow eyebrow--accent">How it works</p>
      <ol className="rules__steps">
        {RULES.steps.map((step) => (
          <li key={step.title}>
            <span className="rules__step-title">{step.title}</span>
            {step.body}
          </li>
        ))}
      </ol>

      <p className="rules__note rules__note--golden">
        <span className="hand">{RULES.golden.title}</span>
        {RULES.golden.body}
      </p>
    </div>
  );
}
