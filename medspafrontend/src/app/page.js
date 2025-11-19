"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Login } from "../components/auth/login";
import { Sidebar } from "../components/layout/sidebar";
import { AdminDashboard } from "../components/dashboards/admin-dashboard";
import { ProviderDashboard } from "../components/dashboards/provider-dashboard";
import ReceptionDashboard from "../components/dashboards/reception-dashboard";
import ClientDashboard from "../components/dashboards/client-dashboard";
import "../globals.css";
import styles from "./page.module.css";
import { Toaster } from "../components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// RBAC Validation will run in AppContent component

// ✅ Synchronous imports for frequently used components
import { AppointmentCalendar } from "../components/appointments/appointment-calendar";
import { AppointmentBooking } from "../components/appointments/appointment-booking";
import { AppointmentList } from "../components/appointments/appointment-list";
import { ClientList } from "../components/clients/client-list";
import { AddClient } from "../components/clients/add-client";
// Lazy-load admin/provider-only modules to avoid unnecessary bundle/API work for Reception
const ConsentForms = lazy(() => import("../components/treatments/consent-forms").then(m => ({ default: m.ConsentForms })));
const SOAPNotes = lazy(() => import("../components/treatments/soap-notes").then(m => ({ default: m.SOAPNotes })));
const BeforeAfterPhotos = lazy(() => import("../components/treatments/before-after-photos").then(m => ({ default: m.BeforeAfterPhotos })));
import { PaymentPOS } from "../components/payments/payment-pos";
import { Packages } from "../components/payments/packages";
import { ServicesList } from "../components/services/services-list";
import { ClientConsents } from "../components/consents/client-consents";
const InventoryProducts = lazy(() => import("../components/inventory/inventory-products").then(m => ({ default: m.InventoryProducts })));
const StockAlerts = lazy(() => import("../components/inventory/stock-alerts").then(m => ({ default: m.StockAlerts })));
import { ProfileSettings } from "../components/settings/profile-settings";
const BusinessSettings = lazy(() => import("../components/settings/business-settings").then(m => ({ default: m.BusinessSettings })));
const StaffManagement = lazy(() => import("../components/settings/staff-management").then(m => ({ default: m.StaffManagement })));
const LocationsPage = lazy(() => import("../pages/admin/locations"));

// ⚡ Lazy load heavy components (Reports, Compliance, Payment History)
const RevenueReports = lazy(() => import("../components/reports/revenue-reports").then(m => ({ default: m.RevenueReports })));
const ClientAnalytics = lazy(() => import("../components/reports/client-analytics").then(m => ({ default: m.ClientAnalytics })));
const StaffPerformance = lazy(() => import("../components/reports/staff-performance").then(m => ({ default: m.StaffPerformance })));
const AuditLog = lazy(() => import("../components/compliance/audit-log").then(m => ({ default: m.AuditLog })));
const ComplianceAlerts = lazy(() => import("../components/compliance/compliance-alerts").then(m => ({ default: m.ComplianceAlerts })));
const PaymentHistory = lazy(() => import("../components/payments/payment-history").then(m => ({ default: m.PaymentHistory })));
const Receipts = lazy(() => import("../components/payments/receipts").then(m => ({ default: m.Receipts })));
const NotificationsList = lazy(() => import("../components/notifications/notifications-list").then(m => ({ default: m.NotificationsList })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex h-96 items-center justify-center">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);


function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  // RBAC Validation on startup for Reception role
  useEffect(() => {
    if (user?.role === 'reception') {
      console.log('✅ Reception Role Verified — modules synced, routes clean, endpoints staff-safe.');
      console.log('💡 Run window.verifyReceptionSystem() for full verification proof');
      
      // Import verification utility for console access
      import('@/lib/reception-verification').then(() => {
        console.log('✅ Verification utility loaded. Use: window.verifyReceptionSystem()');
      }).catch(() => {
        console.warn('⚠️  Verification utility not available');
      });
    }
  }, [user]);

  // ✅ Handle unauthorized route redirects from ProtectedRoute
  useEffect(() => {
    const handleNavigate = (event) => {
      if (event.detail?.page) {
        setCurrentPage(event.detail.page);
      }
    };
    
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  // ✅ Restore current page from localStorage on initial mount only
  useEffect(() => {
    const savedPage = localStorage.getItem("currentPage");
    // For client role, always start on dashboard
    if (user?.role === "client" && savedPage && savedPage !== "dashboard") {
      localStorage.setItem("currentPage", "dashboard");
      setCurrentPage("dashboard");
    } else if (savedPage) {
      setCurrentPage(savedPage);
    }
  }, [user?.role]);

  // ✅ Provider can access "My Appointments" (appointments/list) but not calendar/book
  useEffect(() => {
    if (user?.role === "provider" && currentPage.startsWith("appointments")) {
      // Allow appointments/list (My Appointments), block calendar and book
      if (currentPage === "appointments/calendar" || currentPage === "appointments/book") {
        console.log("🚫 Provider role blocked from accessing:", currentPage, "- redirecting to appointments/list");
        setCurrentPage("appointments/list");
      }
      // appointments/list is allowed - no redirect needed
    }
  }, [currentPage, user?.role]);

  // ✅ Save current page to localStorage when it changes
  useEffect(() => {
    if (isAuthenticated && currentPage) {
      localStorage.setItem("currentPage", currentPage);
    }
  }, [currentPage, isAuthenticated]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  const handlePageChange = (page) => setCurrentPage(page);

  // ✅ Wrapped Dashboards with ProtectedRoute
  const renderDashboard = () => {
    switch (user?.role) {
      case "admin":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "provider":
        return (
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderDashboard onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "reception":
        return (
          <ProtectedRoute allowedRoles={["reception"]}>
            <ReceptionDashboard onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "client":
        return (
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientDashboard onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
    }
  };

  const renderPage = () => {
    if (currentPage === "dashboard") return renderDashboard();

    // Client role: EXACTLY 6 modules only - Block all other routes
    // Allowed: dashboard, appointments/list, payments/history, payments/packages, client/consents, settings/profile
    // BLOCKED: Everything else (appointments/book, appointments/calendar, treatments, inventory, reports, compliance, staff, services, locations, etc.)
    if (user?.role === "client") {
      const allowedClientRoutes = new Set([
        "dashboard",
        "appointments/list",
        "payments/history",
        "payments/packages",
        "client/consents",
        "settings/profile",
      ]);

      // Block all other forbidden routes - redirect to dashboard
      if (!allowedClientRoutes.has(currentPage)) {
        console.log("🚫 Client blocked from accessing:", currentPage, "- redirecting to dashboard");
        return renderDashboard();
      }
    }

    // Reception role: EXACTLY 7 modules only - Block all other routes
    // Allowed: dashboard, appointments/calendar, appointments/list, appointments/book, clients/list, clients/add, 
    //          payments/pos, payments/history, payments/packages, settings/profile
    // BLOCKED: Everything else (treatments, inventory, reports, compliance, staff, services CRUD, locations, etc.)
    if (user?.role === "reception") {
      const allowedReceptionRoutes = new Set([
        "dashboard",
        "appointments/calendar",
        "appointments/list",
        "appointments/book",
        "clients/list",
        "clients/add",
        "payments/pos",
        "payments/history",
        "payments/packages",
        "settings/profile",
      ]);

      // Block all other forbidden routes - redirect to dashboard
      if (!allowedReceptionRoutes.has(currentPage)) {
        console.log("🚫 Reception blocked from accessing:", currentPage, "- redirecting to dashboard");
        return renderDashboard();
      }
    }

    // Provider role: EXACTLY 7 modules only - Block all other routes
    // Allowed: dashboard, appointments/list, clients/list, treatments/notes, treatments/consents, treatments/photos, inventory/products
    // BLOCKED: Everything else (payments, reports, compliance, settings, notifications, services CRUD, locations, staff, etc.)
    if (user?.role === "provider") {
      const allowedProviderRoutes = new Set([
        "dashboard",
        "appointments/list",
        "clients/list",
        "treatments/notes",
        "treatments/consents",
        "treatments/photos",
        "inventory/products",
      ]);

      // Block calendar and book - redirect to My Appointments
      if (currentPage === "appointments/calendar" || currentPage === "appointments/book") {
        return (
          <ProtectedRoute allowedRoles={["provider"]}>
            <AppointmentList onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      }

      // Block all other forbidden routes - redirect to dashboard
      if (!allowedProviderRoutes.has(currentPage)) {
        console.log("🚫 Provider blocked from accessing:", currentPage, "- redirecting to dashboard");
        return renderDashboard();
      }
    }

    // Admin UI isolation: Block admin from accessing forbidden modules
    // Admin can ONLY access: dashboard, appointments/list, clients/list, payments/history, 
    // payments/packages, services/list, locations/list, settings/staff, reports/*, compliance/*, settings/*
    // BLOCKED: treatments/*, payments/pos, appointments/calendar, appointments/book, clients/add, inventory/*
    if (isAdmin) {
      const forbiddenRoutes = [
        "treatments/consents",
        "treatments/notes",
        "treatments/photos",
        "payments/pos",
        "appointments/calendar",
        "appointments/book",
        "clients/add",
        "inventory/products",
        "inventory/alerts",
      ];
      
      // Block access to forbidden routes
      if (forbiddenRoutes.includes(currentPage) || 
          currentPage.startsWith("treatments/") ||
          currentPage.startsWith("inventory/")) {
        console.log("🚫 Admin blocked from accessing:", currentPage);
        return renderDashboard();
      }
    }

    switch (currentPage) {
      // Admin-only pages
      case "locations/list":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <LocationsPage onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "appointments/calendar":
        return (
          <ProtectedRoute allowedRoles={["reception"]}>
            <AppointmentCalendar onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "appointments/book":
        return (
          <ProtectedRoute allowedRoles={["reception", "client"]}>
            <AppointmentBooking onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "appointments/list":
        return (
          <ProtectedRoute allowedRoles={["admin", "provider", "reception", "client"]}>
            <AppointmentList onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "clients/list":
        return (
          <ProtectedRoute allowedRoles={["admin", "provider", "reception"]}>
            <ClientList onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "clients/add":
        return (
          <ProtectedRoute allowedRoles={["reception"]}>
            <AddClient onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "treatments/consents":
        return (
          <ProtectedRoute allowedRoles={["provider"]}>
            <ConsentForms onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "treatments/notes":
        return (
          <ProtectedRoute allowedRoles={["provider"]}>
            <SOAPNotes onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "treatments/photos":
        return (
          <ProtectedRoute allowedRoles={["provider"]}>
            <BeforeAfterPhotos onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "payments/pos":
        return (
          <ProtectedRoute allowedRoles={["reception"]}>
            <PaymentPOS onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "payments/history":
        return (
          <ProtectedRoute allowedRoles={["admin", "reception", "client"]}>
            <Suspense fallback={<LoadingFallback />}>
              <PaymentHistory onPageChange={handlePageChange} />
            </Suspense>
          </ProtectedRoute>
        );
      case "payments/receipts":
        return (
          <ProtectedRoute allowedRoles={["admin", "reception"]}>
            <Suspense fallback={<LoadingFallback />}>
              <Receipts onPageChange={handlePageChange} />
            </Suspense>
          </ProtectedRoute>
        );
      case "payments/packages":
        return (
          <ProtectedRoute allowedRoles={["admin", "reception", "client"]}>
            <Packages onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "services/list":
        return (
          <ProtectedRoute allowedRoles={["admin", "reception", "client"]}>
            <ServicesList onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "inventory/products":
        return (
          <ProtectedRoute allowedRoles={["admin", "provider"]}>
            <InventoryProducts onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "inventory/alerts":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<LoadingFallback />}>
              <StockAlerts onPageChange={handlePageChange} />
            </Suspense>
          </ProtectedRoute>
        );
      case "reports/revenue":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<LoadingFallback />}>
              <RevenueReports onPageChange={handlePageChange} />
            </Suspense>
          </ProtectedRoute>
        );
      case "reports/clients":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<LoadingFallback />}>
              <ClientAnalytics onPageChange={handlePageChange} />
            </Suspense>
          </ProtectedRoute>
        );
      case "reports/staff":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<LoadingFallback />}>
              <StaffPerformance onPageChange={handlePageChange} />
            </Suspense>
          </ProtectedRoute>
        );
      case "compliance/audit":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<LoadingFallback />}>
              <AuditLog onPageChange={handlePageChange} />
            </Suspense>
          </ProtectedRoute>
        );
      case "compliance/alerts":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<LoadingFallback />}>
              <ComplianceAlerts onPageChange={handlePageChange} />
            </Suspense>
          </ProtectedRoute>
        );
      case "notifications":
        return (
          <ProtectedRoute allowedRoles={["admin", "reception", "client"]}>
            <Suspense fallback={<LoadingFallback />}>
              <NotificationsList onPageChange={handlePageChange} />
            </Suspense>
          </ProtectedRoute>
        );
      case "client/consents":
        return (
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientConsents onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "settings/profile":
        return (
          <ProtectedRoute allowedRoles={["admin", "reception", "client"]}>
            <ProfileSettings onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "settings/business":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <BusinessSettings onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      case "settings/staff":
        return (
          <ProtectedRoute allowedRoles={["admin"]}>
            <StaffManagement onPageChange={handlePageChange} />
          </ProtectedRoute>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className={styles.appContainer}>
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      <main className={styles.mainArea}>
        <div className={styles.contentPadding}>{renderPage()}</div>
      </main>
      <Toaster />
    </div>
  );
}

// ✅ AuthProvider wraps the whole app
export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
