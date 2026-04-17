import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "destructive";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        variant === "default" && "bg-primary text-primary-foreground shadow-soft hover:opacity-95",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === "outline" && "border bg-white hover:bg-slate-50",
        variant === "destructive" && "bg-destructive text-destructive-foreground",
        className,
      )}
      {...props}
    />
  );
}
