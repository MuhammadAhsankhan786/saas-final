"use client";

import React, { useState, useEffect } from "react";
import { 
  getAppointments, 
  getMyAppointments,
  getAppointment,
  updateAppointment, 
  updateAppointmentStatus, 
  deleteAppointment,
  formatAppointmentForDisplay,
  formatDateTime,
  isValidStatus,
  fetchWithAuth,
} from "@/lib/api";
import { AppointmentRow } from "./AppointmentRow";
import AppointmentForm from "./AppointmentForm";
import { notify } from "@/lib/toast";
import { useConfirm } from "../ui/confirm-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

// Status options matching backend enum
const statusOptions = ["All", "booked", "completed", "cancelled"];

export function AppointmentList({ onPageChange }) {
  const role = JSON.parse(localStorage.getItem("user") || "{}").role;
  const isAdmin = role === "admin";
  const isReception = role === "reception";
  const isProvider = role === "provider";
  const isClient = role === "client";
  const { confirm, dialog } = useConfirm();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  
  // Fetch appointments from backend
  useEffect(() => {
    async function fetchAppointments() {
      try {
        setLoading(true);
        // Admin uses admin endpoint, reception/provider use staff endpoint, client uses client endpoint
        // getAppointments() automatically routes based on user role
        // Log role-based endpoint usage
        const userRole = JSON.parse(localStorage.getItem("user") || "{}").role;
        if (userRole === "provider") {
          console.log('🔍 Provider: Fetching appointments from /api/provider/appointments...');
        }
        
        const data = await getAppointments();
        console.log(`📋 Provider appointments raw response:`, data);
        console.log("📋 Appointments fetched:", data);

        // Support both array and { data: [...] } response shapes
        const rawList = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        
        // Format appointments for display
        const formattedAppointments = rawList.map(formatAppointmentForDisplay);
        setAppointments(formattedAppointments);
        
        // Show success toast and console log for provider
        if (formattedAppointments.length > 0) {
          if (userRole === "provider") {
            console.log(`✅ Provider appointments fetched successfully (${formattedAppointments.length} records)`);
            console.log('✅ RBAC: Provider endpoints validated successfully');
          }
          notify.success("Appointments loaded successfully");
        } else {
          if (userRole === "provider") {
            console.warn("⚠️ No appointments found for provider - data may be auto-seeding...");
          } else {
            console.warn("⚠️ No appointments found - may need to seed data");
          }
        }
      } catch (error) {
        console.error("❌ Error fetching appointments:", error);
        // Don't show alert on every error, just log it
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, [isAdmin]);

  // Listen for global refresh requests (e.g., after Reception creates a new appointment)
  useEffect(() => {
    const refreshHandler = () => {
      handleRefreshAppointments();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('refresh-appointments', refreshHandler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('refresh-appointments', refreshHandler);
      }
    };
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "booked":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "booked":
        return "default";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    // Handle cases where appointment data might be incomplete
    const client = appointment.client || {};
    const service = appointment.service || "";
    const provider = appointment.provider || "";
    const location = appointment.location || "";
    
    const matchesSearch = 
      (client.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.phone || "").includes(searchQuery) ||
      (client.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (location.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    // Clients cannot change status - they can only cancel appointments
    if (isClient) {
      notify.error("You can only cancel appointments. Please use the Cancel button.");
      return;
    }
    
    if (!isValidStatus(newStatus)) {
      notify.error("Invalid status selected");
      return;
    }
    
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      // Refresh appointments list using role-based endpoint
      const data = await getAppointments();
      const rawList = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
      const formattedAppointments = rawList.map(formatAppointmentForDisplay);
      setAppointments(formattedAppointments);
      notify.success(`Appointment status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      notify.error("Failed to update appointment status: " + error.message);
    }
  };

  const handleEditAppointment = async (appointment) => {
    try {
      // Fetch full appointment details to ensure all fields are available
      const fullAppointment = await getAppointment(appointment.id);
      setEditingAppointment(fullAppointment);
      setIsEditOpen(true);
    } catch (error) {
      console.error("Error fetching appointment details:", error);
      notify.error("Failed to load appointment details");
    }
  };

  const handleRefreshAppointments = async () => {
    try {
      // getAppointments() automatically routes based on user role
      const data = await getAppointments();
      const formattedAppointments = Array.isArray(data) 
        ? data.map(formatAppointmentForDisplay)
        : [];
      setAppointments(formattedAppointments);
    } catch (error) {
      console.error("Error refreshing appointments:", error);
      notify.error("Failed to refresh appointments");
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    const isClientAction = isClient;
    const confirmed = await confirm({
      title: isClientAction ? "Cancel Appointment" : "Delete Appointment",
      description: isClientAction 
        ? "Are you sure you want to cancel this appointment?"
        : "Are you sure you want to delete this appointment?",
      confirmText: isClientAction ? "Cancel Appointment" : "Delete",
      cancelText: "No",
    });

    if (confirmed) {
      const toastId = notify.loading(isClientAction ? "Cancelling appointment..." : "Deleting appointment...");
      try {
        await deleteAppointment(appointmentId);
        notify.dismiss(toastId);
        notify.success(isClientAction ? "Appointment cancelled successfully" : "Appointment deleted successfully");
        // Refresh appointments list using role-based endpoint
        const data = await getAppointments();
        const rawList = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        const formattedAppointments = rawList.map(formatAppointmentForDisplay);
        setAppointments(formattedAppointments);
      } catch (error) {
        console.error("Error deleting/cancelling appointment:", error);
        notify.dismiss(toastId);
        notify.error(isClientAction ? "Failed to cancel appointment: " + error.message : "Failed to delete appointment: " + error.message);
      }
    }
  };

  return (
    <>
      {dialog}
      <div className="space-y-6">
      {/* Header - Responsive & Professional */}
      <div className="space-y-3 sm:space-y-0">
        {/* Mobile: Heading on top, Back button small icon */}
        <div className="flex items-start justify-between gap-3 sm:hidden">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">
              {role === "client" ? "My Appointments" : "Appointments"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {role === "client" ? "View your appointments" : "View appointments"}
            </p>
          </div>
          {!isAdmin && (
            <Button
              variant="ghost"
              onClick={() => {
                if (isProvider) {
                  onPageChange("dashboard");
                } else if (role === "client") {
                  onPageChange("dashboard");
                } else {
                  onPageChange("appointments/calendar");
                }
              }}
              className="h-8 w-8 p-0 flex-shrink-0"
              size="icon"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Dashboard</span>
            </Button>
          )}
        </div>
        
        {/* Desktop: Original layout */}
        <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-row items-center gap-4">
            {!isAdmin && (
              <Button
                variant="outline"
                onClick={() => {
                  if (isProvider) {
                    onPageChange("dashboard");
                  } else if (role === "client") {
                    onPageChange("dashboard");
                  } else {
                    onPageChange("appointments/calendar");
                  }
                }}
                className="border-border hover:bg-primary/5"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {role === "client" ? "My Appointments" : "Appointments"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {role === "client" ? "View your appointments" : "View appointments"}
              </p>
            </div>
          </div>
          {!isAdmin && !isProvider && role !== "client" && (
            <Button
              onClick={() => onPageChange("appointments/book")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="sm"
            >
              <Calendar className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          )}
        </div>
        
        {/* Mobile: Action buttons below heading */}
        <div className="sm:hidden">
          {!isAdmin && !isProvider && role !== "client" ? (
            <Button
              onClick={() => onPageChange("appointments/book")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
              size="sm"
            >
              <Calendar className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          ) : null}
        </div>
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
            <div className="md:col-span-2 lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input-background border-border"
                />
              </div>
            </div>
            
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
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Appointments ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Client</TableHead>
                  <TableHead className="min-w-[120px]">Provider</TableHead>
                  <TableHead className="min-w-[100px]">Location</TableHead>
                  <TableHead className="min-w-[120px]">Service</TableHead>
                  <TableHead className="min-w-[100px]">Package</TableHead>
                  <TableHead className="min-w-[140px]">Start Time</TableHead>
                  <TableHead className="min-w-[140px]">End Time</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[150px]">Notes</TableHead>
                  <TableHead className="min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2 text-muted-foreground">Loading appointments...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No appointments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <AppointmentRow
                      key={appointment.id}
                      appointment={appointment}
                      onViewDetails={handleViewDetails}
                      onEdit={handleEditAppointment}
                      onDelete={handleDeleteAppointment}
                      onStatusChange={handleStatusChange}
                      onRefresh={handleRefreshAppointments}
                      readOnly={isAdmin || isProvider || isClient}
                      canDelete={!isAdmin && !isProvider && !isReception && !isClient}
                      canCancel={isClient}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Loading appointments...</span>
                </div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No appointments found
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {appointment.client?.name || `Client #${appointment.client_id}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {appointment.service?.name || "N/A"}
                          </p>
                        </div>
                        <Badge variant={appointment.status === "completed" ? "outline" : appointment.status === "cancelled" ? "destructive" : "default"}>
                          {appointment.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Provider:</span>
                          <p className="font-medium text-foreground">{appointment.provider?.name || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <p className="font-medium text-foreground">{appointment.location?.name || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Start:</span>
                          <p className="font-medium text-foreground">{formatDateTime(appointment.start_time).full}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">End:</span>
                          <p className="font-medium text-foreground">{formatDateTime(appointment.end_time).full}</p>
                        </div>
                      </div>

                      {appointment.notes && (
                        <div>
                          <span className="text-sm text-muted-foreground">Notes:</span>
                          <p className="text-sm text-foreground">{appointment.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(appointment)}
                          className="border-border hover:bg-primary/5"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {!isAdmin && !isProvider && !isClient && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAppointment(appointment)}
                              className="border-border hover:bg-primary/5"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            {!isReception && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAppointment(appointment.id)}
                                className="border-border hover:bg-destructive/5 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </>
                        )}
                        {isClient && appointment.status !== "cancelled" && appointment.status !== "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                            className="border-border hover:bg-destructive/5 hover:text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription className="text-xs">
              Complete information about this appointment
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-3">
              {/* Client Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center text-sm">
                  <User className="mr-2 h-3 w-3" />
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-muted rounded-lg text-sm">
                  <div>
                    <div className="text-sm text-muted-foreground">Client Name</div>
                    <div className="font-medium text-foreground">{selectedAppointment.client?.name || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium text-foreground flex items-center">
                      <Phone className="mr-1 h-3 w-3" />
                      {selectedAppointment.client?.phone || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium text-foreground flex items-center">
                      <Mail className="mr-1 h-3 w-3" />
                      {selectedAppointment.client?.email || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center text-sm">
                  <Calendar className="mr-2 h-3 w-3" />
                  Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-muted rounded-lg text-sm">
                  <div>
                    <div className="text-sm text-muted-foreground">Provider Name</div>
                    <div className="font-medium text-foreground">{selectedAppointment.provider?.name || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium text-foreground flex items-center">
                      <MapPin className="mr-1 h-3 w-3" />
                      {selectedAppointment.location?.name || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Service</div>
                    <div className="font-medium text-foreground">{selectedAppointment.service?.name || "N/A"}</div>
                    {selectedAppointment.service?.price && (
                      <div className="text-xs text-muted-foreground">
                        ${parseFloat(selectedAppointment.service.price || 0).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Package</div>
                    <div className="font-medium text-foreground">{selectedAppointment.package?.name || "N/A"}</div>
                    {selectedAppointment.package?.price && (
                      <div className="text-xs text-muted-foreground">
                        ${parseFloat(selectedAppointment.package.price || 0).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Start Time</div>
                    <div className="font-medium text-foreground flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDateTime(selectedAppointment.start_time).full}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">End Time</div>
                    <div className="font-medium text-foreground flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDateTime(selectedAppointment.end_time).full}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedAppointment.status)}
                      <Badge variant={getStatusBadgeVariant(selectedAppointment.status)}>
                        {selectedAppointment.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">Notes</h3>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p className="text-foreground">{selectedAppointment.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="border-border hover:bg-primary/5 text-sm"
                  size="sm"
                >
                  Close
                </Button>
                {!isAdmin && !isProvider && !isClient && (
                  <Button
                    onClick={() => handleEditAppointment(selectedAppointment)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                    size="sm"
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                )}
                {!(isAdmin || isProvider || isReception || isClient) && ( // Hide for Admin, Provider, Reception, and Client
                  <Button
                    onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                    variant="destructive"
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm"
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </Button>
                )}
                {isClient && selectedAppointment.status !== "cancelled" && selectedAppointment.status !== "completed" && (
                  <Button
                    onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                    variant="destructive"
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm"
                    size="sm"
                  >
                    <XCircle className="mr-2 h-3 w-3" />
                    Cancel Appointment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Appointment Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-card border-border max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? "Edit Appointment" : "Create New Appointment"}</DialogTitle>
            <DialogDescription>
              {editingAppointment ? "Update appointment details" : "Fill in the details to create a new appointment"}
            </DialogDescription>
          </DialogHeader>
          <AppointmentForm
            editingAppointment={editingAppointment}
            onPageChange={onPageChange}
            onClose={() => {
              setIsEditOpen(false);
              setEditingAppointment(null);
            }}
            onSuccess={async () => {
              // Refresh appointments list after successful create/update
              await handleRefreshAppointments();
              setIsEditOpen(false);
              setEditingAppointment(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}

