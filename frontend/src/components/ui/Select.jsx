import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { buttonVariants } from './Button';
import { cn } from '../../lib/utils';

const selectVariants = buttonVariants;

const Select = React.forwardRef(({
  className,
  variant = 'outline',
  size = 'default',
  options = [],
  placeholder = 'Select an option',
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  name,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}, ref) => {
  const isControlled = value !== undefined;
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const rootRef = React.useRef(null);

  const selectedValue = isControlled ? value : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);

  React.useEffect(() => {
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const updateValue = (nextValue) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    if (onValueChange) {
      onValueChange(nextValue);
    }

    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={ref}
        type="button"
        id={id}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        data-invalid={ariaInvalid ? 'true' : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          selectVariants({ variant, size, className }),
          'w-full justify-between pr-4 text-left'
        )}
        onClick={() => setOpen((current) => !current)}
        {...props}
      >
        <span className={cn('truncate', !selectedOption && 'text-muted-foreground')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {name ? <input type="hidden" name={name} value={selectedValue ?? ''} /> : null}

      <div
        className={cn(
          'absolute left-0 right-0 top-full z-50 mt-2 origin-top overflow-hidden rounded-md border border-border bg-background shadow-lg shadow-black/5 transition-all duration-200 ease-out',
          open ? 'max-h-72 translate-y-0 scale-y-100 opacity-100' : 'pointer-events-none max-h-0 -translate-y-1 scale-y-95 opacity-0'
        )}
      >
        <div role="listbox" className="max-h-72 overflow-auto p-1">
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-all duration-150',
                  'hover:bg-accent hover:text-accent-foreground',
                  isSelected && 'bg-primary text-primary-foreground'
                )}
                onClick={() => updateValue(option.value)}
              >
                <span className="truncate">{option.label}</span>
                {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

Select.displayName = 'Select';

export { Select, selectVariants };