import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { GAME_CONFIG } from "@/config/gameConfig";
import "./layout.css";

type State = { error: Error | null };

/**
 * On-brand, but honest: the real error message stays visible.
 * "Try again" re-renders; if the saved game itself is what's broken, "Start over" clears it.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("MANITO error:", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  private startOver = () => {
    try {
      window.localStorage.removeItem(GAME_CONFIG.storageKey);
    } catch {
      // nothing to clear
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="boot" role="alert">
        <div className="boot__inner">
          <p className="eyebrow eyebrow--accent">MANITO</p>
          <h1 className="display display-md">Something went wrong.</h1>
          <p className="lede">The Game Master is not impressed.</p>
          <p className="error-detail">{this.state.error.message}</p>
          <div className="actions">
            <Button arrow onClick={this.reset}>
              Try again
            </Button>
            <Button variant="ghost" onClick={this.startOver}>
              Start over
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
