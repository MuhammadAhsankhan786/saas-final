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
import { Textarea } from "../ui/textarea";
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
import {
  ArrowLeft,
  Package,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Search,
  Download,
} from "lucide-react";
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getServices,
  assignPackageToClient,
  getClients,
} from "@/lib/api";
import { notify } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

export function Packages({ onPageChange }) {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false);
  const [isAssignPackageOpen, setIsAssignPackageOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    services_included: [],
  });
  const [assignData, setAssignData] = useState({
    client_id: "",
    package_id: "",
  });
  const [error, setError] = useState("");

  // Load data from API
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        
        // For clients, only load packages (their own assigned packages)
        if (isClient) {
          const packagesData = await getPackages();
          setPackages(Array.isArray(packagesData) ? packagesData : []);
          setServices([]);
          setClients([]);
        } else {
          // For admin/staff, load all data
          const [packagesData, servicesData, clientsData] = await Promise.all([
            getPackages(),
            getServices(),
            getClients(),
          ]);
          
          setPackages(Array.isArray(packagesData) ? packagesData : []);
          setServices(Array.isArray(servicesData) ? servicesData : []);
          setClients(Array.isArray(clientsData) ? clientsData : []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        const errorMessage = error.message || "Failed to load packages data";
        setError(errorMessage);
        
        // Handle 401 Unauthorized - show toast and potentially logout
        if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
          notify.error("Session expired. Please log in again.");
          // AuthContext will handle logout on next navigation
        } else {
          notify.error("Failed to load packages: " + errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isClient]);

  const filteredPackages = packages.filter((pkg) => {
    if (!pkg) return false;
    
    const matchesSearch = 
      (pkg.name && pkg.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pkg.services_included && Array.isArray(pkg.services_included) && 
       pkg.services_included.some(service => service && service.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesSearch;
  });

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    setError("");

    // Check permissions - only clients are blocked, admin can create
    if (isClient) {
      notify.error("Access forbidden. You do not have permission to create packages.");
      return;
    }

    if (!formData.name || !formData.price) {
      setError("Please fill in all required fields");
      notify.error("Please fill in all required fields");
      return;
    }

    const toastId = notify.loading("Creating package...");
    try {
      const newPackage = await createPackage(formData);
      notify.dismiss(toastId);
      notify.success("Package created successfully");
      setPackages([newPackage, ...packages]);
      setIsCreatePackageOpen(false);
      setFormData({
        name: "",
        description: "",
        price: "",
        duration: "",
        services_included: [],
      });
    } catch (error) {
      console.error("Error creating package:", error);
      notify.dismiss(toastId);
      const errorMessage = error.message || "Failed to create package";
      setError(errorMessage);
      notify.error(errorMessage);
    }
  };

  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    setError("");

    // Check permissions - only clients are blocked, admin can update
    if (isClient) {
      notify.error("Access forbidden. You do not have permission to update packages.");
      return;
    }

    if (!formData.name || !formData.price) {
      setError("Please fill in all required fields");
      notify.error("Please fill in all required fields");
      return;
    }

    const toastId = notify.loading("Updating package...");
    try {
      const updatedPackage = await updatePackage(selectedPackage.id, formData);
      notify.dismiss(toastId);
      notify.success("Package updated successfully");
      setPackages(packages.map(pkg => 
        pkg.id === selectedPackage.id ? updatedPackage : pkg
      ));
      setIsDetailsOpen(false);
      setSelectedPackage(null);
    } catch (error) {
      console.error("Error updating package:", error);
      notify.dismiss(toastId);
      const errorMessage = error.message || "Failed to update package";
      setError(errorMessage);
      notify.error(errorMessage);
    }
  };

  const handleDeletePackage = async (packageId) => {
    // Check permissions - only clients are blocked, admin can delete
    if (isClient) {
      notify.error("Access forbidden. You do not have permission to delete packages.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this package? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    const toastId = notify.loading("Deleting package...");
    try {
      await deletePackage(packageId);
      notify.dismiss(toastId);
      notify.success("Package deleted successfully");
      setPackages(packages.filter(pkg => pkg.id !== packageId));
    } catch (error) {
      console.error("Error deleting package:", error);
      notify.dismiss(toastId);
      const errorMessage = error.message || "Failed to delete package";
      setError(errorMessage);
      notify.error(errorMessage);
    }
  };

  const handleAssignPackage = async (e) => {
    e.preventDefault();
    setError("");

    // Check permissions
    if (isClient || user?.role === 'admin') {
      notify.error("Access forbidden. You do not have permission to assign packages.");
      return;
    }

    if (!assignData.client_id || !assignData.package_id) {
      setError("Please select both client and package");
      notify.error("Please select both client and package");
      return;
    }

    const toastId = notify.loading("Assigning package...");
    try {
      await assignPackageToClient(assignData.client_id, assignData.package_id);
      notify.dismiss(toastId);
      notify.success("Package assigned successfully");
      setIsAssignPackageOpen(false);
      setAssignData({ client_id: "", package_id: "" });
      // Refresh package list to show updated assignments
      const packagesData = await getPackages();
      setPackages(Array.isArray(packagesData) ? packagesData : []);
    } catch (error) {
      console.error("Error assigning package:", error);
      notify.dismiss(toastId);
      const errorMessage = error.message || "Failed to assign package";
      setError(errorMessage);
      notify.error("Transaction failed: " + errorMessage);
    }
  };

  const openEditModal = (pkg) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.price,
      duration: pkg.duration || "",
      services_included: pkg.services_included || [],
    });
    setIsDetailsOpen(true);
  };

  const openCreateModal = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: "",
      services_included: [],
    });
    setIsCreatePackageOpen(true);
  };

  const handleExportPackages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to download reports");
        return;
      }

      // Use role-based endpoint - Reception shouldn't access PDF reports (admin-only feature)
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      let pdfUrl = "/admin/packages/pdf";
      
      if (user.role === 'admin') {
        pdfUrl = "/admin/packages/pdf";
      } else if (user.role === 'reception' || user.role === 'provider') {
        // Reception doesn't have access to reports - restrict this feature
        notify.error("Access denied. Report generation is only available for administrators.");
        return;
      }
      
      console.log(`✅ RBAC: Generating packages PDF for role ${user.role}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}${pdfUrl}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'packages-summary.pdf';
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading packages report:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const openAssignModal = () => {
    setAssignData({ client_id: "", package_id: "" });
    setIsAssignPackageOpen(true);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Unknown";
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Header - Responsive & Professional */}
      <div className="space-y-3 sm:space-y-0">
        {/* Mobile: Heading on top, Back button small icon */}
        <div className="flex items-start justify-between gap-3 sm:hidden">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">
              {isClient ? "My Packages" : "Packages & Services"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isClient ? "View your purchased packages" : "Manage treatment packages and services"}
            </p>
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
              <h1 className="text-2xl font-bold text-foreground">
                {isClient ? "My Packages" : "Packages & Services"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isClient ? "View your purchased packages" : "Manage treatment packages and services"}
              </p>
            </div>
          </div>
          <div className="flex flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleExportPackages}
              className="border-border hover:bg-primary/5"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Packages
            </Button>
            <Button
              onClick={openAssignModal}
              variant="outline"
              className="border-border hover:bg-primary/5"
              size="sm"
            >
              <Users className="mr-2 h-4 w-4" />
              Assign Package
            </Button>
            <Button
              onClick={openCreateModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Package
            </Button>
          </div>
        </div>
        
        {/* Mobile: Action buttons below heading */}
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportPackages}
              className="border-border hover:bg-primary/5 flex-1"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={openAssignModal}
              variant="outline"
              className="border-border hover:bg-primary/5 flex-1"
              size="sm"
            >
              <Users className="mr-2 h-4 w-4" />
              Assign
            </Button>
            <Button
              onClick={openCreateModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Total Packages
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {packages.length}
            </div>
            <p className="text-xs text-muted-foreground">Available packages</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Total Services
            </CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {services.length}
            </div>
            <p className="text-xs text-muted-foreground">Available services</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Avg. Package Price
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(
                packages.length > 0 
                  ? packages.reduce((sum, pkg) => sum + (pkg.price || 0), 0) / packages.length
                  : 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Per package</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Total Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {clients.length}
            </div>
            <p className="text-xs text-muted-foreground">Registered clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Packages Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Packages ({filteredPackages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2 text-muted-foreground">Loading packages...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPackages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No packages found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{pkg.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{pkg.description || "No description"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {formatCurrency(pkg.price)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="h-3 w-3" />
                          <span>{pkg.duration || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {pkg.services_included && Array.isArray(pkg.services_included) 
                            ? pkg.services_included.length + " services"
                            : "No services"
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(pkg)}
                            className="border-border hover:bg-primary/5"
                            title="Edit Package"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="border-border hover:bg-destructive/5 hover:text-destructive"
                            title="Delete Package"
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Create Package Dialog */}
      <Dialog open={isCreatePackageOpen} onOpenChange={setIsCreatePackageOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Package</DialogTitle>
            <DialogDescription>
              Add a new treatment package
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePackage} className="space-y-4">
            <div>
              <Label className="block mb-1 font-medium">Name</Label>
              <Input
                placeholder="Enter package name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="block mb-1 font-medium">Description</Label>
              <Textarea
                placeholder="Enter package description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label className="block mb-1 font-medium">Price</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter package price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="block mb-1 font-medium">Duration</Label>
              <Input
                placeholder="Enter duration (e.g., 60 minutes)"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreatePackageOpen(false)}
                className="border-border hover:bg-primary/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Create Package
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>
              Update package information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePackage} className="space-y-4">
            <div>
              <Label className="block mb-1 font-medium">Name</Label>
              <Input
                placeholder="Enter package name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="block mb-1 font-medium">Description</Label>
              <Textarea
                placeholder="Enter package description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label className="block mb-1 font-medium">Price</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter package price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="block mb-1 font-medium">Duration</Label>
              <Input
                placeholder="Enter duration (e.g., 60 minutes)"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDetailsOpen(false)}
                className="border-border hover:bg-primary/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Update Package
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Package Dialog */}
      <Dialog open={isAssignPackageOpen} onOpenChange={setIsAssignPackageOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Package to Client</DialogTitle>
            <DialogDescription>
              Assign a package to a client
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignPackage} className="space-y-4">
            <div>
              <Label className="block mb-1 font-medium">Client</Label>
              <Select
                value={assignData.client_id}
                onValueChange={(value) => setAssignData({ ...assignData, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block mb-1 font-medium">Package</Label>
              <Select
                value={assignData.package_id}
                onValueChange={(value) => setAssignData({ ...assignData, package_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={String(pkg.id)}>
                      {pkg.name} - {formatCurrency(pkg.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAssignPackageOpen(false)}
                className="border-border hover:bg-primary/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Assign Package
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}