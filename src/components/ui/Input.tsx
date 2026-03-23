interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-text-mid uppercase tracking-wider">
          {label}
          {props.required && <span className="text-accent ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 bg-surface border rounded-lg text-sm text-text-primary placeholder-text-faint focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all ${
          error ? 'border-red-400' : 'border-border-mid focus:border-accent'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
