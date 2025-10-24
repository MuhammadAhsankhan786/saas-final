"use client";
import React from "react";
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
  Plus,
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

// Mock data
const kpiData = {
  revenue: {
    value: "$47,234",
    change: "+12.5%",
    trend: "up",
  },
  activeClients: {
    value: "324",
    change: "+8.2%",
    trend: "up",
  },
  appointments: {
    value: "89",
    change: "-2.1%",
    trend: "down",
  },
  inventoryAlerts: {
    value: "7",
    change: "+3",
    trend: "alert",
  },
};

const monthlyRevenue = [
  { month: "Jan", revenue: 32000, appointments: 145 },
  { month: "Feb", revenue: 28000, appointments: 132 },
  { month: "Mar", revenue: 35000, appointments: 156 },
  { month: "Apr", revenue: 41000, appointments: 178 },
  { month: "May", revenue: 38000, appointments: 165 },
  { month: "Jun", revenue: 47000, appointments: 198 },
];

const topServices = [
  { service: "Botox Injections", revenue: 12500, sessions: 45 },
  { service: "Dermal Fillers", revenue: 9800, sessions: 28 },
  { service: "Hydrafacial", revenue: 7200, sessions: 36 },
  { service: "IV Therapy", revenue: 5900, sessions: 42 },
  { service: "Laser Hair Removal", revenue: 4800, sessions: 24 },
];

const recentAlerts = [
  {
    id: 1,
    type: "inventory",
    message: "Botox stock running low (3 vials remaining)",
    priority: "high",
  },
  {
    id: 2,
    type: "consent",
    message: "5 consent forms expiring this week",
    priority: "medium",
  },
  {
    id: 3,
    type: "appointment",
    message: "12 appointments need confirmation",
    priority: "low",
  },
];

export function AdminDashboard({ onPageChange }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your business overview.
          </p>
        </div>
        <Button
          onClick={() => onPageChange("appointments/calendar")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Calendar className="mr-2 h-4 w-4" /> View Calendar
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
