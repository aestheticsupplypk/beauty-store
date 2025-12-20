"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
};

export function PendingButton({ children, className, pendingLabel }: Props) {
  const { pending } = useFormStatus();
  const label = pending ? pendingLabel || "Saving" : children;
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
    >
      {label}
    </button>
  );
}
