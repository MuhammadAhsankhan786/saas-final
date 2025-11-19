"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Users,
  Stethoscope,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { 
  getProviderDashboardStats
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function ProviderDashboard({ onPageChange }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    todays_appointments: 0,
    upcoming_appointments: 0,
    total_clients: 0,
    total_treatments: 0,
    completed_treatments: 0,
    pending_consents: 0,
    appointments_change: 0,
    recent_appointments: [],
  });

  // Fetch live data from backend
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        
        if (!user || !token || user.role !== 'provider') {
          console.log("⚠️ No authenticated provider found");
          setLoading(false);
          setError("Please log in as a provider to view this dashboard.");
          return;
        }
        
        console.log('📊 Provider: Fetching dashboard stats from /provider/dashboard...');
        const dashboardRaw = await getProviderDashboardStats();
        const dashboardStats = dashboardRaw?.data || dashboardRaw || {};
        
        console.log('✅ Provider dashboard: Live data loaded', dashboardStats);

        setStats({
          todays_appointments: dashboardStats.todays_appointments || 0,
          upcoming_appointments: dashboardStats.upcoming_appointments || 0,
          total_clients: dashboardStats.total_clients || 0,
          total_treatments: dashboardStats.total_treatments || 0,
          completed_treatments: dashboardStats.completed_treatments || 0,
          pending_consents: dashboardStats.pending_consents || 0,
          appointments_change: dashboardStats.appointments_change || 0,
          recent_appointments: dashboardStats.recent_appointments || [],
        });
      } catch (error) {
        console.error("❌ Error loading provider dashboard:", error);
        const errorMessage = error.message || "Failed to load dashboard data";
        setError(errorMessage);
        
        // If it's an authentication error, redirect to login
        if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
          console.log("🔐 Authentication failed, redirecting to login...");
          setTimeout(() => {
            logout();
          }, 2000); // Give user time to see the error message
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, logout]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          {error.includes("Unauthorized") || error.includes("401") ? (
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          ) : (
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">
            Provider Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your overview.
          </p>
        </div>
        <Button
          onClick={() => onPageChange("appointments/list")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
        >
          <Calendar className="mr-2 h-4 w-4" /> View My Appointments
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Today's Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.todays_appointments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Upcoming Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {stats.upcoming_appointments}
            </div>
            <div className="flex items-center mt-1">
              {stats.appointments_change !== 0 && (
                <span
                  className={`text-xs flex items-center ${
                    stats.appointments_change > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stats.appointments_change > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(stats.appointments_change)}%
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-2">
                vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Clients */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              My Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.total_clients}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique clients
            </p>
          </CardContent>
        </Card>

        {/* Total Treatments */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Total Treatments
            </CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.total_treatments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completed_treatments} completed
            </p>
          </CardContent>
        </Card>

        {/* Pending Consents */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Pending Consents
            </CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats.pending_consents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      {stats.recent_appointments && stats.recent_appointments.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Appointments</CardTitle>
            <CardDescription>
              Your latest scheduled appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">
                      {apt.client_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {apt.service_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {apt.start_time
                        ? new Date(apt.start_time).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                  <Badge
                    variant={
                      apt.status === "completed"
                        ? "default"
                        : apt.status === "canceled"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          onClick={() => onPageChange("appointments/list")}
          className="h-auto py-4 flex flex-col items-start"
        >
          <Calendar className="h-5 w-5 mb-2" />
          <span className="font-semibold">My Appointments</span>
          <span className="text-xs text-muted-foreground mt-1">
            View and manage your appointments
          </span>
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange("treatments/notes")}
          className="h-auto py-4 flex flex-col items-start"
        >
          <FileText className="h-5 w-5 mb-2" />
          <span className="font-semibold">SOAP Notes</span>
          <span className="text-xs text-muted-foreground mt-1">
            Document treatment notes
          </span>
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange("clients/list")}
          className="h-auto py-4 flex flex-col items-start"
        >
          <Users className="h-5 w-5 mb-2" />
          <span className="font-semibold">My Clients</span>
          <span className="text-xs text-muted-foreground mt-1">
            View your assigned clients
          </span>
        </Button>
      </div>
    </div>
  );
}
