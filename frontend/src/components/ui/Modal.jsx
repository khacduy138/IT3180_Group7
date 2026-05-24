import * as React from 'react';
import { cn } from '../../lib/utils';
import PresenceTransition from './PresenceTransition';

const ModalContext = React.createContext(null);

const useModal = () => {
  const context = React.useContext(ModalContext);

  if (!context) {
    throw new Error('Modal components should be used within <Modal>');
  }

  return context;
};

const Modal = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onOpenChange?.(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  return (
    <PresenceTransition open={open} exitDuration={300}>
      {({ isOpen }) => (
        <ModalContext.Provider value={{ onOpenChange }}>
          <div
            className={cn(
              'fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out',
              isOpen
                ? 'bg-black/45 backdrop-blur-xl opacity-100'
                : 'bg-black/0 backdrop-blur-0 opacity-0'
            )}
            onClick={() => onOpenChange?.(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className={cn(
                'w-full max-w-lg overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-lg transition-all duration-300 ease-out will-change-[transform,opacity,filter]',
                isOpen
                  ? 'translate-y-0 scale-100 opacity-100 blur-0'
                  : 'translate-y-2 scale-95 opacity-0 blur-xl'
              )}
              onClick={(event) => event.stopPropagation()}
            >
              {children}
            </div>
          </div>
        </ModalContext.Provider>
      )}
    </PresenceTransition>
  );
};

const ModalHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('border-b border-border px-4 py-3 text-base font-semibold', className)}
    {...props}
  />
));
ModalHeader.displayName = 'ModalHeader';

const ModalBody = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-4 py-3', className)} {...props} />
));
ModalBody.displayName = 'ModalBody';

const ModalFooter = React.forwardRef(({ className, ...props }, ref) => {
  useModal();

  return (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-2 border-t border-border px-4 py-3', className)}
      {...props}
    />
  );
});
ModalFooter.displayName = 'ModalFooter';

export { Modal, ModalHeader, ModalBody, ModalFooter, useModal };
