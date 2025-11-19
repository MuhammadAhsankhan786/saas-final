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
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  MapPin,
  FileText,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { 
  getStockAlerts,
  getAdminDashboardStats
} from "@/lib/api";

export function AdminDashboard({ onPageChange }) {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    revenue: { value: "$0", change: "0%", trend: "up" },
    activeClients: { value: "0", change: "0%", trend: "up" },
    appointments: { value: "0", change: "0%", trend: "down" },
    inventoryAlerts: { value: "0", change: "0", trend: "alert" },
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);

  // Fetch live data from backend
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const token = localStorage.getItem("token");
        
        if (!user || !token || !user.role) {
          console.log("⚠️ No authenticated user found");
          setLoading(false);
          return;
        }
        
        // Fetch dashboard stats and stock alerts in parallel for faster loading
        console.log('📊 Admin: Fetching dashboard stats from /admin/dashboard...');
        const [dashboardRaw, stockAlerts] = await Promise.all([
          getAdminDashboardStats().catch(err => {
            console.warn('Failed to load dashboard stats:', err);
            return {};
          }),
          getStockAlerts().catch(err => {
            console.warn('Stock alerts fetch failed:', err);
            return [];
          }),
        ]);
        
        const dashboardStats = dashboardRaw?.data || dashboardRaw || {};

        // Use dashboard stats for KPIs (live MySQL data) - all data comes from single endpoint
        const totalRevenue = Number(dashboardStats?.total_revenue) || 0;
        const activeClientsCount = Number(dashboardStats?.total_clients) || 0;
        const appointmentsCount = Number(dashboardStats?.todays_appointments) || 0;
        const alertsCount = Array.isArray(stockAlerts) ? stockAlerts.length : 0;
        
        console.log('✅ Admin dashboard: Live data loaded from MySQL', {
          revenue: totalRevenue,
          clients: activeClientsCount,
          appointments: appointmentsCount,
          alerts: alertsCount
        });

        // Use real percentage changes from backend (current month vs previous month)
        const revenueChange = dashboardStats?.revenue_change ?? 0;
        const clientsChange = dashboardStats?.clients_change ?? 0;
        const appointmentsChange = dashboardStats?.appointments_change ?? 0;
        
        setKpiData({
          revenue: { 
            value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
            change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`, 
            trend: revenueChange >= 0 ? "up" : "down" 
          },
          activeClients: { 
            value: activeClientsCount.toString(), 
            change: `${clientsChange >= 0 ? '+' : ''}${clientsChange.toFixed(1)}%`, 
            trend: clientsChange >= 0 ? "up" : "down" 
          },
          appointments: { 
            value: appointmentsCount.toString(), 
            change: `${appointmentsChange >= 0 ? '+' : ''}${appointmentsChange.toFixed(1)}%`, 
            trend: appointmentsChange >= 0 ? "up" : "down" 
          },
          inventoryAlerts: { 
            value: alertsCount.toString(), 
            change: alertsCount.toString(), 
            trend: "alert" 
          },
        });

        // Monthly revenue from backend
        const monthly = Array.isArray(dashboardStats?.monthly_revenue)
          ? dashboardStats.monthly_revenue.map((m) => ({ month: m.month, revenue: Number(m.total) || 0 }))
          : [];
        setMonthlyRevenue(monthly);

        // Top services from backend (real database data)
        const topServicesData = Array.isArray(dashboardStats?.top_services) && dashboardStats.top_services.length > 0
          ? dashboardStats.top_services.map((s) => ({
              service: s.service || "Unknown",
              revenue: Number(s.revenue) || 0,
              sessions: Number(s.sessions) || 0,
            }))
          : [];
        
        // If no top services from backend, show empty array (no mock data)
        setTopServices(topServicesData);

        // Recent alerts from stock alerts
        const formattedAlerts = stockAlerts?.slice(0, 3).map((alert, index) => ({
          id: alert.id || index + 1,
          type: "inventory",
          message: alert.product_name ? `${alert.product_name} - ${alert.message || 'Low stock'}` : "Stock alert",
          priority: alert.severity || "medium",
        })) || [];
        setRecentAlerts(formattedAlerts);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set empty data to prevent UI from breaking
        setKpiData({
          revenue: { value: "$0", change: "0%", trend: "up" },
          activeClients: { value: "0", change: "0%", trend: "up" },
          appointments: { value: "0", change: "0%", trend: "down" },
          inventoryAlerts: { value: "0", change: "0", trend: "alert" },
        });
        setMonthlyRevenue([]);
        setTopServices([]);
        setRecentAlerts([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading dashboard data...</p>
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
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <Button
          onClick={() => onPageChange("appointments/list")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
        >
          <Calendar className="mr-2 h-4 w-4" /> View Appointments
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {kpiData.revenue.value}
            </div>
            <p className="text-xs text-muted-foreground">
              <span
                className={`inline-flex items-center ${
                  kpiData.revenue.trend === "up"
                    ? "text-accent"
                    : "text-destructive"
                }`}
              >
                <TrendingUp className="mr-1 h-3 w-3" />
                {kpiData.revenue.change}
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        {/* Active Clients */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Active Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {kpiData.activeClients.value}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-accent inline-flex items-center">
                <TrendingUp className="mr-1 h-3 w-3" />
                {kpiData.activeClients.change}
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Today's Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {kpiData.appointments.value}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive inline-flex items-center">
                <TrendingUp className="mr-1 h-3 w-3 rotate-180" />
                {kpiData.appointments.change}
              </span>{" "}
              from yesterday
            </p>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Inventory Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {kpiData.inventoryAlerts.value}
            </div>
            <p className="text-xs text-muted-foreground">Items need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts + Top Services */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Monthly Revenue</CardTitle>
            <CardDescription>
              Revenue and appointment trends over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "revenue"
                      ? `$${value.toLocaleString()}`
                      : value,
                    name === "revenue" ? "Revenue" : "Appointments",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00A8E8"
                  strokeWidth={2}
                  dot={{ fill: "#00A8E8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top Services</CardTitle>
            <CardDescription>
              Best performing services this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div
                  key={service.service}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {service.service}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {service.sessions} sessions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      ${service.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Recent Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start border-border hover:bg-primary/5 hover:border-primary/30"
              onClick={() => onPageChange("settings/staff")}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Staff Member
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-border hover:bg-primary/5 hover:border-primary/30"
              onClick={() => onPageChange("settings/business")}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Manage Locations
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-border hover:bg-primary/5 hover:border-primary/30"
              onClick={() => onPageChange("reports/revenue")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Reports
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-border hover:bg-primary/5 hover:border-primary/30"
              onClick={() => onPageChange("inventory/alerts")}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              View Inventory Alerts
            </Button>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Alerts</CardTitle>
            <CardDescription>Items that need your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start space-x-3 p-3 border border-border rounded-lg"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    alert.priority === "high"
                      ? "bg-destructive"
                      : alert.priority === "medium"
                      ? "bg-warning"
                      : "bg-accent"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {alert.message}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge
                      variant={
                        alert.priority === "high"
                          ? "destructive"
                          : alert.priority === "medium"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {alert.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">
                      {alert.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
