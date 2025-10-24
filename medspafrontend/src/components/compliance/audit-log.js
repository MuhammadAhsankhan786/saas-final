"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  ArrowLeft,
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

// Mock audit log data
const auditLogs = [
  {
    id: "1",
    timestamp: "2025-12-21T10:30:00Z",
    user: "Dr. Chen",
    userId: "user-1",
    action: "login",
    resource: "System",
    details: "User logged in successfully",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    status: "success",
    severity: "info",
  },
  {
    id: "2",
    timestamp: "2025-12-21T10:35:00Z",
    user: "Dr. Chen",
    userId: "user-1",
    action: "create",
    resource: "Appointment",
    details: "Created new appointment for Emma Johnson",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    status: "success",
    severity: "info",
  },
  {
    id: "3",
    timestamp: "2025-12-21T11:15:00Z",
    user: "Sarah Wilson",
    userId: "user-4",
    action: "update",
    resource: "Client",
    details: "Updated client information for Sarah Davis",
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    status: "success",
    severity: "info",
  },
  {
    id: "4",
    timestamp: "2025-12-21T11:20:00Z",
    user: "Dr. Johnson",
    userId: "user-2",
    action: "delete",
    resource: "Appointment",
    details: "Cancelled appointment for Lisa Brown",
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    status: "success",
    severity: "warning",
  },
  {
    id: "5",
    timestamp: "2025-12-21T12:00:00Z",
    user: "Unknown",
    userId: "unknown",
    action: "login",
    resource: "System",
    details: "Failed login attempt with invalid credentials",
    ipAddress: "203.0.113.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    status: "failed",
    severity: "error",
  },
  {
    id: "6",
    timestamp: "2025-12-21T13:30:00Z",
    user: "Dr. Smith",
    userId: "user-3",
    action: "create",
    resource: "SOAP Note",
    details: "Created SOAP note for Jessica Martinez",
    ipAddress: "192.168.1.103",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    status: "success",
    severity: "info",
  },
];

const actionTypes = ["All", "login", "logout", "create", "update", "delete", "view"];
const severityLevels = ["All", "info", "warning", "error", "critical"];
const statusOptions = ["All", "success", "failed", "pending"];

export function AuditLog({ onPageChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRange, setDateRange] = useState("All");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);

    const matchesAction = actionFilter === "All" || log.action === actionFilter;
    const matchesSeverity = severityFilter === "All" || log.severity === severityFilter;
    const matchesStatus = statusFilter === "All" || log.status === statusFilter;

    return matchesSearch && matchesAction && matchesSeverity && matchesStatus;
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity) => {
    switch (severity) {
      case "info":
        return "outline";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      case "critical":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "success":
        return "outline";
      case "failed":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleExportLogs = () => {
    console.log("Exporting audit logs...");
    alert("Audit logs exported successfully!");
  };

  const totalLogs = auditLogs.length;
  const errorLogs = auditLogs.filter(log => log && (log.severity === "error" || log.severity === "critical")).length;
  const warningLogs = auditLogs.filter(log => log && log.severity === "warning").length;
  const failedLogs = auditLogs.filter(log => log && log.status === "failed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => onPageChange("dashboard")}
            className="border-border hover:bg-primary/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
            <p className="text-muted-foreground">Monitor system activity and security events</p>
          </div>
        </div>
        <Button
          onClick={handleExportLogs}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">System events logged</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
              Errors & Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorLogs}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningLogs}</div>
            <p className="text-xs text-muted-foreground">Monitor closely</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Failed Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedLogs}</div>
            <p className="text-xs text-muted-foreground">Security concerns</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="search">Search Logs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by user, action, or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input-background border-border"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="action">Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action === "All" ? "All Actions" : action.charAt(0).toUpperCase() + action.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {severity === "All" ? "All Levels" : severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "All" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Audit Logs ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-foreground">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-foreground">{log.user}</div>
                          <div className="text-sm text-muted-foreground">ID: {log.userId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">{log.resource}</TableCell>
                    <TableCell className="text-foreground max-w-xs truncate">
                      {log.details}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(log.severity)}
                        <Badge variant={getSeverityBadgeVariant(log.severity)}>
                          {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(log.status)}>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground font-mono text-sm">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Security Insights */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Security Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Recent Security Events</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Failed login attempt from IP 203.0.113.1 at 12:00 PM</li>
                <li>• Multiple successful logins from Dr. Chen's account</li>
                <li>• Appointment cancellation by Dr. Johnson logged</li>
                <li>• SOAP note creation by Dr. Smith recorded</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Recommendations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Monitor failed login attempts closely</li>
                <li>• Consider implementing IP whitelisting</li>
                <li>• Review user permissions regularly</li>
                <li>• Set up automated security alerts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
