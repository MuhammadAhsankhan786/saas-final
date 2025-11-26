"use client";

import React, { useState, useEffect } from "react";
import { getConsentForms, getAppointmentFormData, downloadConsentFormPDF } from "@/lib/api";
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
  DialogTrigger,
} from "../ui/dialog";
import {
  ArrowLeft,
  FileText,
  Plus,
  Eye,
  Edit,
  Download,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

const statusOptions = ["All", "signed", "pending", "expired", "draft"];

export function ConsentForms({ onPageChange }) {
  const role = JSON.parse(localStorage.getItem("user") || "{}").role;
  const isAdmin = role === "admin";
  const isClient = role === "client";
  const [consentForms, setConsentForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedForm, setSelectedForm] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [newForm, setNewForm] = useState({
    client_id: "",
    service_id: "",
    form_type: "consent",
  });

  // Calculate status from API data
  const calculateStatus = (consentForm) => {
    if (!consentForm.digital_signature || !consentForm.date_signed) {
      return "pending";
    }
    
    // Calculate expiry date (1 year from signed date)
    const signedDate = new Date(consentForm.date_signed);
    const expiryDate = new Date(signedDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const today = new Date();
    
    if (today > expiryDate) {
      return "expired";
    }
    
    return "signed";
  };

  // Transform API data to component format
  const transformConsentForm = (cf) => {
    const status = calculateStatus(cf);
    const signedDate = cf.date_signed ? new Date(cf.date_signed) : null;
    const expiryDate = signedDate ? new Date(signedDate) : null;
    if (expiryDate) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    return {
      id: cf.id,
      clientName: cf.client?.name || cf.client?.clientUser?.name || "Unknown Client",
      clientId: cf.client?.id || `client-${cf.client_id}`,
      formType: cf.service?.name || cf.form_type || "General Consent",
      status: status,
      signedDate: signedDate ? signedDate.toISOString().split('T')[0] : null,
      expiryDate: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
      provider: cf.client?.preferred_provider?.name || "Provider",
      location: cf.client?.location?.name || "Location",
      notes: cf.notes || "",
      createdAt: cf.created_at,
      rawData: cf, // Keep raw data for details
    };
  };

  // Fetch real consent forms from API
  useEffect(() => {
    async function loadConsentForms() {
      try {
        setLoading(true);
        const [consentData, formData] = await Promise.all([
          getConsentForms(),
          getAppointmentFormData(),
        ]);

        const forms = Array.isArray(consentData) 
          ? consentData.map(transformConsentForm)
          : [];
        
        setConsentForms(forms);
        setServices(formData?.services || []);
        setClients(formData?.clients || []);
        
        console.log(`✅ Consent forms fetched successfully (${forms.length} records)`);
        notify.success("Consent forms loaded successfully");
      } catch (error) {
        console.error("Error loading consent forms:", error);
        notify.error("Failed to load consent forms. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    
    loadConsentForms();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "signed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "draft":
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "signed":
        return "outline";
      case "pending":
        return "secondary";
      case "expired":
        return "destructive";
      case "draft":
        return "outline";
      default:
        return "outline";
    }
  };

  const filteredForms = consentForms.filter((form) => {
    if (!form) return false;
    
    const matchesSearch = 
      (form.clientName && form.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (form.formType && form.formType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (form.provider && form.provider.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "All" || form.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (form) => {
    setSelectedForm(form);
    setIsDetailsOpen(true);
  };

  const handleCreateForm = () => {
    // Here you would typically create a new consent form
    console.log("Creating new consent form:", newForm);
    notify.success("New consent form created successfully!");
    setIsCreateFormOpen(false);
    setNewForm({
      clientName: "",
      clientId: "",
      formType: "",
      provider: "",
      location: "",
      notes: "",
    });
  };

  const handleDownloadForm = async (formId) => {
    try {
      const response = await downloadConsentFormPDF(formId);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consent-form-${formId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notify.success("Consent form PDF downloaded successfully!");
    } catch (error) {
      console.error("Error downloading consent form PDF:", error);
      notify.error(error.message || "Failed to download PDF. Please try again.");
    }
  };

  const handleSendReminder = (formId) => {
    // Here you would typically send a reminder to the client
    console.log(`Sending reminder for consent form ${formId}`);
    notify.success("Reminder sent to client successfully!");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Create Consent Form Dialog - Shared between desktop and mobile */}
      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="bg-card border-border max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create New Consent Form</DialogTitle>
            <DialogDescription className="text-sm">
              Create a new consent form for a client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={newForm.clientName}
                  onChange={(e) => setNewForm(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Enter client name"
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={newForm.clientId}
                  onChange={(e) => setNewForm(prev => ({ ...prev, clientId: e.target.value }))}
                  placeholder="Enter client ID"
                  className="bg-input-background border-border"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="formType">Form Type</Label>
              <Select value={newForm.service_id} onValueChange={(value) => setNewForm(prev => ({ ...prev, service_id: value }))}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  value={newForm.provider}
                  onChange={(e) => setNewForm(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="Enter provider name"
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newForm.location}
                  onChange={(e) => setNewForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location"
                  className="bg-input-background border-border"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newForm.notes}
                onChange={(e) => setNewForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                className="bg-input-background border-border"
                rows={3}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateFormOpen(false)}
                className="border-border hover:bg-primary/5 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateForm}
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
              >
                Create Form
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header - Responsive & Professional */}
      <div className="space-y-3 sm:space-y-0">
        {/* Mobile: Heading on top, Back button small icon */}
        <div className="flex items-start justify-between gap-3 sm:hidden">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">Digital Consent Forms</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage client consent forms and documentation</p>
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
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Digital Consent Forms</h1>
              <p className="text-sm text-muted-foreground">Manage client consent forms and documentation</p>
            </div>
          </div>
        {!isAdmin && !isClient && (
          <Button
            onClick={() => setIsCreateFormOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Consent Form
          </Button>
        )}
        </div>
        
        {/* Mobile: Action buttons below heading */}
        {!isAdmin && !isClient && (
          <div className="sm:hidden">
            <Button 
              onClick={() => setIsCreateFormOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full" 
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Consent Form
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search Forms</Label>
              <Input
                id="search"
                placeholder="Search by client name, form type, or provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-input-background border-border"
              />
            </div>
            <div>
              <Label htmlFor="status">Status Filter</Label>
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

      {/* Consent Forms Table - Responsive */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg sm:text-xl">
            Consent Forms ({filteredForms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm sm:text-base">Loading consent forms...</p>
              </div>
            ) : (
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Client</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Form Type</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Provider</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Signed Date</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Expiry Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                        No consent forms found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="text-xs sm:text-sm">
                      <div className="font-medium text-foreground">{form.clientName}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{form.formType}</div>
                      <div className="text-xs text-muted-foreground">ID: {form.clientId}</div>
                    </TableCell>
                    <TableCell className="text-foreground text-xs sm:text-sm hidden sm:table-cell">{form.formType}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                      <div>
                        <div className="text-foreground">{form.provider}</div>
                        <div className="text-xs text-muted-foreground">{form.location}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {getStatusIcon(form.status)}
                        <Badge variant={getStatusBadgeVariant(form.status)} className="text-xs">
                          <span className="hidden sm:inline">{form.status.charAt(0).toUpperCase() + form.status.slice(1)}</span>
                          <span className="sm:hidden">{form.status.charAt(0).toUpperCase()}</span>
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                      {form.signedDate ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {new Date(form.signedDate).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not signed</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {new Date(form.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(form)}
                          className="border-border hover:bg-primary/5 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadForm(form.id)}
                          className="border-border hover:bg-primary/5 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                        {form.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendReminder(form.id)}
                            className="border-border hover:bg-primary/5 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3 text-xs"
                          >
                            <span className="hidden sm:inline">Send Reminder</span>
                            <span className="sm:hidden">Remind</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Details Dialog - Responsive */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Consent Form Details</DialogTitle>
            <DialogDescription>
              Complete information about this consent form
            </DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-6">
              {/* Client Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Client Name</div>
                    <div className="font-medium text-foreground">{selectedForm.clientName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Client ID</div>
                    <div className="font-medium text-foreground">{selectedForm.clientId}</div>
                  </div>
                </div>
              </div>

              {/* Form Details */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Form Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Form Type</div>
                    <div className="font-medium text-foreground">{selectedForm.formType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Provider</div>
                    <div className="font-medium text-foreground">{selectedForm.provider}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium text-foreground">{selectedForm.location}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedForm.status)}
                      <Badge variant={getStatusBadgeVariant(selectedForm.status)}>
                        {selectedForm.status.charAt(0).toUpperCase() + selectedForm.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Signed Date</div>
                    <div className="font-medium text-foreground">
                      {selectedForm.signedDate ? new Date(selectedForm.signedDate).toLocaleDateString() : "Not signed"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Expiry Date</div>
                    <div className="font-medium text-foreground">
                      {new Date(selectedForm.expiryDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedForm.notes && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Notes</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-foreground">{selectedForm.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="border-border hover:bg-primary/5 w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadForm(selectedForm.id)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
