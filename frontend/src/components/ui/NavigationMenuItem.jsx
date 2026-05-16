import { forwardRef } from 'react';
import { cn } from '../../lib/utils';


const NavigationMenuItem = forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium text-sm leading-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0', className)}
      ref={ref}
      {...props}
    />
  );
});

export { NavigationMenuItem };