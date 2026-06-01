import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-ring",
        error: "border-red focus-visible:ring-red text-red-foreground placeholder:text-red/60",
        success: "border-green focus-visible:ring-green text-green-foreground placeholder:text-green/60",
        warning: "border-yellow focus-visible:ring-yellow text-yellow-foreground placeholder:text-yellow/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Input = React.forwardRef(({ className, type, variant, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(inputVariants({ variant, className }))}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input, inputVariants };