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

// Mock compliance alerts data
const complianceAlerts = [
  {
    id: "1",
    title: "Consent Form Expiring Soon",
    description: "5 consent forms will expire within the next 7 days",
    type: "consent",
    priority: "high",
    status: "active",
    affectedItems: 5,
    dueDate: "2025-12-28",
    createdAt: "2025-12-21T10:30:00Z",
    assignedTo: "Dr. Chen",
    category: "Documentation",
  },
  {
    id: "2",
    title: "HIPAA Compliance Review Required",
    description: "Quarterly HIPAA compliance review is due",
    type: "compliance",
    priority: "critical",
    status: "active",
    affectedItems: 1,
    dueDate: "2025-12-31",
    createdAt: "2025-12-20T14:20:00Z",
    assignedTo: "Admin",
    category: "Security",
  },
  {
    id: "3",
    title: "Staff Training Certification Expired",
    description: "2 staff members have expired training certifications",
    type: "training",
    priority: "medium",
    status: "active",
    affectedItems: 2,
    dueDate: "2025-12-25",
    createdAt: "2025-12-19T09:15:00Z",
    assignedTo: "HR Manager",
    category: "Training",
  },
  {
    id: "4",
    title: "Equipment Maintenance Overdue",
    description: "Laser equipment maintenance is overdue",
    type: "equipment",
    priority: "high",
    status: "resolved",
    affectedItems: 1,
    dueDate: "2025-12-15",
    createdAt: "2025-12-18T16:45:00Z",
    assignedTo: "Dr. Smith",
    category: "Equipment",
  },
  {
    id: "5",
    title: "Data Backup Verification Failed",
    description: "Weekly data backup verification failed",
    type: "backup",
    priority: "critical",
    status: "active",
    affectedItems: 1,
    dueDate: "2025-12-22",
    createdAt: "2025-12-21T08:00:00Z",
    assignedTo: "IT Admin",
    category: "Data Security",
  },
];

const alertTypes = ["All", "consent", "compliance", "training", "equipment", "backup"];
const priorities = ["All", "critical", "high", "medium", "low"];
const statusOptions = ["All", "active", "resolved", "dismissed"];
const categories = ["All", "Documentation", "Security", "Training", "Equipment", "Data Security"];

export function ComplianceAlerts({ onPageChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filteredAlerts = complianceAlerts.filter((alert) => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "All" || alert.type === typeFilter;
    const matchesPriority = priorityFilter === "All" || alert.priority === priorityFilter;
    const matchesStatus = statusFilter === "All" || alert.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || alert.category === categoryFilter;

    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesCategory;
  });

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

  const handleResolveAlert = (alertId) => {
    if (confirm("Are you sure you want to mark this alert as resolved?")) {
      console.log(`Resolving alert ${alertId}`);
      alert("Alert marked as resolved successfully!");
    }
  };

  const handleDismissAlert = (alertId) => {
    if (confirm("Are you sure you want to dismiss this alert?")) {
      console.log(`Dismissing alert ${alertId}`);
      alert("Alert dismissed successfully!");
    }
  };

  const handleExportAlerts = () => {
    console.log("Exporting compliance alerts...");
    alert("Compliance alerts exported successfully!");
  };

  const totalAlerts = complianceAlerts.length;
  const activeAlerts = complianceAlerts.filter(alert => alert.status === "active").length;
  const criticalAlerts = complianceAlerts.filter(alert => alert.priority === "critical").length;
  const overdueAlerts = complianceAlerts.filter(alert => 
    new Date(alert.dueDate) < new Date() && alert.status === "active"
  ).length;

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
            <h1 className="text-2xl font-bold text-foreground">Compliance Alerts</h1>
            <p className="text-muted-foreground">Monitor compliance requirements and regulatory alerts</p>
          </div>
        </div>
        <Button
          onClick={handleExportAlerts}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Alerts
        </Button>
      </div>

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
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="search">Search Alerts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, description, or assignee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input-background border-border"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type">Alert Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
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

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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

      {/* Compliance Alerts Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Compliance Alerts ({filteredAlerts.length})
          </CardTitle>
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
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{alert.title}</div>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {alert.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {alert.category} • {alert.affectedItems} items
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
                          new Date(alert.dueDate) < new Date() && alert.status === "active"
                            ? "text-red-600 font-medium"
                            : "text-foreground"
                        }`}>
                          {new Date(alert.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{alert.assignedTo}</span>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              Complete information about this compliance alert
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-6">
              {/* Alert Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  Alert Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Title</div>
                    <div className="font-medium text-foreground">{selectedAlert.title}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Category</div>
                    <div className="font-medium text-foreground">{selectedAlert.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Type</div>
                    <Badge variant="outline" className="capitalize">
                      {selectedAlert.type}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Priority</div>
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(selectedAlert.priority)}
                      <Badge variant={getPriorityBadgeVariant(selectedAlert.priority)}>
                        {selectedAlert.priority.charAt(0).toUpperCase() + selectedAlert.priority.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedAlert.status)}
                      <Badge variant={getStatusBadgeVariant(selectedAlert.status)}>
                        {selectedAlert.status.charAt(0).toUpperCase() + selectedAlert.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Affected Items</div>
                    <div className="font-medium text-foreground">{selectedAlert.affectedItems}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Description</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-foreground">{selectedAlert.description}</p>
                </div>
              </div>

              {/* Due Date and Assignment */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Assignment & Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Due Date</div>
                    <div className="font-medium text-foreground">
                      {new Date(selectedAlert.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Assigned To</div>
                    <div className="font-medium text-foreground">{selectedAlert.assignedTo}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="font-medium text-foreground">
                      {new Date(selectedAlert.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
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
