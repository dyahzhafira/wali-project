"use client";
import { forwardRef, useId } from "react";
import { cn } from "./cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, containerClassName, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className={cn("flex flex-col gap-1", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}{required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref} id={inputId} required={required} aria-invalid={!!error}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-wali-500 focus:border-wali-500",
            "disabled:cursor-not-allowed disabled:bg-gray-50",
            error ? "border-red-400" : "border-gray-300",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p role="alert" className="text-xs text-red-600">⚠ {error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
