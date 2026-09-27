import { Dialog, type DialogProps } from "./Dialog";

/** Centered on larger screens, bottom sheet on phones. */
export function Modal(props: DialogProps) {
  return <Dialog {...props} placement="center" />;
}
