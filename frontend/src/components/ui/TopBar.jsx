import { NavigationMenuItem} from './NavigationMenuItem';
import {Input} from './Input';
import { Avatar, AvatarImage, AvatarFallback } from './Avatar';
import { Settings, Bell } from 'lucide-react';


import { TOP_BAR_ITEMS } from './topBarConfig';

export default function TopBar() {
    const userRole = localStorage.getItem('userRole') || 'customer';

    const visibleItems = TOP_BAR_ITEMS.filter(item => item.allowedRoles.includes(userRole));

    return (
        <div className="sticky top-0 z-40 w-full border-b border-border bg-background px-6 h-16 grid grid-cols-4 text-foreground">
            <div className=" flex items-center gap-4 justify-start">
                <span className="text-xl w-16 font-bold">BMS</span>
                <Input placeholder="Search..." className="w-64" />
            </div>
            <div className=" flex items-center gap-4 justify-center col-span-2">
                {visibleItems.map((item) => (
                    <NavigationMenuItem key={item.path} onClick={() => window
                        .open(item.path, "_self")}>
                        {item.icon && <item.icon />}
                        {item.label}
                    </NavigationMenuItem>
                ))}
            </div>
            <div className=" flex items-center justify-end gap-4">
                <Bell className="cursor-pointer" />
                <Settings className="cursor-pointer" />
                <Avatar>
                    <AvatarImage src="/placeholder-user.jpg" alt="User" />
                    <AvatarFallback>
                        U
                    </AvatarFallback>
                </Avatar>
            </div>
        </div>
    )
}

