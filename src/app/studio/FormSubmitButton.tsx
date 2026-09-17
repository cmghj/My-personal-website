"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

type FormSubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  idleLabel: string;
  pendingLabel: string;
};

export default function FormSubmitButton({
  idleLabel,
  pendingLabel,
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={disabled || pending} {...props}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
