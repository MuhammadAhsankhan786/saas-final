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

// Mock consent form data
const consentForms = [
  {
    id: "1",
    clientName: "Emma Johnson",
    clientId: "client-1",
    formType: "Botox Treatment",
    status: "signed",
    signedDate: "2025-12-20",
    expiryDate: "2026-12-20",
    provider: "Dr. Chen",
    location: "Downtown Clinic",
    notes: "Client understood all risks and benefits",
    createdAt: "2025-12-20T10:30:00Z",
  },
  {
    id: "2",
    clientName: "Sarah Davis",
    clientId: "client-2",
    formType: "Dermal Filler",
    status: "pending",
    signedDate: null,
    expiryDate: "2026-12-21",
    provider: "Dr. Chen",
    location: "Downtown Clinic",
    notes: "Waiting for client signature",
    createdAt: "2025-12-21T14:20:00Z",
  },
  {
    id: "3",
    clientName: "Jessica Martinez",
    clientId: "client-3",
    formType: "Hydrafacial Treatment",
    status: "expired",
    signedDate: "2024-12-15",
    expiryDate: "2025-12-15",
    provider: "Dr. Johnson",
    location: "Westside Location",
    notes: "Form expired, needs renewal",
    createdAt: "2024-12-15T09:15:00Z",
  },
  {
    id: "4",
    clientName: "Amanda Wilson",
    clientId: "client-4",
    formType: "PRP Treatment",
    status: "signed",
    signedDate: "2025-12-18",
    expiryDate: "2026-12-18",
    provider: "Dr. Chen",
    location: "Downtown Clinic",
    notes: "All consent forms completed",
    createdAt: "2025-12-18T16:45:00Z",
  },
];

const formTypes = [
  "Botox Treatment",
  "Dermal Filler",
  "Hydrafacial Treatment",
  "PRP Treatment",
  "Laser Hair Removal",
  "Chemical Peel",
  "Microneedling",
  "CoolSculpting",
  "General Consultation",
];

const statusOptions = ["All", "signed", "pending", "expired", "draft"];

export function ConsentForms({ onPageChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedForm, setSelectedForm] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    clientName: "",
    clientId: "",
    formType: "",
    provider: "",
    location: "",
    notes: "",
  });

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
    const matchesSearch = 
      form.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.formType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.provider.toLowerCase().includes(searchQuery.toLowerCase());

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
    alert("New consent form created successfully!");
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

  const handleDownloadForm = (formId) => {
    // Here you would typically generate and download the PDF
    console.log(`Downloading consent form ${formId}`);
    alert("Consent form PDF downloaded successfully!");
  };

  const handleSendReminder = (formId) => {
    // Here you would typically send a reminder to the client
    console.log(`Sending reminder for consent form ${formId}`);
    alert("Reminder sent to client successfully!");
  };

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
            <h1 className="text-2xl font-bold text-foreground">Digital Consent Forms</h1>
            <p className="text-muted-foreground">Manage client consent forms and documentation</p>
          </div>
        </div>
        <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              New Consent Form
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Consent Form</DialogTitle>
              <DialogDescription>
                Create a new consent form for a client
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <Select value={newForm.formType} onValueChange={(value) => setNewForm(prev => ({ ...prev, formType: value }))}>
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue placeholder="Select form type" />
                  </SelectTrigger>
                  <SelectContent>
                    {formTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateFormOpen(false)}
                  className="border-border hover:bg-primary/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateForm}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Create Form
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

      {/* Consent Forms Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Consent Forms ({filteredForms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Form Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signed Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{form.clientName}</div>
                      <div className="text-sm text-muted-foreground">ID: {form.clientId}</div>
                    </TableCell>
                    <TableCell className="text-foreground">{form.formType}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-foreground">{form.provider}</div>
                        <div className="text-sm text-muted-foreground">{form.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(form.status)}
                        <Badge variant={getStatusBadgeVariant(form.status)}>
                          {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {form.signedDate ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {new Date(form.signedDate).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not signed</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {new Date(form.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(form)}
                          className="border-border hover:bg-primary/5"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadForm(form.id)}
                          className="border-border hover:bg-primary/5"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {form.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendReminder(form.id)}
                            className="border-border hover:bg-primary/5"
                          >
                            Send Reminder
                          </Button>
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

      {/* Form Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Consent Form Details</DialogTitle>
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
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="border-border hover:bg-primary/5"
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
