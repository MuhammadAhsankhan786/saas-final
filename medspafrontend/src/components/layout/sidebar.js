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
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

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
        roles: ["admin", "reception", "client"],
      },
      {
        id: "appointments/list",
        label: "All Appointments",
        icon: Calendar,
        roles: ["admin", "provider", "reception"],
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

  if (!user) return null;

  const filteredNavItems = navigationItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary">MediSpa</h1>
            <p className="text-xs text-muted-foreground">Management Platform</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} />
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
        {filteredNavItems.map((item) => (
          <div key={item.id}>
            <Button
              variant={currentPage === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${
                currentPage === item.id
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-foreground hover:bg-primary/5 hover:text-primary"
              }`}
              onClick={() => onPageChange(item.id)}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>

            {item.children && (
              <div className="ml-4 mt-1 space-y-1">
                {item.children
                  .filter((child) => child.roles.includes(user.role))
                  .map((child) => (
                    <Button
                      key={child.id}
                      variant={currentPage === child.id ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start ${
                        currentPage === child.id
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-foreground hover:bg-primary/5 hover:text-primary"
                      }`}
                      onClick={() => onPageChange(child.id)}
                    >
                      <child.icon className="mr-3 h-3 w-3" />
                      {child.label}
                    </Button>
                  ))}
              </div>
            )}
          </div>
        ))}
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
    </div>
  );
}
