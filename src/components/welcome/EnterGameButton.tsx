import { Button } from "@/components/ui/Button";

export function EnterGameButton({ onEnter, disabled }: { onEnter: () => void; disabled?: boolean }) {
  return (
    <Button size="lg" arrow onClick={onEnter} disabled={disabled}>
      Enter the game
    </Button>
  );
}
