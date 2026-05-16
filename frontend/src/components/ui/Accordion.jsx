import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./Button"; 

const AccordionContext = React.createContext(null);
const AccordionItemContext = React.createContext(null);

const Accordion = React.forwardRef(({ className, value, defaultValue, onValueChange, ...props }, ref) => {
  const [localValue, setLocalValue] = React.useState(defaultValue || "");
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : localValue;

  const toggleItem = React.useCallback((itemValue) => {
    const newValue = activeValue === itemValue ? "" : itemValue;
    if (!isControlled) setLocalValue(newValue);
    if (onValueChange) onValueChange(newValue);
  }, [activeValue, isControlled, onValueChange]);

  return (
    <AccordionContext.Provider value={{ activeValue, toggleItem }}>
      <div ref={ref} className={cn("w-full", className)} {...props} />
    </AccordionContext.Provider>
  );
});
Accordion.displayName = "Accordion";


const accordionItemVariants = cva("border-border", {
  variants: {
    variant: {
      default: "border-b last:border-b-0",
      "no-border": "border-none",         
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const AccordionItem = React.forwardRef(({ className, value, variant, ...props }, ref) => {
  const context = React.useContext(AccordionContext);
  const isOpen = context?.activeValue === value;

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div
        ref={ref}
        data-state={isOpen ? "open" : "closed"}
        className={cn(accordionItemVariants({ variant }), className)}
        {...props}
      />
    </AccordionItemContext.Provider>
  );
});
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef(({ className, variant = "link", size, children, ...props }, ref) => {
  const { toggleItem } = React.useContext(AccordionContext);
  const { value, isOpen } = React.useContext(AccordionItemContext);

  return (
    <div className="flex">
      <button
        ref={ref}
        type="button"
        onClick={() => toggleItem(value)}
        data-state={isOpen ? "open" : "closed"}
        className={cn(
          buttonVariants({ variant, size }),
          "flex flex-1 items-center justify-between py-4 font-medium transition-all text-left w-full hover:no-underline focus-visible:ring-2",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown 
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground",
            isOpen && "rotate-180"
          )} 
        />
      </button>
    </div>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isOpen } = React.useContext(AccordionItemContext);

  return (
    <div
      ref={ref}
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "overflow-hidden text-sm transition-all duration-200 ease-in-out",
        isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
      )}
      {...props}
    >
      <div className={cn("pb-4 pt-0 text-muted-foreground", className)}>
        {children}
      </div>
    </div>
  );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };