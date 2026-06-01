import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium text-sm leading-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2',
        outline: 'border border-border bg-background text-foreground hover:bg-accent rounded-md px-4 py-2',
        subtle: 'bg-secondary text-foreground hover:bg-secondary/70 rounded-md px-4 py-2',
        'subtle-disabled': 'bg-secondary text-muted-foreground rounded-md px-4 py-2 opacity-60 cursor-not-allowed',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md px-4 py-2',
        link: 'text-foreground underline-offset-4 hover:underline px-0',
        'with-icon': 'border border-border bg-background text-foreground hover:bg-accent rounded-md px-4 py-2',
        'icon-square': 'border border-border bg-background text-foreground hover:bg-accent rounded-md w-9 h-9 p-0',
        'icon-circle': 'border border-border bg-background text-foreground hover:bg-accent rounded-full w-9 h-9 p-0',
        loading: 'border border-border bg-background text-foreground rounded-md px-4 py-2 cursor-wait',
      },
      size: {
        default: '',
        sm: 'text-xs',
        lg: 'text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = forwardRef(({ className, variant, size, ...props }, ref) => {
  const Comp = 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

export { Button, buttonVariants };