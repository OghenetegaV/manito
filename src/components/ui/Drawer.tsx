import { Dialog, type DialogProps } from "./Dialog";

/** Side panel on larger screens, bottom sheet on phones. */
export function Drawer(props: DialogProps) {
  return <Dialog {...props} placement="side" />;
}
