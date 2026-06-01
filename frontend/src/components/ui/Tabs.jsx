import * as React from "react";
import { cn } from "../../lib/utils";

const TabsContext = React.createContext(null);

const Tabs = React.forwardRef(({ className, defaultValue, value, onValueChange, ...props }, ref) => {
  const [localValue, setLocalValue] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : localValue;

  const setActiveTab = React.useCallback((val) => {
    if (!isControlled) setLocalValue(val);
    if (onValueChange) onValueChange(val);
  }, [isControlled, onValueChange]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div ref={ref} className={cn("w-full", className)} {...props} />
    </TabsContext.Provider>
  );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef(({ className, children, ...props }, ref) => {
  const { activeTab } = React.useContext(TabsContext);
  const listRef = React.useRef(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState({});

  React.useLayoutEffect(() => {
    const container = listRef.current;
    if (!container || !activeTab) return;

    const activeTrigger = container.querySelector(`[data-tabs-trigger="${activeTab}"]`);
    if (!activeTrigger) return;

    setIndicatorStyle({
      left: activeTrigger.offsetLeft,
      top: activeTrigger.offsetTop,
      width: activeTrigger.offsetWidth,
      height: activeTrigger.offsetHeight,
    });
  }, [activeTab, children]);

  return (
    <div
      ref={(node) => {
        listRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn(
        "relative inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="absolute rounded-sm bg-background shadow-sm transition-all duration-300 ease-out"
        style={indicatorStyle}
      />
      {children}
    </div>
  );
});
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className, value, ...props }, ref) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      data-tabs-trigger={value}
      onClick={() => setActiveTab(value)}
      className={cn(
        "relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const { activeTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      ref={ref}
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };