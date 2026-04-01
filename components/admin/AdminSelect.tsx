import React from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
  optionalLabel?: string;
  helperText?: string;
}

export const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  (
    {
      label,
      error,
      id,
      children,
      optional,
      optionalLabel,
      helperText,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div>
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {optional && (
            <span className="ml-1 text-slate-400">
              {optionalLabel || "(Opsional)"}
            </span>
          )}
        </label>
        <select
          id={id}
          ref={ref}
          className={cn(
            "block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm",
            className,
            error && "border-red-500",
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  },
);

AdminSelect.displayName = "AdminSelect";
export default AdminSelect;
