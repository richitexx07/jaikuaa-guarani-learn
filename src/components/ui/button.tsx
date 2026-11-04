import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",

  {
    variants: {
      variant: {
        default: "btn-3d [--btn-base:var(--primary)] bg-primary text-primary-foreground hover:bg-primary/90 mb-1",
        destructive: "btn-3d [--btn-base:var(--destructive)] bg-destructive text-destructive-foreground hover:bg-destructive/90 mb-1",
        outline:
          "btn-3d [--btn-base:var(--border)] border border-input bg-background hover:bg-secondary mb-1",
        secondary: "btn-3d [--btn-base:var(--border)] bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-1",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "btn-3d [--btn-base:var(--accent)] bg-accent text-accent-foreground hover:bg-accent/90 mb-1",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { onPointerDown, ...rest } = props;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => {
          // Toque físico corto en la mano (si el celular lo permite)
          if (variant !== "link" && variant !== "ghost") {
            try { navigator.vibrate?.(10); } catch { /* sin vibración */ }
          }
          onPointerDown?.(e);
        }}
        {...rest}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
