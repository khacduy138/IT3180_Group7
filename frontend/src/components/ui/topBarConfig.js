import { LayoutDashboard, Settings, ShoppingBag, User } from "lucide-react";
//import { path } from "../../../../backend/src/server";

export const TOP_BAR_ITEMS = [
    {
    label: "Services",
    path: "/index",
    icon: ShoppingBag,
    allowedRoles: ["customer","admin", "manager"],
  },
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["admin", "manager", "customer"],
  },
  
  {
    label: "Bills",
    path: "/billing",
    icon: User,
    allowedRoles: ["admin", "manager", "customer"],
  },
  {
    label: "Fees",
    path: "/fees",
    icon: User,
    allowedRoles: ["admin"], 
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
    allowedRoles: ["admin", "manager", "customer"],
  }
];