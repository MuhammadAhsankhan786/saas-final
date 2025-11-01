"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { notify } from "@/lib/toast";
import { useConfirm } from "../ui/confirm-dialog";
import {
  Search,
  Filter,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getAppointmentFormData,
} from "@/lib/api";

export function ClientList({ onPageChange }) {
  const role = JSON.parse(localStorage.getItem("user") || "{}").role;
  const isAdmin = role === "admin";
  const { confirm, dialog } = useConfirm();
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location_id: "",
  });
  const [error, setError] = useState("");

  // Load clients and locations from API
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [clientsData, formDataResponse] = await Promise.all([
          getClients(),
          getAppointmentFormData(), // use auth-safe endpoint to fetch locations list
        ]);
        
        // Ensure clients data is an array and filter out any invalid entries
        const validClients = Array.isArray(clientsData) 
          ? clientsData.filter(client => client && typeof client === 'object' && client.id)
          : [];
        // Log missing relationships for debugging
        validClients.forEach(c => {
          if (!c.location && !c.location_id) {
            console.warn("RBAC notice: client has no location relationship or location_id", { id: c.id, name: c.name });
          }
          if (!c.clientUser && !c.user_id) {
            console.warn("RBAC notice: client has no linked user (clientUser)", { id: c.id, name: c.name });
          }
        });

        setClients(validClients);
        setLocations(formDataResponse?.locations || []);
        try { notify.success("Client data loaded successfully"); } catch {}
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load clients data");
        try { notify.error("Live data fetch failed. Please refresh."); } catch {}
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredClients = clients.filter((client) => {
    // Skip if client is undefined or null
    if (!client) return false;
    
    const matchesSearch =
      (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone && client.phone.includes(searchTerm));

    const matchesStatus = statusFilter === "all" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.location_id) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const newClient = await createClient(formData);
      setClients([newClient.client || newClient, ...clients]);
      setIsCreateOpen(false);
      setFormData({ name: "", email: "", phone: "", location_id: "" });
      notify.success("Client saved successfully");
    } catch (error) {
      console.error("Error creating client:", error);
      const msg = "Failed to create client: " + (error.message || "Unknown error");
      setError(msg);
      notify.error(msg);
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.location_id) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const updatedClient = await updateClient(selectedClient.id, formData);
      setClients(clients.map(client => 
        client && client.id === selectedClient.id ? (updatedClient.client || updatedClient) : client
      ));
      setIsEditOpen(false);
      setSelectedClient(null);
      notify.success("Client saved successfully");
    } catch (error) {
      console.error("Error updating client:", error);
      const msg = "Error saving client: " + (error.message || "Unknown error");
      setError(msg);
      notify.error(msg);
    }
  };

  const handleDeleteClient = async (clientId) => {
    const confirmed = await confirm({
      title: "Delete Client",
      description: "Are you sure you want to delete this client?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteClient(clientId);
      setClients(clients.filter(client => client && client.id !== clientId));
      notify.success("Client deleted successfully");
    } catch (error) {
      console.error("Error deleting client:", error);
      notify.error("Failed to delete client: " + error.message);
      setError("Failed to delete client: " + error.message);
    }
  };

  const openEditModal = (client) => {
    if (!client) return;
    
    setSelectedClient(client);
    setFormData({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      location_id: client.location_id || "",
    });
    setIsEditOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ name: "", email: "", phone: "", location_id: "" });
    setIsCreateOpen(true);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) : "N/A";

  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {JSON.parse(localStorage.getItem("user") || "{}").role !== "admin" && (
            <Button
              variant="outline"
              onClick={() => onPageChange("dashboard")}
              className="border-border hover:bg-primary/5 w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Client Management
            </h1>
            <p className="text-muted-foreground">
              Manage your client database and relationships
            </p>
          </div>
        </div>
        {JSON.parse(localStorage.getItem("user") || "{}").role !== "admin" && (
          <Button
            onClick={openCreateModal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Total Clients
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {clients.length}
            </div>
            <p className="text-xs text-muted-foreground">Registered clients</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Active Clients
            </CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {clients.filter((c) => c && c.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Locations
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {locations.length}
            </div>
            <p className="text-xs text-muted-foreground">Available locations</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Recent Clients
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {clients.filter(c => {
                if (!c || !c.created_at) return false;
                const createdDate = new Date(c.created_at);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return createdDate > thirtyDaysAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <Button
              variant="outline"
              className="border-border hover:bg-primary/5 hover:border-primary/30"
            >
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
          </div>
        </CardHeader>

        {/* Table */}
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-muted-foreground">Loading clients...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  // Skip rendering if client is undefined or missing required properties
                  if (!client || !client.id || !client.name) return null;
                  
                  return (
                    <TableRow key={client.id}>
                      {/* Client Info */}
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {client.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {client.id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Member since {formatDate(client.created_at)}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-3 w-3" />
                          <span>{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-3 w-3" />
                        <span>{getLocationName(client.location_id)}</span>
                      </div>
                    </TableCell>

                    {/* Created */}
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(client.created_at)}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant="default">
                        Active
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!isAdmin && (
                            <DropdownMenuItem onClick={() => openEditModal(client)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Client
                            </DropdownMenuItem>
                          )}
                          {!isAdmin && (
                            <DropdownMenuItem onClick={() => onPageChange(`appointments/book?clientId=${client.id}`)}>
                              <Calendar className="mr-2 h-4 w-4" /> Book Appointment
                            </DropdownMenuItem>
                          )}
                          {!isAdmin && (
                            <DropdownMenuItem onClick={() => handleDeleteClient(client.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Client
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Create Client Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>
              Add a new client to the system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <Input
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Phone</label>
              <Input
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Location</label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => setFormData({ ...formData, location_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={String(location.id)}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="border-border hover:bg-primary/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Create Client
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateClient} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <Input
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Phone</label>
              <Input
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Location</label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => setFormData({ ...formData, location_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={String(location.id)}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="border-border hover:bg-primary/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Update Client
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}