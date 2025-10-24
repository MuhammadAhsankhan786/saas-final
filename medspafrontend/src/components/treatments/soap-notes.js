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
  Calendar,
  User,
  Stethoscope,
  Clock,
  Save,
} from "lucide-react";

// Mock SOAP notes data
const soapNotes = [
  {
    id: "1",
    clientName: "Emma Johnson",
    clientId: "client-1",
    appointmentId: "apt-1",
    date: "2025-12-21",
    provider: "Dr. Chen",
    service: "Botox Consultation",
    subjective: "Client reports concerns about forehead lines and crow's feet. States lines have become more prominent over the past year. No previous Botox treatments.",
    objective: "Facial assessment shows moderate forehead lines (Grade 2) and mild crow's feet (Grade 1). Skin appears healthy with good elasticity. No contraindications observed.",
    assessment: "Client is a good candidate for Botox treatment. Recommended 20 units for forehead and 12 units for crow's feet areas.",
    plan: "Schedule Botox treatment for next week. Pre-treatment photos taken. Client educated on procedure, risks, and expected results.",
    followUp: "Follow-up appointment scheduled in 2 weeks to assess results.",
    createdAt: "2025-12-21T10:30:00Z",
  },
  {
    id: "2",
    clientName: "Sarah Davis",
    clientId: "client-2",
    appointmentId: "apt-2",
    date: "2025-12-21",
    provider: "Dr. Chen",
    service: "Dermal Filler",
    subjective: "Client seeking lip enhancement. Wants subtle, natural-looking results. Previous filler treatment 8 months ago.",
    objective: "Lip assessment shows good structure. Previous filler has mostly dissolved. Lips appear symmetrical with good blood flow.",
    assessment: "Client suitable for lip enhancement. Recommended 0.5ml Juvederm Ultra for subtle enhancement.",
    plan: "Treatment completed successfully. Client satisfied with immediate results. Post-treatment care instructions provided.",
    followUp: "Follow-up in 2 weeks to assess final results and address any concerns.",
    createdAt: "2025-12-21T11:15:00Z",
  },
  {
    id: "3",
    clientName: "Jessica Martinez",
    clientId: "client-3",
    appointmentId: "apt-3",
    date: "2025-12-21",
    provider: "Dr. Johnson",
    service: "Hydrafacial",
    subjective: "Client reports dull, congested skin. Wants brighter, clearer complexion. No known allergies.",
    objective: "Skin analysis shows mild congestion, some blackheads, and uneven texture. Good skin barrier function.",
    assessment: "Client benefits from Hydrafacial treatment. Skin responds well to exfoliation and extraction.",
    plan: "Hydrafacial treatment completed with extractions and LED therapy. Client tolerated treatment well.",
    followUp: "Recommended monthly treatments for optimal results. Skincare routine provided.",
    createdAt: "2025-12-21T13:00:00Z",
  },
];

const services = [
  "Botox Consultation",
  "Botox Treatment",
  "Dermal Filler",
  "Hydrafacial",
  "PRP Treatment",
  "Laser Hair Removal",
  "Chemical Peel",
  "Microneedling",
];

export function SOAPNotes({ onPageChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    clientName: "",
    clientId: "",
    appointmentId: "",
    provider: "",
    service: "",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    followUp: "",
  });

  const filteredNotes = soapNotes.filter((note) =>
    note.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (note) => {
    setSelectedNote(note);
    setIsDetailsOpen(true);
  };

  const handleCreateNote = () => {
    // Here you would typically create a new SOAP note
    console.log("Creating new SOAP note:", newNote);
    alert("SOAP note created successfully!");
    setIsCreateNoteOpen(false);
    setNewNote({
      clientName: "",
      clientId: "",
      appointmentId: "",
      provider: "",
      service: "",
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
      followUp: "",
    });
  };

  const handleInputChange = (field, value) => {
    setNewNote(prev => ({ ...prev, [field]: value }));
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
            <h1 className="text-2xl font-bold text-foreground">SOAP Notes</h1>
            <p className="text-muted-foreground">Treatment documentation and clinical notes</p>
          </div>
        </div>
        <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              New SOAP Note
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New SOAP Note</DialogTitle>
              <DialogDescription>
                Document treatment details using SOAP format
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={newNote.clientName}
                    onChange={(e) => handleInputChange("clientName", e.target.value)}
                    placeholder="Enter client name"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={newNote.clientId}
                    onChange={(e) => handleInputChange("clientId", e.target.value)}
                    placeholder="Enter client ID"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="appointmentId">Appointment ID</Label>
                  <Input
                    id="appointmentId"
                    value={newNote.appointmentId}
                    onChange={(e) => handleInputChange("appointmentId", e.target.value)}
                    placeholder="Enter appointment ID"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    value={newNote.provider}
                    onChange={(e) => handleInputChange("provider", e.target.value)}
                    placeholder="Enter provider name"
                    className="bg-input-background border-border"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="service">Service</Label>
                <Select value={newNote.service} onValueChange={(value) => handleInputChange("service", value)}>
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SOAP Sections */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subjective" className="text-lg font-semibold text-primary">
                    S - Subjective
                  </Label>
                  <Textarea
                    id="subjective"
                    value={newNote.subjective}
                    onChange={(e) => handleInputChange("subjective", e.target.value)}
                    placeholder="Client's concerns, symptoms, and history..."
                    className="bg-input-background border-border"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="objective" className="text-lg font-semibold text-primary">
                    O - Objective
                  </Label>
                  <Textarea
                    id="objective"
                    value={newNote.objective}
                    onChange={(e) => handleInputChange("objective", e.target.value)}
                    placeholder="Clinical observations, measurements, and findings..."
                    className="bg-input-background border-border"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="assessment" className="text-lg font-semibold text-primary">
                    A - Assessment
                  </Label>
                  <Textarea
                    id="assessment"
                    value={newNote.assessment}
                    onChange={(e) => handleInputChange("assessment", e.target.value)}
                    placeholder="Clinical diagnosis, evaluation, and recommendations..."
                    className="bg-input-background border-border"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="plan" className="text-lg font-semibold text-primary">
                    P - Plan
                  </Label>
                  <Textarea
                    id="plan"
                    value={newNote.plan}
                    onChange={(e) => handleInputChange("plan", e.target.value)}
                    placeholder="Treatment plan, procedures performed, and instructions..."
                    className="bg-input-background border-border"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="followUp">Follow-up</Label>
                  <Textarea
                    id="followUp"
                    value={newNote.followUp}
                    onChange={(e) => handleInputChange("followUp", e.target.value)}
                    placeholder="Follow-up appointments, monitoring, and next steps..."
                    className="bg-input-background border-border"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateNoteOpen(false)}
                  className="border-border hover:bg-primary/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateNote}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save SOAP Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Search SOAP Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by client name, service, or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-input-background border-border"
          />
        </CardContent>
      </Card>

      {/* SOAP Notes Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            SOAP Notes ({filteredNotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{note.clientName}</div>
                      <div className="text-sm text-muted-foreground">ID: {note.clientId}</div>
                    </TableCell>
                    <TableCell className="text-foreground">{note.service}</TableCell>
                    <TableCell className="text-foreground">{note.provider}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {new Date(note.date).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(note)}
                          className="border-border hover:bg-primary/5"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border hover:bg-primary/5"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SOAP Note Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SOAP Note Details</DialogTitle>
            <DialogDescription>
              Complete treatment documentation
            </DialogDescription>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Client Name</div>
                    <div className="font-medium text-foreground">{selectedNote.clientName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Client ID</div>
                    <div className="font-medium text-foreground">{selectedNote.clientId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Appointment ID</div>
                    <div className="font-medium text-foreground">{selectedNote.appointmentId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Provider</div>
                    <div className="font-medium text-foreground">{selectedNote.provider}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Service</div>
                    <div className="font-medium text-foreground">{selectedNote.service}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium text-foreground">
                      {new Date(selectedNote.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* SOAP Sections */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-primary mb-2 flex items-center">
                    <Stethoscope className="mr-2 h-4 w-4" />
                    S - Subjective
                  </h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-foreground">{selectedNote.subjective}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-primary mb-2 flex items-center">
                    <Eye className="mr-2 h-4 w-4" />
                    O - Objective
                  </h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-foreground">{selectedNote.objective}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-primary mb-2 flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    A - Assessment
                  </h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-foreground">{selectedNote.assessment}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-primary mb-2 flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    P - Plan
                  </h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-foreground">{selectedNote.plan}</p>
                  </div>
                </div>

                {selectedNote.followUp && (
                  <div>
                    <h3 className="font-semibold text-primary mb-2">Follow-up</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-foreground">{selectedNote.followUp}</p>
                    </div>
                  </div>
                )}
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
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Note
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
