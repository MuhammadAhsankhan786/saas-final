"use client";

import { useState, useEffect } from "react";
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

// Pages / placeholders
import { AppointmentCalendar } from "../components/appointments/appointment-calendar";
import { AppointmentBooking } from "../components/appointments/appointment-booking";
import { AppointmentList } from "../components/appointments/appointment-list";
import { ClientList } from "../components/clients/client-list";
import { AddClient } from "../components/clients/add-client";
import { ConsentForms } from "../components/treatments/consent-forms";
import { SOAPNotes } from "../components/treatments/soap-notes";
import { BeforeAfterPhotos } from "../components/treatments/before-after-photos";
import { PaymentPOS } from "../components/payments/payment-pos";
import { PaymentHistory } from "../components/payments/payment-history";
import { Packages } from "../components/payments/packages";
import { InventoryProducts } from "../components/inventory/inventory-products";
import { StockAlerts } from "../components/inventory/stock-alerts";
import { RevenueReports } from "../components/reports/revenue-reports";
import { ClientAnalytics } from "../components/reports/client-analytics";
import { StaffPerformance } from "../components/reports/staff-performance";
import { AuditLog } from "../components/compliance/audit-log";
import { ComplianceAlerts } from "../components/compliance/compliance-alerts";
import { ProfileSettings } from "../components/settings/profile-settings";
import { BusinessSettings } from "../components/settings/business-settings";
import { StaffManagement } from "../components/settings/staff-management";
import LocationsPage from "../pages/admin/locations";
import { AuthProvider, useAuth } from "@/context/AuthContext";


function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const router = useRouter();

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

    switch (currentPage) {
      case "locations/list":
        return <LocationsPage onPageChange={handlePageChange} />;
      case "appointments/calendar":
        return <AppointmentCalendar onPageChange={handlePageChange} />;
      case "appointments/book":
        return <AppointmentBooking onPageChange={handlePageChange} />;
      case "appointments/list":
        return <AppointmentList onPageChange={handlePageChange} />;
      case "clients/list":
        return <ClientList onPageChange={handlePageChange} />;
      case "clients/add":
        return <AddClient onPageChange={handlePageChange} />;
      case "treatments/consents":
        return <ConsentForms onPageChange={handlePageChange} />;
      case "treatments/notes":
        return <SOAPNotes onPageChange={handlePageChange} />;
      case "treatments/photos":
        return <BeforeAfterPhotos onPageChange={handlePageChange} />;
      case "payments/pos":
        return <PaymentPOS onPageChange={handlePageChange} />;
      case "payments/history":
        return <PaymentHistory onPageChange={handlePageChange} />;
      case "payments/packages":
        return <Packages onPageChange={handlePageChange} />;
      case "inventory/products":
        return <InventoryProducts onPageChange={handlePageChange} />;
      case "inventory/alerts":
        return <StockAlerts onPageChange={handlePageChange} />;
      case "reports/revenue":
        return <RevenueReports onPageChange={handlePageChange} />;
      case "reports/clients":
        return <ClientAnalytics onPageChange={handlePageChange} />;
      case "reports/staff":
        return <StaffPerformance onPageChange={handlePageChange} />;
      case "compliance/audit":
        return <AuditLog onPageChange={handlePageChange} />;
      case "compliance/alerts":
        return <ComplianceAlerts onPageChange={handlePageChange} />;
      case "settings/profile":
        return <ProfileSettings onPageChange={handlePageChange} />;
      case "settings/business":
        return <BusinessSettings onPageChange={handlePageChange} />;
      case "settings/staff":
        return <StaffManagement onPageChange={handlePageChange} />;
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
