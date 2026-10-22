import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const controlClass =
  'w-full rounded-card border border-primary bg-card px-4 font-sans text-md text-primary ' +
  'aria-invalid:border-danger disabled:opacity-60'

type FieldShellProps = {
  id: string
  label: string
  hint?: string
  error?: string | null
  children: React.ReactNode
}

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-label text-primary">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="font-hand text-lg leading-tight text-primary">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="font-sans text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

const describedBy = (id: string, hint?: string, error?: string | null) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string | null
}

export function TextField({ label, hint, error, id, className = '', ...props }: TextFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={`${controlClass} h-control-h ${className}`}
        {...props}
      />
    </FieldShell>
  )
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  hint?: string
  error?: string | null
}

export function TextAreaField({ label, hint, error, id, className = '', ...props }: TextAreaFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={`${controlClass} min-h-control-h py-3 leading-normal ${className}`}
        {...props}
      />
    </FieldShell>
  )
}
