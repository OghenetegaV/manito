import { RULES } from "@/config/gameConfig";
import "./game.css";

/** The house rules, straight from the Secret Task Challenge brief. */
export function Rules() {
  return (
    <div className="rules">
      <p className="rules__intro">{RULES.intro}</p>

      <p className="eyebrow eyebrow--accent">How it works</p>
      <ol className="rules__steps">
        {RULES.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <p className="rules__note rules__note--bonus">
        <span className="hand">Bonus</span>
        {RULES.bonus}
      </p>

      <p className="rules__note rules__note--golden">
        <span className="hand">Most important rule</span>
        {RULES.golden}
      </p>
    </div>
  );
}
