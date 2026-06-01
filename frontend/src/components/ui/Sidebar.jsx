import { NavigationMenuItem } from './NavigationMenuItem';
import { TOP_BAR_ITEMS } from './topBarConfig';
import { Card, CardHeader, CardTitle, CardBody } from './Card';
import PresenceTransition from './PresenceTransition';
import { cn } from '../../lib/utils';

export default function Sidebar({ open }) {
  const userRole = localStorage.getItem('userRole') || 'customer';
  const visibleItems = TOP_BAR_ITEMS.filter((item) => item.allowedRoles.includes(userRole));

  return (
    <PresenceTransition open={open} exitDuration={300}>
      {({ isOpen }) => (
        <aside
          className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 px-4 py-4"
          aria-hidden={!isOpen}
        >
          <div
            className={cn(
              'flex h-full flex-col gap-6 overflow-y-auto border border-border bg-background/90 transition-all duration-300 ease-out',
              isOpen
                ? 'translate-x-0 opacity-100 blur-0 pointer-events-auto'
                : '-translate-x-full opacity-0 blur-xl pointer-events-none'
            )}
          >
            <div className="space-y-2 p-2">
              {visibleItems.map((item) => (
                <NavigationMenuItem
                  key={item.path}
                  onClick={() => window.open(item.path, '_self')}
                  style={{ justifyContent: 'flex-start' }}
                  className="flex w-full rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {item.icon && <item.icon />}
                  {item.label}
                </NavigationMenuItem>
              ))}
            </div>

            <div className="mt-auto space-y-3 p-2 pb-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Quick Actions</h3>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>New Notice</CardTitle>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-muted-foreground">
                    Some thin asjdnlXKmasnfm d sdf sd fd fse  sdcs 
                  </p>
                </CardBody>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>New Payment</CardTitle>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-muted-foreground">
                    Some thin asjdnlXKmasnfm d sdf sd fd fse  sdcs 
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>
        </aside>
      )}
    </PresenceTransition>
  );
}
