"use client";

import React, { useState, useEffect } from "react";
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
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
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
  Plus,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { 
  fetchWithAuth,
  getAuditLogs,
  getAuditLog,
  createAuditLog,
  updateAuditLog,
  deleteAuditLog,
  getAuditLogStatistics,
  getUsers
} from "../../lib/api";
import { notify } from "../../lib/toast";

const actionTypes = ["All", "create", "update", "delete", "login", "logout"];
const tableTypes = ["All"];

export function AuditLog({ onPageChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [tableFilter, setTableFilter] = useState("All");
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, today: 0, this_week: 0, this_month: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [formData, setFormData] = useState({
    user_id: "",
    action: "create",
    table_name: "",
    record_id: "",
    old_data: null,
    new_data: null,
  });
  const [users, setUsers] = useState([]);

  // Fetch audit logs from API on mount
  useEffect(() => {
    fetchAuditLogs();
    fetchStatistics();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      const usersList = Array.isArray(response) ? response : (response?.data || []);
      setUsers(usersList);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, tableFilter, searchQuery]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter !== "All") params.append("action", actionFilter);
      if (tableFilter !== "All") params.append("table_name", tableFilter);
      if (searchQuery) params.append("search", searchQuery);

      console.log("🔄 Fetching audit logs from API:", `/admin/audit-logs?${params}`);
      const response = await fetchWithAuth(`/admin/audit-logs?${params}`);
      console.log("📥 Raw audit logs response:", response);
      
      // Handle response structure: { success: true, data: { data: [...], ... } } for paginated
      // or { success: true, data: [...] } for array
      let logs = [];
      if (response && response.success && response.data) {
        // Check if it's a paginated response (has data.data array)
        if (response.data.data && Array.isArray(response.data.data)) {
          logs = response.data.data;
        } 
        // Check if it's a direct array
        else if (Array.isArray(response.data)) {
          logs = response.data;
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        logs = response;
      }
      
      console.log("✅ Processed audit logs:", logs.length);
      // Ensure auditLogs is always an array
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
      console.error("❌ Failed to fetch audit logs:", error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      console.log("🔄 Fetching audit log statistics...");
      const response = await fetchWithAuth("/admin/audit-logs/statistics");
      console.log("📥 Statistics response:", response);
      setStats(response || { total: 0, today: 0, this_week: 0, this_month: 0 });
    } catch (error) {
      console.error("❌ Failed to fetch statistics:", error);
      setStats({ total: 0, today: 0, this_week: 0, this_month: 0 });
    }
  };

  // Refetch when filters change
  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, tableFilter, searchQuery]);

  // Ensure auditLogs is always an array before filtering
  const safeAuditLogs = Array.isArray(auditLogs) ? auditLogs : [];
  
  const filteredLogs = safeAuditLogs.filter((log) => {
    const matchesSearch = searchQuery === "" || 
      (log.user && log.user.name && log.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.table_name && log.table_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.record_id && log.record_id.toString().includes(searchQuery));

    return matchesSearch;
  });

  const getActionBadgeVariant = (action) => {
    switch (action?.toLowerCase()) {
      case "create":
        return "outline";
      case "update":
        return "secondary";
      case "delete":
        return "destructive";
      case "login":
        return "outline";
      case "logout":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleCreate = () => {
    setEditingLog(null);
    setFormData({
      user_id: "",
      action: "create",
      table_name: "",
      record_id: "",
      old_data: null,
      new_data: null,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = async (log) => {
    try {
      const fullLog = await getAuditLog(log.id);
      const logData = fullLog.data || fullLog;
      setEditingLog(logData);
      setFormData({
        user_id: logData.user_id?.toString() || "",
        action: logData.action || "create",
        table_name: logData.table_name || "",
        record_id: logData.record_id?.toString() || "",
        old_data: logData.old_data || null,
        new_data: logData.new_data || null,
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error loading log for edit:", error);
      notify.error("Failed to load log for editing");
    }
  };

  const handleDelete = async (logId) => {
    if (!confirm("Are you sure you want to delete this audit log?")) {
      return;
    }

    try {
      await deleteAuditLog(logId);
      notify.success("Audit log deleted successfully");
      await fetchAuditLogs();
      await fetchStatistics();
    } catch (error) {
      console.error("Error deleting audit log:", error);
      notify.error("Failed to delete audit log: " + (error.message || "Unknown error"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        user_id: parseInt(formData.user_id),
        action: formData.action,
        table_name: formData.table_name,
        record_id: parseInt(formData.record_id) || 0,
        old_data: formData.old_data ? (typeof formData.old_data === 'string' ? JSON.parse(formData.old_data) : formData.old_data) : null,
        new_data: formData.new_data ? (typeof formData.new_data === 'string' ? JSON.parse(formData.new_data) : formData.new_data) : null,
      };

      if (editingLog) {
        await updateAuditLog(editingLog.id, submitData);
        notify.success("Audit log updated successfully");
      } else {
        await createAuditLog(submitData);
        notify.success("Audit log created successfully");
      }

      setIsDialogOpen(false);
      await fetchAuditLogs();
      await fetchStatistics();
    } catch (error) {
      console.error("Error saving audit log:", error);
      notify.error("Failed to save audit log: " + (error.message || "Unknown error"));
    }
  };

  const handleExportLogs = async () => {
    try {
      console.log("Exporting audit logs...");
      
      const params = new URLSearchParams();
      if (actionFilter !== "All") params.append("action", actionFilter);
      if (tableFilter !== "All") params.append("table_name", tableFilter);
      if (searchQuery) params.append("search", searchQuery);

      const token = localStorage.getItem("token");
      const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/audit-logs/export/pdf?${params}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create a download link
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(urlBlob);
      
      notify.success("Audit logs exported successfully!");
      console.log("✅ Audit logs exported successfully!");
    } catch (error) {
      console.error("❌ Failed to export audit logs:", error);
      notify.error("Failed to export audit logs. Please try again.");
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
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Audit Log</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Monitor system activity and security events</p>
          </div>
        </div>
        <Button
          onClick={handleExportLogs}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Export Logs</span>
          <span className="sm:hidden">Export</span>
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
            <div className="text-2xl font-bold text-foreground">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">System events logged</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Clock className="mr-2 h-4 w-4 text-blue-500" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.today || 0}</div>
            <p className="text-xs text-muted-foreground">Today's events</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-green-500" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.this_week || 0}</div>
            <p className="text-xs text-muted-foreground">Weekly activity</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.this_month || 0}</div>
            <p className="text-xs text-muted-foreground">Monthly activity</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Logs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by user, action, or table..."
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
              <Label htmlFor="table">Table</Label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tableTypes.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table === "All" ? "All Tables" : table}
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">
              Audit Logs ({filteredLogs.length})
            </CardTitle>
            <Button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Audit Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-foreground">
                              {new Date(log.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            {log.user ? (
                              <>
                                <div className="font-medium text-foreground">{log.user.name}</div>
                                <div className="text-xs text-muted-foreground">{log.user.email}</div>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">Unknown</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)} className="capitalize">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">{log.table_name || "-"}</TableCell>
                      <TableCell className="text-foreground font-bold">{log.record_id || "-"}</TableCell>
                      <TableCell className="text-foreground max-w-xs truncate">
                        {log.new_data ? (
                          typeof log.new_data === "string" ? log.new_data : JSON.stringify(log.new_data)
                        ) : log.old_data ? (
                          typeof log.old_data === "string" ? log.old_data : JSON.stringify(log.old_data)
                        ) : (
                          "No details"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(log)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(log.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLog ? "Edit Audit Log" : "Create Audit Log"}</DialogTitle>
            <DialogDescription>
              {editingLog ? "Update audit log details" : "Create a new audit log entry"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="user_id">User *</Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                required
              >
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action">Action *</Label>
              <Select
                value={formData.action}
                onValueChange={(value) => setFormData({ ...formData, action: value })}
                required
              >
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["create", "update", "delete", "login", "logout"].map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="table_name">Table Name *</Label>
              <Input
                id="table_name"
                value={formData.table_name}
                onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
                placeholder="e.g., users, appointments, clients"
                className="bg-input-background border-border"
                required
              />
            </div>

            <div>
              <Label htmlFor="record_id">Record ID *</Label>
              <Input
                id="record_id"
                type="number"
                value={formData.record_id}
                onChange={(e) => setFormData({ ...formData, record_id: e.target.value })}
                placeholder="e.g., 1, 2, 3"
                className="bg-input-background border-border"
                required
              />
            </div>

            <div>
              <Label htmlFor="old_data">Old Data (JSON)</Label>
              <Textarea
                id="old_data"
                value={formData.old_data ? (typeof formData.old_data === 'string' ? formData.old_data : JSON.stringify(formData.old_data, null, 2)) : ""}
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                    setFormData({ ...formData, old_data: parsed });
                  } catch {
                    setFormData({ ...formData, old_data: e.target.value });
                  }
                }}
                placeholder='{"key": "value"}'
                className="bg-input-background border-border font-mono text-sm"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="new_data">New Data (JSON)</Label>
              <Textarea
                id="new_data"
                value={formData.new_data ? (typeof formData.new_data === 'string' ? formData.new_data : JSON.stringify(formData.new_data, null, 2)) : ""}
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                    setFormData({ ...formData, new_data: parsed });
                  } catch {
                    setFormData({ ...formData, new_data: e.target.value });
                  }
                }}
                placeholder='{"key": "value"}'
                className="bg-input-background border-border font-mono text-sm"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {editingLog ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
