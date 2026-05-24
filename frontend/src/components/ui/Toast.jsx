import * as React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import PresenceTransition from './PresenceTransition';

const toastVariants = {
  success: {
    icon: CheckCircle2,
    accent: 'bg-green-foreground text-green',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'bg-yellow-foreground text-yellow',
  },
  error: {
    icon: XCircle,
    accent: 'bg-red-foreground text-red',
  },
};

const Toast = ({
  open,
  onOpenChange,
  variant = 'success',
  title,
  description,
  duration = 3000,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(open);

  React.useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  React.useEffect(() => {
    if (!internalOpen) return undefined;

    const timer = window.setTimeout(() => {
      onOpenChange?.(false);
      setInternalOpen(false);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [internalOpen, duration, onOpenChange]);

  const handleOpenChange = (nextOpen) => {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const variantConfig = toastVariants[variant] || toastVariants.success;
  const Icon = variantConfig.icon;

  return (
    <PresenceTransition open={internalOpen} exitDuration={300}>
      {({ isOpen }) => (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm p-4">
          <div
            className={cn(
              'overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-sm transition-all duration-300 ease-out will-change-[transform,opacity,filter]',
              isOpen
                ? 'translate-y-0 scale-100 opacity-100 blur-0'
                : 'translate-y-2 scale-95 opacity-0 blur-xl'
            )}
          >
            <div className={cn('flex items-start gap-3 px-4 py-3', variantConfig.accent)}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{title}</div>
                {description ? <div className="mt-1 text-sm opacity-90">{description}</div> : null}
              </div>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="rounded-md p-1 opacity-80 transition hover:opacity-100"
                aria-label="Close toast"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </PresenceTransition>
  );
};

export { Toast };
