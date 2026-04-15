export default function Select({
  label,
  error,
  className = '',
  id,
  required,
  children,
  placeholder,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={`
          w-full px-3 py-2 text-sm border rounded-lg bg-white
          transition-colors cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:ring-red-300/30 focus:border-red-400' : 'border-gray-300'}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
