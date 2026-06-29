import type { ReactNode } from 'react';

interface ContactFormFieldProps {
  readonly label: string;
  readonly htmlFor: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly children: ReactNode;
}

export function ContactFormField({
  label,
  htmlFor,
  required = false,
  error,
  children,
}: ContactFormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
