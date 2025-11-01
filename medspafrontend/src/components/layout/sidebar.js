"use client";

import React from "react";
import {
  Calendar,
  Users,
  FileText,
  CreditCard,
  Package,
  BarChart3,
  Shield,
  Settings,
  HelpCircle,
  Home,
  Stethoscope,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useIsMobile } from "../ui/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "../ui/sheet";
import { Menu } from "lucide-react";

// Helper to get user avatar URL from user object (checks both avatar and profile_image)
const getUserAvatarUrl = (user) => {
  if (!user) return null;
  const imagePath = user.avatar || user.profile_image;
  if (!imagePath) return null;
  
  // If already absolute URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Convert relative URL to absolute backend URL
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  // Remove /api from base URL if present, since storage is served from root
  const baseUrl = apiBase.replace('/api', '');
  // Ensure imagePath starts with / if it doesn't
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${baseUrl}${cleanPath}`;
};

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    roles: ["admin", "provider", "reception", "client"],
  },
  {
    id: "appointments",
    label: "Appointments",
    icon: Calendar,
    roles: ["admin", "provider", "reception", "client"],
    children: [
      {
        id: "appointments/calendar",
        label: "Calendar",
        icon: Calendar,
        roles: ["admin", "provider", "reception"],
      },
      {
        id: "appointments/book",
        label: "Book Appointment",
        icon: Calendar,
        roles: ["reception", "client"],
      },
      {
        id: "appointments/list",
        label: "All Appointments",
        icon: Calendar,
        roles: ["admin", "provider", "reception", "client"],
      },
    ],
  },
  {
    id: "clients",
    label: "Clients",
    icon: Users,
    roles: ["admin", "provider", "reception"],
    children: [
      {
        id: "clients/list",
        label: "Client List",
        icon: Users,
        roles: ["admin", "provider", "reception"],
      },
      {
        id: "clients/add",
        label: "Add Client",
        icon: Users,
        roles: ["admin", "reception"],
      },
    ],
  },
  {
    id: "treatments",
    label: "Treatments",
    icon: Stethoscope,
    roles: ["admin", "provider"],
    children: [
      {
        id: "treatments/consents",
        label: "Consents",
        icon: FileText,
        roles: ["admin", "provider"],
      },
      {
        id: "treatments/notes",
        label: "SOAP Notes",
        icon: FileText,
        roles: ["admin", "provider"],
      },
      {
        id: "treatments/photos",
        label: "Before/After",
        icon: FileText,
        roles: ["admin", "provider"],
      },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    roles: ["admin", "reception", "client"],
    children: [
      {
        id: "payments/pos",
        label: "Point of Sale",
        icon: CreditCard,
        roles: ["admin", "reception"],
      },
      {
        id: "payments/history",
        label: "Payment History",
        icon: CreditCard,
        roles: ["admin", "reception", "client"],
      },
      {
        id: "payments/packages",
        label: "Packages",
        icon: CreditCard,
        roles: ["admin", "reception", "client"],
      },
    ],
  },
  {
    id: "services",
    label: "Services",
    icon: Stethoscope,
    roles: ["admin", "provider", "reception", "client"],
    children: [
      {
        id: "services/list",
        label: "All Services",
        icon: Stethoscope,
        roles: ["admin", "provider", "reception", "client"],
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Package,
    roles: ["admin", "provider"],
    children: [
      {
        id: "inventory/products",
        label: "Products",
        icon: Package,
        roles: ["admin", "provider"],
      },
      {
        id: "inventory/alerts",
        label: "Stock Alerts",
        icon: Package,
        roles: ["admin", "provider"],
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["admin"],
    children: [
      {
        id: "reports/revenue",
        label: "Revenue",
        icon: BarChart3,
        roles: ["admin"],
      },
      {
        id: "reports/clients",
        label: "Client Analytics",
        icon: BarChart3,
        roles: ["admin"],
      },
      {
        id: "reports/staff",
        label: "Staff Performance",
        icon: BarChart3,
        roles: ["admin"],
      },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: Shield,
    roles: ["admin", "provider"],
    children: [
      {
        id: "compliance/audit",
        label: "Audit Log",
        icon: Shield,
        roles: ["admin"],
      },
      {
        id: "compliance/alerts",
        label: "Compliance Alerts",
        icon: Shield,
        roles: ["admin", "provider"],
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin", "provider", "reception", "client"],
    children: [
      {
        id: "settings/profile",
        label: "Profile",
        icon: Settings,
        roles: ["admin", "provider", "reception", "client"],
      },
      {
        id: "settings/business",
        label: "Business",
        icon: Settings,
        roles: ["admin"],
      },
      {
        id: "settings/staff",
        label: "Staff",
        icon: Settings,
        roles: ["admin"],
      },
    ],
  },
];

export function Sidebar({ currentPage, onPageChange }) {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  if (!user) return null;

  let filteredNavItems = navigationItems.filter((item) =>
    item.roles.includes(user.role)
  );

  // Strict admin UI isolation: show only allowed modules and children (READ-ONLY ACCESS)
  if (user.role === "admin") {
    // Strict oversight-only menu for admin
    const allowedTopLevel = new Set([
      "dashboard",
      "reports",
      "compliance",
      "settings",
    ]);

    const allowedChildrenByParent = {
      "reports": new Set(["reports/revenue", "reports/clients", "reports/staff"]),
      "compliance": new Set(["compliance/audit", "compliance/alerts"]),
      // Settings will have no children for admin; Profile exposed as separate item below
      "settings": new Set([]),
    };

    filteredNavItems = navigationItems
      .filter((item) => allowedTopLevel.has(item.id))
      .map((item) => {
        const allowedChildren = allowedChildrenByParent[item.id];
        const children = Array.isArray(item.children) ? item.children : [];
        const prunedChildren = allowedChildren
          ? children.filter((child) => allowedChildren.has(child.id))
          : [];
        return { ...item, children: prunedChildren };
      });

    // Add standalone Profile entry per RBAC spec
    filteredNavItems.push({
      id: "profile",
      label: "Profile",
      icon: User,
      roles: ["admin"],
      isDirectLink: true,
    });
  }

  // Provider role UI isolation: show only provider-accessible modules
  if (user.role === "provider") {
    const allowedTopLevel = new Set([
      "dashboard",
      "appointments",
      "treatments",
      "inventory",
      "compliance",
      "settings",
    ]);

    const allowedChildrenByParent = {
      // Appointments: View only (no calendar, no booking for provider)
      "appointments": new Set(["appointments/list"]),
      // Treatments: Full CRUD access (own treatments only)
      "treatments": new Set(["treatments/consents", "treatments/notes", "treatments/photos"]),
      // Inventory: View only
      "inventory": new Set(["inventory/products", "inventory/alerts"]),
      // Compliance: View only (own alerts)
      "compliance": new Set(["compliance/alerts"]),
      // Settings: Profile only (no business, no staff management)
      "settings": new Set(["settings/profile"]),
    };

    filteredNavItems = navigationItems
      .filter((item) => allowedTopLevel.has(item.id))
      .map((item) => {
        const allowedChildren = allowedChildrenByParent[item.id];
        const children = Array.isArray(item.children) ? item.children : [];
        const prunedChildren = allowedChildren
          ? children.filter((child) => allowedChildren.has(child.id))
          : [];
        return { ...item, children: prunedChildren };
      });
  }

  // Reception role UI isolation: Booking, Client Onboarding, Billing only
  if (user.role === "reception") {
    const allowedTopLevel = new Set([
      "dashboard",
      "appointments",
      "clients",
      "payments",
      "services",
      "settings",
    ]);

    const allowedChildrenByParent = {
      "appointments": new Set(["appointments/list", "appointments/book"]), // Remove calendar - not needed
      "clients": new Set(["clients/list", "clients/add"]),
      "payments": new Set(["payments/pos", "payments/history", "payments/packages"]),
      "services": new Set(["services/list"]),
      "settings": new Set(["settings/profile"]),
    };

    filteredNavItems = navigationItems
      .filter((item) => allowedTopLevel.has(item.id))
      .map((item) => {
        const allowedChildren = allowedChildrenByParent[item.id];
        const children = Array.isArray(item.children) ? item.children : [];
        const prunedChildren = allowedChildren
          ? children.filter((child) => allowedChildren.has(child.id))
          : [];
        return { ...item, children: prunedChildren };
      });
  }

  // Client role UI isolation: show only self-service modules
  if (user.role === "client") {
    // For clients, exclude the parent "appointments" item and create direct links
    filteredNavItems = navigationItems
      .filter((item) => {
        // Show dashboard, payments, settings
        if (["dashboard", "payments", "settings"].includes(item.id)) {
          return true;
        }
        // Hide the parent "appointments" item for clients
        if (item.id === "appointments") {
          return false;
        }
        // Hide other items
        return false;
      })
      .map((item) => {
        // Handle children for payments and settings
        if (item.id === "payments") {
          return {
            ...item,
            children: item.children?.filter(child => 
              child.roles.includes(user.role)
            ) || []
          };
        }
        if (item.id === "settings") {
          return {
            ...item,
            children: item.children?.filter(child => 
              child.roles.includes(user.role)
            ) || []
          };
        }
        return item;
      });
    
    // Add direct appointment links for clients (not as children of a parent)
    const appointmentChildren = navigationItems
      .find(item => item.id === "appointments")
      ?.children || [];
    
    const clientAppointmentLinks = appointmentChildren
      .filter(child => child.roles.includes(user.role))
      .map(child => ({
        ...child,
        id: child.id,
        label: child.label,
        icon: child.icon,
        roles: child.roles,
        isDirectLink: true // Mark as direct link, not a child
      }));
    
    // Insert appointment links after dashboard, before payments
    const dashboardIndex = filteredNavItems.findIndex(item => item.id === "dashboard");
    filteredNavItems = [
      ...filteredNavItems.slice(0, dashboardIndex + 1),
      ...clientAppointmentLinks,
      ...filteredNavItems.slice(dashboardIndex + 1)
    ];
  }

  // Sidebar content component (reusable for desktop and mobile)
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-sm" style={{ background: 'linear-gradient(to right, #6b21a8, #14b8a6)' }}>
            <span className="text-black font-bold text-[10px] leading-tight tracking-tight">PULSE</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary">PULSE</h1>
            <p className="text-xs text-muted-foreground">Management Platform</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage 
              src={getUserAvatarUrl(user)} 
              alt={user.name} 
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {(user?.name || "")
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = currentPage === item.id;
          
          return (
            <div key={item.id}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-foreground hover:bg-primary/5 hover:text-primary"
                }`}
                data-nav-item={item.label}
                onClick={() => {
                  // Close mobile drawer on navigation
                  if (isMobile) {
                    const event = new CustomEvent('closeSidebar');
                    window.dispatchEvent(event);
                  }
                  
                  // For direct links (like client appointments), navigate directly
                  if (item.isDirectLink) {
                    onPageChange(item.id);
                    console.log("✅ Sidebar navigation - direct link clicked:", item.id);
                    return;
                  }
                  
                  // For menu items with children (like Payments, Settings), navigate to first allowed child
                  if (item.children && item.children.length > 0) {
                    const firstAllowedChild = item.children.find(child => child.roles.includes(user.role));
                    if (firstAllowedChild) {
                      onPageChange(firstAllowedChild.id);
                      console.log("✅ Sidebar navigation - clicked parent, navigating to child:", firstAllowedChild.id);
                    } else {
                      onPageChange(item.id);
                    }
                  } else {
                    onPageChange(item.id);
                  }
                  console.log("✅ Sidebar navigation working — route changed successfully!");
                }}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>

              {item.children && item.children.length > 0 && !item.isDirectLink && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children
                    .filter((child) => child.roles.includes(user.role))
                    .map((child) => {
                      const isChildActive = currentPage === child.id;
                      
                      return (
                        <Button
                          key={child.id}
                          variant={isChildActive ? "default" : "ghost"}
                          size="sm"
                          className={`w-full justify-start ${
                            isChildActive
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "text-foreground hover:bg-primary/5 hover:text-primary"
                          }`}
                          data-nav-item={child.label}
                          onClick={() => {
                            if (isMobile) {
                              const event = new CustomEvent('closeSidebar');
                              window.dispatchEvent(event);
                            }
                            onPageChange(child.id);
                            console.log("✅ Sidebar navigation working — route changed successfully!");
                          }}
                        >
                          <child.icon className="mr-3 h-3 w-3" />
                          {child.label}
                        </Button>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  // Mobile: Use Sheet drawer
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Main navigation menu for MediSpa platform</SheetDescription>
          <div className="h-screen flex flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <div className="hidden lg:flex w-64 h-screen bg-sidebar border-r border-sidebar-border flex-col">
      <SidebarContent />
    </div>
  );
}
