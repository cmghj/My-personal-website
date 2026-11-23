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
  const { pending, data } = useFormStatus();
  const active = pending && (!props.name || (data?.get(props.name) ?? "") === props.value);

  return (
    <button type="submit" disabled={disabled || pending} {...props}>
      {active ? pendingLabel : idleLabel}
    </button>
  );
}
