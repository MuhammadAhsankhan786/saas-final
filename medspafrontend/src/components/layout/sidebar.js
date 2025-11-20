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
  Bell,
  MapPin,
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
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
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
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    roles: ["admin", "provider", "reception", "client"],
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

  // Admin Core Sidebar: EXACTLY 11 items - Dashboard, Appointments (view), Clients (view), Payments (view), 
  // Packages/Memberships, Services, Locations, Staff Management, Reports, Compliance, Settings
  // NO OTHER ITEMS ALLOWED - NO Treatments, POS, Booking, Calendar, Inventory
  if (user.role === "admin") {
    // Build admin sidebar with EXACTLY 11 items in the correct order
    filteredNavItems = [
      // 1. Dashboard
      {
        id: "dashboard",
        label: "Dashboard",
        icon: Home,
        roles: ["admin"],
      },
      // 2. Appointments (view only)
      {
        id: "appointments",
        label: "Appointments",
        icon: Calendar,
        roles: ["admin"],
        children: [
          {
            id: "appointments/list",
            label: "All Appointments",
            icon: Calendar,
            roles: ["admin"],
          },
        ],
      },
      // 3. Clients (view only)
      {
        id: "clients",
        label: "Clients",
        icon: Users,
        roles: ["admin"],
        children: [
          {
            id: "clients/list",
            label: "Client List",
            icon: Users,
            roles: ["admin"],
          },
        ],
      },
      // 4. Payments (view only)
      {
        id: "payments",
        label: "Payments",
        icon: CreditCard,
        roles: ["admin"],
        children: [
          {
            id: "payments/history",
            label: "Payment History",
            icon: CreditCard,
            roles: ["admin"],
          },
        ],
      },
      // 5. Packages / Memberships (MANAGE - CRUD)
      {
        id: "packages",
        label: "Packages / Memberships",
        icon: Package,
        roles: ["admin"],
        children: [
          {
            id: "payments/packages",
            label: "Manage Packages",
            icon: Package,
            roles: ["admin"],
          },
        ],
      },
      // 6. Services (MANAGE - CRUD)
      {
        id: "services",
        label: "Services",
        icon: Stethoscope,
        roles: ["admin"],
        children: [
          {
            id: "services/list",
            label: "All Services",
            icon: Stethoscope,
            roles: ["admin"],
          },
        ],
      },
      // 7. Locations (MANAGE - CRUD)
      {
        id: "locations",
        label: "Locations",
        icon: MapPin,
        roles: ["admin"],
        children: [
          {
            id: "locations/list",
            label: "Manage Locations",
            icon: MapPin,
            roles: ["admin"],
          },
        ],
      },
      // 8. Staff Management (MANAGE - CRUD)
      {
        id: "staff",
        label: "Staff Management",
        icon: Users,
        roles: ["admin"],
        children: [
          {
            id: "settings/staff",
            label: "Manage Staff",
            icon: Users,
            roles: ["admin"],
          },
        ],
      },
      // 9. Reports (VIEW)
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
      // 10. Compliance (VIEW)
      {
        id: "compliance",
        label: "Compliance",
        icon: Shield,
        roles: ["admin"],
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
            roles: ["admin"],
          },
        ],
      },
      // 11. Settings
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        roles: ["admin"],
        children: [
          {
            id: "settings/profile",
            label: "Profile",
            icon: Settings,
            roles: ["admin"],
          },
          {
            id: "settings/business",
            label: "Business",
            icon: Settings,
            roles: ["admin"],
          },
        ],
      },
    ];
  }

  // Provider role UI isolation: EXACTLY 7 modules only
  // 1. Dashboard, 2. My Appointments, 3. Clients, 4. SOAP Notes, 5. Consents, 6. Before/After Photos, 7. Inventory Usage
  // NO Settings, NO Compliance, NO Notifications, NO Payments, NO Reports, NO Services CRUD
  if (user.role === "provider") {
    const allowedTopLevel = new Set([
      "dashboard",        // 1. Dashboard
      "appointments",     // 2. My Appointments
      "clients",          // 3. Clients (view only)
      "treatments",       // 4. SOAP Notes, 5. Consents, 6. Before/After Photos
      "inventory",        // 7. Inventory Usage
    ]);

    const allowedChildrenByParent = {
      // Appointments: My Appointments only (view own appointments)
      "appointments": new Set(["appointments/list"]),
      // Clients: View only (own clients, no add)
      "clients": new Set(["clients/list"]),
      // Treatments: SOAP Notes, Consents, Before/After Photos
      "treatments": new Set(["treatments/notes", "treatments/consents", "treatments/photos"]),
      // Inventory: View products and log usage (no management)
      "inventory": new Set(["inventory/products"]), // Only products view, usage logging via API
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

  // Reception role UI isolation: EXACTLY 7 modules only
  // 1. Dashboard, 2. Calendar/Appointments, 3. Book Appointment, 4. Clients (Add+List), 
  // 5. POS/Payments, 6. Packages, 7. Settings
  if (user.role === "reception") {
    filteredNavItems = [
      // 1. Dashboard
      {
        id: "dashboard",
        label: "Dashboard",
        icon: Home,
        roles: ["reception"],
      },
      // 2. Calendar / Appointments
      {
        id: "appointments",
        label: "Appointments",
        icon: Calendar,
        roles: ["reception"],
        children: [
          {
            id: "appointments/calendar",
            label: "Calendar",
            icon: Calendar,
            roles: ["reception"],
          },
          {
            id: "appointments/list",
            label: "All Appointments",
            icon: Calendar,
            roles: ["reception"],
          },
        ],
      },
      // 3. Book Appointment
      {
        id: "appointments/book",
        label: "Book Appointment",
        icon: Calendar,
        roles: ["reception"],
        isDirectLink: true,
      },
      // 4. Clients (Add + List)
      {
        id: "clients",
        label: "Clients",
        icon: Users,
        roles: ["reception"],
        children: [
          {
            id: "clients/list",
            label: "Client List",
            icon: Users,
            roles: ["reception"],
          },
          {
            id: "clients/add",
            label: "Add Client",
            icon: Users,
            roles: ["reception"],
          },
        ],
      },
      // 5. POS / Payments
      {
        id: "payments",
        label: "Payments",
        icon: CreditCard,
        roles: ["reception"],
        children: [
          {
            id: "payments/pos",
            label: "Point of Sale",
            icon: CreditCard,
            roles: ["reception"],
          },
          {
            id: "payments/history",
            label: "Payment History",
            icon: CreditCard,
            roles: ["reception"],
          },
        ],
      },
      // 6. Packages
      {
        id: "payments/packages",
        label: "Packages",
        icon: Package,
        roles: ["reception"],
        isDirectLink: true,
      },
      // 7. Settings
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        roles: ["reception"],
        children: [
          {
            id: "settings/profile",
            label: "Profile",
            icon: Settings,
            roles: ["reception"],
          },
        ],
      },
    ];
  }

  // Client role UI isolation: EXACTLY 6 modules only
  // 1. Dashboard, 2. My Appointments, 3. My Payments, 4. My Packages, 5. My Consents, 6. Profile/Settings
  if (user.role === "client") {
    filteredNavItems = [
      // 1. Dashboard
      {
        id: "dashboard",
        label: "Dashboard",
        icon: Home,
        roles: ["client"],
      },
      // 2. My Appointments (view only - no booking by default)
      {
        id: "appointments/list",
        label: "My Appointments",
        icon: Calendar,
        roles: ["client"],
        isDirectLink: true,
      },
      // 3. My Payments
      {
        id: "payments/history",
        label: "My Payments",
        icon: CreditCard,
        roles: ["client"],
        isDirectLink: true,
      },
      // 4. My Packages
      {
        id: "payments/packages",
        label: "My Packages",
        icon: Package,
        roles: ["client"],
        isDirectLink: true,
      },
      // 5. My Consents
      {
        id: "client/consents",
        label: "My Consents",
        icon: FileText,
        roles: ["client"],
        isDirectLink: true,
      },
      // 6. Profile / Settings
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        roles: ["client"],
        children: [
          {
            id: "settings/profile",
            label: "Profile",
            icon: Settings,
            roles: ["client"],
          },
        ],
      },
    ];
  }

  // Sidebar content component (reusable for desktop and mobile)
  const SidebarContent = () => (
    <>
      {/* Logo - Responsive */}
      <div className="p-4 sm:p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0" style={{ background: 'linear-gradient(to right, #6b21a8, #14b8a6)' }}>
            <span className="text-black font-bold text-[9px] sm:text-[10px] leading-tight tracking-tight">PULSE</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-base sm:text-lg text-primary truncate">PULSE</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Management Platform</p>
          </div>
        </div>
      </div>

      {/* User Info - Responsive */}
      <div className="p-4 sm:p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
            <AvatarImage 
              src={getUserAvatarUrl(user)} 
              alt={user.name} 
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
              {(user?.name || "")
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-foreground text-sm sm:text-base">{user.name}</p>
            <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation - Responsive */}
      <nav className="flex-1 p-2 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = currentPage === item.id;
          
          return (
            <div key={item.id}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`w-full justify-start text-sm sm:text-base ${
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-foreground hover:bg-primary/5 hover:text-primary"
                }`}
                data-nav-item={item.label}
                onClick={() => {
                  // Close mobile/tablet drawer on navigation
                  if (isMobile || (typeof window !== 'undefined' && window.innerWidth < 1024)) {
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
                  // BUT: If a child is already active, keep it active (don't navigate to first child)
                  if (item.children && item.children.length > 0) {
                    const activeChild = item.children.find(child => child.id === currentPage && child.roles.includes(user.role));
                    if (activeChild) {
                      // Child is already active, keep it active
                      onPageChange(activeChild.id);
                      console.log("✅ Sidebar navigation - keeping active child:", activeChild.id);
                    } else {
                      // No child is active, navigate to first allowed child
                      const firstAllowedChild = item.children.find(child => child.roles.includes(user.role));
                      if (firstAllowedChild) {
                        onPageChange(firstAllowedChild.id);
                        console.log("✅ Sidebar navigation - clicked parent, navigating to child:", firstAllowedChild.id);
                      } else {
                        onPageChange(item.id);
                      }
                    }
                  } else {
                    onPageChange(item.id);
                  }
                  console.log("✅ Sidebar navigation working — route changed successfully!");
                }}
              >
                <item.icon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>

              {item.children && item.children.length > 0 && !item.isDirectLink && (
                <div className="ml-2 sm:ml-4 mt-1 space-y-1">
                  {item.children
                    .filter((child) => child.roles.includes(user.role))
                    .map((child) => {
                      const isChildActive = currentPage === child.id;
                      
                      return (
                        <Button
                          key={child.id}
                          variant={isChildActive ? "default" : "ghost"}
                          size="sm"
                          className={`w-full justify-start text-xs sm:text-sm ${
                            isChildActive
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "text-foreground hover:bg-primary/5 hover:text-primary"
                          }`}
                          data-nav-item={child.label}
                          onClick={() => {
                            if (isMobile || (typeof window !== 'undefined' && window.innerWidth < 1024)) {
                              const event = new CustomEvent('closeSidebar');
                              window.dispatchEvent(event);
                            }
                            onPageChange(child.id);
                            console.log("✅ Sidebar navigation working — route changed successfully!");
                          }}
                        >
                          <child.icon className="mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{child.label}</span>
                        </Button>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout - Responsive */}
      <div className="p-2 sm:p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm sm:text-base text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="mr-2 sm:mr-3 h-4 w-4 flex-shrink-0" />
          <span className="truncate">Sign Out</span>
        </Button>
      </div>
    </>
  );

  // Mobile & Tablet: Use Sheet drawer (hamburger menu)
  // Show hamburger on screens < 1024px (mobile + tablet)
  const [isOpen, setIsOpen] = React.useState(false);
  const [isTabletOrMobile, setIsTabletOrMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  React.useEffect(() => {
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 1024;
      setIsTabletOrMobile(isSmallScreen);
      // Auto-close drawer on resize to desktop
      if (!isSmallScreen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    // Set initial state
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on navigation (mobile/tablet)
  React.useEffect(() => {
    const handleCloseSidebar = () => {
      if (isTabletOrMobile) {
        setIsOpen(false);
      }
    };
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, [isTabletOrMobile]);

  if (isTabletOrMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 md:top-4 md:left-4"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-64 sm:w-72 p-0 bg-sidebar border-sidebar-border overflow-y-auto"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Main navigation menu for MediSpa platform</SheetDescription>
          <div className="h-screen flex flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop (>= 1024px): Fixed sidebar
  return (
    <div className="hidden lg:flex w-64 h-screen bg-sidebar border-r border-sidebar-border flex-col fixed left-0 top-0">
      <SidebarContent />
    </div>
  );
}
