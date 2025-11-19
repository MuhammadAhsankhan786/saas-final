"use client";

import React, { useState, useEffect } from "react";
import { getConsentForms, downloadConsentFormPDF } from "@/lib/api";
import { notify } from "@/lib/toast";
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
  FileText,
  Eye,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export function ClientConsents({ onPageChange }) {
  const [consentForms, setConsentForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForm, setSelectedForm] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
      clientName: cf.client?.name || "Unknown Client",
      serviceName: cf.service?.name || "Unknown Service",
      formType: cf.form_type || "consent",
      status: status,
      signedDate: signedDate,
      expiryDate: expiryDate,
      digitalSignature: cf.digital_signature || null,
      notes: cf.notes || "",
      createdAt: cf.created_at ? new Date(cf.created_at) : null,
      ...cf,
    };
  };

  // Load consent forms from API
  useEffect(() => {
    async function loadConsentForms() {
      try {
        setLoading(true);
        const data = await getConsentForms();
        const transformed = Array.isArray(data) 
          ? data.map(transformConsentForm)
          : [];
        setConsentForms(transformed);
      } catch (error) {
        console.error("Error loading consent forms:", error);
        notify.error("Failed to load consent forms");
      } finally {
        setLoading(false);
      }
    }
    
    loadConsentForms();
  }, []);

  // Filter consent forms
  const filteredForms = consentForms.filter((form) => {
    const matchesSearch = 
      form.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.formType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Handle view details
  const handleViewDetails = (form) => {
    setSelectedForm(form);
    setIsDetailsOpen(true);
  };

  // Handle download PDF
  const handleDownloadPDF = async (formId) => {
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

  const getStatusBadge = (status) => {
    const variants = {
      signed: "default",
      pending: "secondary",
      expired: "destructive",
    };
    
    const icons = {
      signed: CheckCircle,
      pending: Clock,
      expired: AlertTriangle,
    };
    
    const Icon = icons[status] || Clock;
    
    return (
      <Badge variant={variants[status] || "secondary"} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading consent forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive & Professional */}
      <div className="space-y-3 sm:space-y-0">
        {/* Mobile: Heading on top, Back button small icon */}
        <div className="flex items-start justify-between gap-3 sm:hidden">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">My Consents</h1>
            <p className="text-xs text-muted-foreground mt-0.5">View your signed consent forms</p>
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
              <h1 className="text-2xl font-bold text-foreground">My Consents</h1>
              <p className="text-sm text-muted-foreground">View your signed consent forms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search - Responsive */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Search Consent Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Input
              placeholder="Search by service, form type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-input-background border-border flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Consent Forms List - Responsive */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Consent Forms ({filteredForms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No consent forms found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Service</TableHead>
                    <TableHead className="hidden sm:table-cell text-foreground">Form Type</TableHead>
                    <TableHead className="hidden md:table-cell text-foreground">Signed Date</TableHead>
                    <TableHead className="hidden lg:table-cell text-foreground">Expiry Date</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-right text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">{form.serviceName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{form.formType}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {form.signedDate 
                          ? form.signedDate.toLocaleDateString()
                          : "Not signed"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {form.expiryDate 
                          ? form.expiryDate.toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>{getStatusBadge(form.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(form)}
                            className="h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3 border-border hover:bg-primary/5"
                          >
                            <Eye className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          {form.status === "signed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(form.id)}
                              className="h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3 border-border hover:bg-primary/5"
                            >
                              <Download className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Download</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent Form Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Consent Form Details</DialogTitle>
            <DialogDescription className="text-sm">
              View consent form information
            </DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Service</label>
                  <p className="text-foreground">{selectedForm.serviceName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Form Type</label>
                  <p className="text-foreground">{selectedForm.formType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedForm.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signed Date</label>
                  <p className="text-foreground">
                    {selectedForm.signedDate 
                      ? selectedForm.signedDate.toLocaleDateString()
                      : "Not signed"}
                  </p>
                </div>
                {selectedForm.expiryDate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                    <p className="text-foreground">
                      {selectedForm.expiryDate.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedForm.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-foreground mt-1">{selectedForm.notes}</p>
                </div>
              )}

              {selectedForm.status === "signed" && (
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleDownloadPDF(selectedForm.id)}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

