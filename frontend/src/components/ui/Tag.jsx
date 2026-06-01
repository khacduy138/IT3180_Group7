import { cn } from '../../lib/utils';

const tagVariants = {
  red: 'bg-red text-red-foreground border-red-foreground',
  yellow: 'bg-yellow text-yellow-foreground border-yellow-foreground',
  green: 'bg-green text-green-foreground border-green-foreground',
};

export function Tag({ color = 'green', className = '', children, ...props }) {
  return (
    <span
      className={cn(
        'border border-border inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-none',
        tagVariants[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
