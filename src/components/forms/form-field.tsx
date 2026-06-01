"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string | { message?: string };
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

export function FormField({
  label,
  htmlFor,
  error,
  children,
  className,
  required,
}: FormFieldProps) {
  const errorMessage = typeof error === "string"
    ? error
    : error?.message;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}