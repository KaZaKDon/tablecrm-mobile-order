import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border bg-white px-4 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-primary",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
