// lib/navigation-config.ts
import { 
    ShieldAlert, UserCheck, ShoppingBag, Shirt, 
    Coins, Truck, Percent, Bell, RefreshCw, User, Settings 
  } from "lucide-react";
  
  export interface NavItem {
    label: string;
    href: string;
    icon: any;
    roles: Array<'superadmin' | 'admin' | 'customer'>;
    requiresAdminApproval?: boolean;
  }
  
  export const navigationItems: NavItem[] = [
    // Superadmin Routes
    { label: "Address Mgmt", href: "/address", icon: ShieldAlert, roles: ["superadmin"] },
    { label: "Admin List", href: "/admin-list", icon: UserCheck, roles: ["superadmin"] },
  
    // Admin Routes (Visible to superadmin & approved admins)
    { label: "All Orders", href: "/all-order", icon: ShoppingBag, roles: ["superadmin", "admin"], requiresAdminApproval: true },
    { label: "Clothes", href: "/cloths", icon: Shirt, roles: ["superadmin", "admin"], requiresAdminApproval: true },
    { label: "Currency", href: "/currency", icon: Coins, roles: ["superadmin", "admin"], requiresAdminApproval: true },
    { label: "Delivery", href: "/delivery", icon: Truck, roles: ["superadmin", "admin"], requiresAdminApproval: true },
    { label: "Discount", href: "/discount", icon: Percent, roles: ["superadmin", "admin"], requiresAdminApproval: true },
    { label: "Notifications", href: "/notification", icon: Bell, roles: ["superadmin", "admin"], requiresAdminApproval: true },
    { label: "Processing", href: "/processing", icon: RefreshCw, roles: ["superadmin", "admin"], requiresAdminApproval: true },
  
    // Customer Protected Routes
    { label: "My Orders", href: "/order", icon: ShoppingBag, roles: ["customer", "superadmin", "admin"] },
    { label: "Services", href: "/service", icon: Settings, roles: ["customer", "superadmin", "admin"] },
  ];