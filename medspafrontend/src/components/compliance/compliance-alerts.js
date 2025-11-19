"use client";

import React, { useState, useEffect } from "react";
import { 
  getComplianceAlerts, 
  getComplianceStatistics,
  resolveComplianceAlert,
  dismissComplianceAlert,
  exportComplianceAlertsToPDF 
} from "@/lib/api";
import { notify } from "@/lib/toast";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Search,
  Filter,
  Download,
  Eye,
  X,
  Bell,
} from "lucide-react";

const alertTypes = ["All", "consent", "compliance", "training", "equipment", "backup"];
const priorities = ["All", "critical", "high", "medium", "low"];
const statusOptions = ["All", "active", "resolved", "dismissed"];
const categories = ["All", "Documentation", "Security", "Training", "Equipment", "Data Security"];

export function ComplianceAlerts({ onPageChange }) {
  const [complianceAlerts, setComplianceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statistics, setStatistics] = useState({
    total_alerts: 0,
    active_alerts: 0,
    critical_alerts: 0,
    overdue_alerts: 0,
  });

  // Fetch compliance alerts and statistics
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        
        const filters = {};
        
        if (searchQuery) filters.search = searchQuery;
        if (typeFilter !== "All") filters.type = typeFilter;
        if (priorityFilter !== "All") filters.priority = priorityFilter;
        if (statusFilter !== "All") filters.status = statusFilter;
        if (categoryFilter !== "All") filters.category = categoryFilter;
        
        console.log("🔄 Fetching compliance alerts with filters:", filters);
        
        const [alertsResponse, statsResponse] = await Promise.all([
          getComplianceAlerts(filters),
          getComplianceStatistics()
        ]);
        
        console.log("📥 Raw alerts response:", alertsResponse);
        console.log("📥 Raw stats response:", statsResponse);
        
        // Extract data from response: { success: true, data: [...] } or direct array
        let alerts = [];
        if (alertsResponse?.success && Array.isArray(alertsResponse.data)) {
          alerts = alertsResponse.data;
        } else if (Array.isArray(alertsResponse)) {
          alerts = alertsResponse;
        } else if (alertsResponse?.data && Array.isArray(alertsResponse.data)) {
          alerts = alertsResponse.data;
        }
        
        const stats = statsResponse?.data || statsResponse || {};
        
        console.log("✅ Processed alerts:", alerts.length);
        console.log("✅ Processed stats:", stats);
        
        setComplianceAlerts(alerts);
        setStatistics(stats);
      } catch (error) {
        console.error("Error fetching compliance alerts:", error);
        setError("Failed to load compliance alerts: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchQuery, typeFilter, priorityFilter, statusFilter, categoryFilter]);

  // Ensure complianceAlerts is always an array before using filter
  const safeComplianceAlerts = Array.isArray(complianceAlerts) ? complianceAlerts : [];
  
  // Statistics
  const totalAlerts = statistics.total_alerts || safeComplianceAlerts.length;
  const activeAlerts = statistics.active_alerts || safeComplianceAlerts.filter(alert => alert.status === "active").length;
  const criticalAlerts = statistics.critical_alerts || safeComplianceAlerts.filter(alert => alert.priority === "critical").length;
  const overdueAlerts = statistics.overdue_alerts || safeComplianceAlerts.filter(alert => 
    new Date(alert.due_date) < new Date() && alert.status === "active"
  ).length;

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "active":
        return "destructive";
      case "resolved":
        return "outline";
      case "dismissed":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "dismissed":
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleViewDetails = (alert) => {
    setSelectedAlert(alert);
    setIsDetailsOpen(true);
  };

  const handleResolveAlert = async (alertId) => {
    if (confirm("Are you sure you want to mark this alert as resolved?")) {
      try {
        await resolveComplianceAlert(alertId);
        notify.success("Alert resolved successfully!");
        
        // Refresh data from database
        console.log("🔄 Refreshing alerts after resolve...");
        const alertsResponse = await getComplianceAlerts();
        const statsResponse = await getComplianceStatistics();
        
        // Handle response format consistently
        let alerts = [];
        if (alertsResponse?.success && Array.isArray(alertsResponse.data)) {
          alerts = alertsResponse.data;
        } else if (Array.isArray(alertsResponse)) {
          alerts = alertsResponse;
        } else if (alertsResponse?.data && Array.isArray(alertsResponse.data)) {
          alerts = alertsResponse.data;
        }
        
        const stats = statsResponse?.data || statsResponse || {};
        setComplianceAlerts(alerts);
        setStatistics(stats);
        setIsDetailsOpen(false);
      } catch (error) {
        console.error("Error resolving alert:", error);
        notify.error("Failed to resolve alert: " + error.message);
      }
    }
  };

  const handleDismissAlert = async (alertId) => {
    if (confirm("Are you sure you want to dismiss this alert?")) {
      try {
        await dismissComplianceAlert(alertId);
        notify.success("Alert dismissed successfully!");
        
        // Refresh data from database
        console.log("🔄 Refreshing alerts after dismiss...");
        const alertsResponse = await getComplianceAlerts();
        const statsResponse = await getComplianceStatistics();
        
        // Handle response format consistently
        let alerts = [];
        if (alertsResponse?.success && Array.isArray(alertsResponse.data)) {
          alerts = alertsResponse.data;
        } else if (Array.isArray(alertsResponse)) {
          alerts = alertsResponse;
        } else if (alertsResponse?.data && Array.isArray(alertsResponse.data)) {
          alerts = alertsResponse.data;
        }
        
        const stats = statsResponse?.data || statsResponse || {};
        setComplianceAlerts(alerts);
        setStatistics(stats);
        setIsDetailsOpen(false);
      } catch (error) {
        console.error("Error dismissing alert:", error);
        notify.error("Failed to dismiss alert: " + error.message);
      }
    }
  };

  const handleExportAlerts = async () => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter !== "All" ? statusFilter : undefined,
        priority: priorityFilter !== "All" ? priorityFilter : undefined,
      };
      
      await exportComplianceAlertsToPDF(filters);
      notify.success("Compliance alerts exported successfully!");
    } catch (error) {
      console.error("Error exporting alerts:", error);
      notify.error("Failed to export alerts: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => onPageChange("dashboard")}
            className="border-border hover:bg-primary/5 w-full sm:w-auto"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Compliance Alerts</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Monitor compliance requirements and regulatory alerts</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (!complianceAlerts || !Array.isArray(complianceAlerts) || complianceAlerts.length === 0) && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading compliance alerts...</div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">Compliance alerts</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Urgent action required</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueAlerts}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">Search Alerts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, description, or assignee..."
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery(e.target.value || "")}
                  className="pl-10 bg-input-background border-border"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">Alert Type</Label>
              <Select value={typeFilter || "All"} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {alertTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "All" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
              <Select value={priorityFilter || "All"} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority === "All" ? "All Priorities" : priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select value={statusFilter || "All"} onValueChange={setStatusFilter}>
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

      {/* Compliance Alerts Table */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">
            Compliance Alerts ({safeComplianceAlerts.length})
          </CardTitle>
          <Button
            onClick={handleExportAlerts}
            disabled={loading}
            variant="outline"
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeComplianceAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      {loading ? "Loading compliance alerts..." : "No compliance alerts found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  safeComplianceAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{alert.title}</div>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {alert.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {alert.category} • {alert.affected_items} items
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {alert.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(alert.priority)}
                        <Badge variant={getPriorityBadgeVariant(alert.priority)}>
                          {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(alert.status)}
                        <Badge variant={getStatusBadgeVariant(alert.status)}>
                          {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={`text-sm ${
                          new Date(alert.due_date) < new Date() && alert.status === "active"
                            ? "text-red-600 font-medium"
                            : "text-foreground"
                        }`}>
                          {alert.due_date ? new Date(alert.due_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{alert.assigned_to}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(alert)}
                          className="border-border hover:bg-primary/5"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {alert.status === "active" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveAlert(alert.id)}
                              className="border-border hover:bg-green-5 hover:text-green-600"
                            >
                              Resolve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDismissAlert(alert.id)}
                              className="border-border hover:bg-destructive/5 hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              Complete information about this compliance alert
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {/* Alert Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  Alert Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Title</div>
                    <div className="font-medium text-foreground break-words">{selectedAlert.title}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Category</div>
                    <div className="font-medium text-foreground break-words">{selectedAlert.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Type</div>
                    <Badge variant="outline" className="capitalize">
                      {selectedAlert.type}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Priority</div>
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(selectedAlert.priority)}
                      <Badge variant={getPriorityBadgeVariant(selectedAlert.priority)}>
                        {selectedAlert.priority.charAt(0).toUpperCase() + selectedAlert.priority.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedAlert.status)}
                      <Badge variant={getStatusBadgeVariant(selectedAlert.status)}>
                        {selectedAlert.status.charAt(0).toUpperCase() + selectedAlert.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Affected Items</div>
                    <div className="font-medium text-foreground">{selectedAlert.affected_items}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Description</h3>
                <div className="p-4 bg-muted rounded-lg max-h-32 overflow-y-auto">
                  <p className="text-foreground break-words">{selectedAlert.description}</p>
                </div>
              </div>

              {/* Due Date and Assignment */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Assignment & Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Due Date</div>
                    <div className="font-medium text-foreground">
                      {selectedAlert.due_date ? new Date(selectedAlert.due_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Assigned To</div>
                    <div className="font-medium text-foreground break-words">{selectedAlert.assigned_to || 'Unassigned'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Created</div>
                    <div className="font-medium text-foreground">
                      {selectedAlert.created_at ? new Date(selectedAlert.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 flex-shrink-0 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="border-border hover:bg-primary/5"
                >
                  Close
                </Button>
                {selectedAlert.status === "active" && (
                  <>
                    <Button
                      onClick={() => handleResolveAlert(selectedAlert.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Mark as Resolved
                    </Button>
                    <Button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      variant="outline"
                      className="border-border hover:bg-destructive/5 hover:text-destructive"
                    >
                      Dismiss Alert
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
