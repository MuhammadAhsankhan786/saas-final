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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Search,
  Clock,
  DollarSign,
  Loader2,
  Plus,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { getServices, createService, updateService, deleteService } from "@/lib/api";
import { notify } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

export function ServicesList({ onPageChange }) {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  
  // CRUD states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    duration: "",
    active: true,
  });

  const categories = [
    "Facial",
    "Massage",
    "Laser",
    "Injectables",
    "Body",
    "Hair Removal",
    "Consultation",
    "Other",
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("🔄 Fetching services from API...");
      const servicesData = await getServices();
      console.log("📥 Services API Response:", servicesData);
      
      // Handle different response formats
      let servicesArray = [];
      if (Array.isArray(servicesData)) {
        servicesArray = servicesData;
      } else if (servicesData && Array.isArray(servicesData.data)) {
        servicesArray = servicesData.data;
      } else if (servicesData && servicesData.services && Array.isArray(servicesData.services)) {
        servicesArray = servicesData.services;
      }
      
      console.log("✅ Processed services array:", servicesArray.length, "services");
      setServices(servicesArray);
      
      if (servicesArray.length === 0) {
        console.warn("⚠️ No services found in database");
      }
    } catch (error) {
      console.error("❌ Error loading services:", error);
      const errorMessage = error.message || "Failed to load services";
      setError(errorMessage);
      
      if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
        notify.error("Session expired. Please log in again.");
      } else {
        notify.error("Failed to load services: " + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      duration: "",
      active: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || "",
      description: service.description || "",
      category: service.category || "",
      price: service.price?.toString() || "",
      duration: service.duration?.toString() || "",
      active: service.active !== undefined ? service.active : true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (serviceId) => {
    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteService(serviceId);
      notify.success("Service deleted successfully");
      await loadServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      notify.error("Failed to delete service: " + (error.message || "Unknown error"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      notify.error("Service name is required");
      return;
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      notify.error("Valid price is required");
      return;
    }
    if (!formData.duration || parseInt(formData.duration) < 1) {
      notify.error("Valid duration (minimum 1 minute) is required");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category || null,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        active: formData.active,
      };

      if (editingService) {
        await updateService(editingService.id, submitData);
        notify.success("Service updated successfully");
      } else {
        await createService(submitData);
        notify.success("Service created successfully");
      }

      setIsDialogOpen(false);
      await loadServices();
    } catch (error) {
      console.error("Error saving service:", error);
      notify.error("Failed to save service: " + (error.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const filteredServices = services.filter((service) => {
    if (!service) return false;
    
    const matchesSearch = 
      (service.name && service.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading services from database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header - Responsive & Professional */}
      <div className="space-y-3 sm:space-y-0">
        {/* Mobile: Heading on top, Back button small icon */}
        <div className="flex items-start justify-between gap-3 sm:hidden">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">Services</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage all available services</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => onPageChange("dashboard")}
            className="h-8 w-8 p-0 flex-shrink-0"
            size="icon"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Button>
        </div>
        
        {/* Desktop: Original layout */}
        <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-row items-center gap-4">
            <Button
              variant="outline"
              onClick={() => onPageChange("dashboard")}
              className="border-border hover:bg-primary/5"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Services</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage all available services</p>
            </div>
          </div>
          {user?.role === "admin" && (
            <Button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          )}
        </div>
        
        {/* Mobile: Action buttons below heading */}
        {user?.role === "admin" && (
          <div className="sm:hidden">
            <Button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        )}
      </div>

      {/* Search - Responsive */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4 sm:pt-6">
            <p className="text-destructive text-sm sm:text-base">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Services Table - Responsive */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">All Services ({filteredServices.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    {user?.role === "admin" && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={user?.role === "admin" ? 6 : 5} className="text-center py-8 text-muted-foreground">
                        {services.length === 0 
                          ? "No services available in database. Services will appear here once added."
                          : "No services match your search"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">{service.name}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {service.description || "No description"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {service.category ? (
                            <Badge variant="outline">{service.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="h-3 w-3" />
                            <span>{service.duration ? `${service.duration} min` : "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatCurrency(service.price)}
                          </div>
                        </TableCell>
                        {user?.role === "admin" && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(service)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(service.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="md:hidden space-y-4 p-4">
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {services.length === 0 
                  ? "No services available in database. Services will appear here once added."
                  : "No services match your search"}
              </div>
            ) : (
              filteredServices.map((service) => (
                <Card key={service.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base font-semibold text-foreground mb-1">
                          {service.name}
                        </CardTitle>
                        {service.category && (
                          <Badge variant="outline" className="text-xs">
                            {service.category}
                          </Badge>
                        )}
                      </div>
                      {user?.role === "admin" && (
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(service)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{service.duration ? `${service.duration} min` : "N/A"}</span>
                      </div>
                      <div className="font-medium text-foreground flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {formatCurrency(service.price)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>
              {editingService 
                ? "Update the service information below."
                : "Fill in the details to create a new service."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Facial Treatment"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Service description..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="60"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="active" className="text-sm font-normal cursor-pointer">
                  Service is active
                </Label>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingService ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingService ? "Update Service" : "Create Service"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
