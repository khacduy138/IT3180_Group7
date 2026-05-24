import * as React from 'react';
import { cn } from '../../lib/utils';

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

  if (!open) return null;

  return (
    <ModalContext.Provider value={{ onOpenChange }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={() => onOpenChange?.(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
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
