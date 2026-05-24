import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const cardSizes = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const Card = forwardRef(({ className, size = 'md', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border border-border bg-background text-foreground shadow-sm',
      cardSizes[size] || cardSizes.md,
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-1', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-sm font-medium text-muted-foreground', className)} {...props}>
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

const CardValue = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-3xl font-semibold leading-none tracking-tight', className)} {...props} />
));
CardValue.displayName = 'CardValue';

const CardBody = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-4', className)} {...props} />
));
CardBody.displayName = 'CardBody';

const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-4 border-t border-border pt-4', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardValue, CardBody, CardFooter };
