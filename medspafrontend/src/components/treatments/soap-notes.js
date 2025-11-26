"use client";

import React, { useState, useEffect } from "react";
import { getTreatments, createTreatment, updateTreatment, getAppointmentFormData, getAppointments } from "@/lib/api";
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
  Calendar,
  User,
  Stethoscope,
  Clock,
  Save,
} from "lucide-react";

export function SOAPNotes({ onPageChange }) {
  const role = JSON.parse(localStorage.getItem("user") || "{}").role;
  const isAdmin = role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [newNote, setNewNote] = useState({
    appointment_id: "",
    treatment_type: "",
    notes: "", // SOAP notes stored in notes field
    description: "", // Can be used for additional details
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    followUp: "",
  });
  const [editNote, setEditNote] = useState({
    appointment_id: "",
    treatment_type: "",
    notes: "",
    description: "",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    followUp: "",
  });

  // Fetch real treatments data (SOAP notes are stored in treatments.notes)
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [treatmentsData, appointmentsData, formData] = await Promise.all([
          getTreatments(),
          getAppointments(),
          getAppointmentFormData(),
        ]);
        
        const treatmentsList = Array.isArray(treatmentsData) ? treatmentsData : (treatmentsData?.data || []);
        setTreatments(treatmentsList);
        
        // Get appointments for provider (to create new SOAP notes)
        const appointmentsList = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData?.data || []);
        setAppointments(appointmentsList);
        
        // Extract services from form data
        if (formData?.services) {
          setServices(formData.services);
        } else if (Array.isArray(formData)) {
          // If formData is an array, it might be services
          setServices(formData);
        }
        
        console.log('✅ SOAP Notes: Treatments fetched:', treatmentsList);
        console.log('✅ SOAP Notes: Appointments fetched:', appointmentsList);
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        notify.error('Failed to load SOAP notes');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Convert treatments to SOAP notes format
  // SOAP notes are stored in treatment.notes field
  const soapNotes = treatments.map((treatment) => {
    // Parse SOAP notes from treatment.notes if it's structured
    // Otherwise, use notes as-is
    const notesText = treatment.notes || treatment.description || '';
    
    return {
      id: treatment.id?.toString() || '',
      treatmentId: treatment.id,
      clientName: treatment.appointment?.client?.name || 'Unknown Client',
      clientId: treatment.appointment?.client?.id?.toString() || '',
      appointmentId: treatment.appointment_id?.toString() || '',
      date: treatment.treatment_date || treatment.appointment?.start_time || new Date().toISOString().split('T')[0],
      provider: treatment.provider?.name || 'Provider',
      service: treatment.treatment_type || treatment.appointment?.service?.name || 'Treatment',
      notes: notesText, // Full notes text
      // If notes contain structured SOAP format, parse it
      subjective: notesText.includes('Subjective:') ? notesText.split('Subjective:')[1]?.split('Objective:')[0]?.trim() : '',
      objective: notesText.includes('Objective:') ? notesText.split('Objective:')[1]?.split('Assessment:')[0]?.trim() : '',
      assessment: notesText.includes('Assessment:') ? notesText.split('Assessment:')[1]?.split('Plan:')[0]?.trim() : '',
      plan: notesText.includes('Plan:') ? notesText.split('Plan:')[1]?.split('Follow-up:')[0]?.trim() : '',
      followUp: notesText.includes('Follow-up:') ? notesText.split('Follow-up:')[1]?.trim() : '',
      createdAt: treatment.created_at,
    };
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

  const handleEditNote = (note) => {
    // Parse SOAP notes from the note object
    const notesText = note.notes || '';
    setEditingNote(note);
    setEditNote({
      appointment_id: note.appointmentId || "",
      treatment_type: note.service || "",
      notes: notesText,
      description: "",
      subjective: note.subjective || "",
      objective: note.objective || "",
      assessment: note.assessment || "",
      plan: note.plan || "",
      followUp: note.followUp || "",
    });
    setIsEditNoteOpen(true);
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.treatmentId) {
      notify.error("Please select a note to update");
      return;
    }

    try {
      // Format SOAP notes into structured text
      const soapNotesText = [
        editNote.subjective ? `Subjective: ${editNote.subjective}` : '',
        editNote.objective ? `Objective: ${editNote.objective}` : '',
        editNote.assessment ? `Assessment: ${editNote.assessment}` : '',
        editNote.plan ? `Plan: ${editNote.plan}` : '',
        editNote.followUp ? `Follow-up: ${editNote.followUp}` : '',
      ].filter(Boolean).join('\n\n');

      const treatmentData = {
        appointment_id: parseInt(editNote.appointment_id) || editingNote.appointmentId,
        provider_id: JSON.parse(localStorage.getItem('user') || '{}').id,
        treatment_type: editNote.treatment_type || editingNote.service || 'Treatment',
        notes: soapNotesText,
        description: editNote.description || '',
        cost: 0,
        status: 'completed',
        treatment_date: editingNote.date || new Date().toISOString().split('T')[0],
      };

      await updateTreatment(editingNote.treatmentId, treatmentData);
      notify.success("SOAP note updated successfully!");
      
      // Refresh treatments
      const data = await getTreatments();
      const treatmentsList = Array.isArray(data) ? data : (data?.data || []);
      setTreatments(treatmentsList);
      
      setIsEditNoteOpen(false);
      setEditingNote(null);
      setEditNote({
        appointment_id: "",
        treatment_type: "",
        notes: "",
        description: "",
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
        followUp: "",
      });
    } catch (error) {
      console.error("Error updating SOAP note:", error);
      notify.error(error.message || "Failed to update SOAP note");
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditNote(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateNote = async () => {
    if (!newNote.appointment_id) {
      notify.error("Please select an appointment");
      return;
    }

    try {
      // Format SOAP notes into structured text
      const soapNotesText = [
        newNote.subjective ? `Subjective: ${newNote.subjective}` : '',
        newNote.objective ? `Objective: ${newNote.objective}` : '',
        newNote.assessment ? `Assessment: ${newNote.assessment}` : '',
        newNote.plan ? `Plan: ${newNote.plan}` : '',
        newNote.followUp ? `Follow-up: ${newNote.followUp}` : '',
      ].filter(Boolean).join('\n\n');

      const treatmentData = {
        appointment_id: parseInt(newNote.appointment_id),
        provider_id: JSON.parse(localStorage.getItem('user') || '{}').id,
        treatment_type: newNote.treatment_type || 'Treatment',
        notes: soapNotesText,
        description: newNote.description || '',
        cost: 0,
        status: 'completed',
        treatment_date: new Date().toISOString().split('T')[0],
      };

      await createTreatment(treatmentData);
      notify.success("SOAP note created successfully!");
      
      // Refresh treatments
      const data = await getTreatments();
      const treatmentsList = Array.isArray(data) ? data : (data?.data || []);
      setTreatments(treatmentsList);
      
      setIsCreateNoteOpen(false);
      setNewNote({
        appointment_id: "",
        treatment_type: "",
        notes: "",
        description: "",
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
        followUp: "",
      });
    } catch (error) {
      console.error("Error creating SOAP note:", error);
      notify.error(error.message || "Failed to create SOAP note");
    }
  };

  const handleInputChange = (field, value) => {
    setNewNote(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Create SOAP Note Dialog - Shared between desktop and mobile */}
      <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create New SOAP Note</DialogTitle>
            <DialogDescription className="text-sm">
              Document treatment details using SOAP format
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            {/* Basic Information - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment_id">Appointment *</Label>
                <Select 
                  value={newNote.appointment_id} 
                  onValueChange={(value) => handleInputChange("appointment_id", value)}
                >
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue placeholder="Select appointment" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id?.toString()}>
                        {apt.client?.name || 'Client'} - {apt.service?.name || 'Service'} - {apt.start_time ? new Date(apt.start_time).toLocaleDateString() : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="treatment_type">Treatment Type *</Label>
                <Select 
                  value={newNote.treatment_type} 
                  onValueChange={(value) => handleInputChange("treatment_type", value)}
                >
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue placeholder="Select treatment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id || service} value={service.name || service}>
                        {service.name || service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateNoteOpen(false)}
                className="border-border hover:bg-primary/5 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNote}
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Save SOAP Note
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
            <h1 className="text-xl font-bold text-foreground">SOAP Notes</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Treatment documentation and clinical notes</p>
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
              <h1 className="text-2xl font-bold text-foreground">SOAP Notes</h1>
              <p className="text-sm text-muted-foreground">Treatment documentation and clinical notes</p>
            </div>
          </div>
          {!isAdmin && (
            <Button 
              onClick={() => setIsCreateNoteOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground" 
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              New SOAP Note
            </Button>
          )}
        </div>
        
        {/* Mobile: Action buttons below heading */}
        {!isAdmin && (
          <div className="sm:hidden">
            <Button 
              onClick={() => setIsCreateNoteOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full" 
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              New SOAP Note
            </Button>
          </div>
        )}
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

      {/* SOAP Notes Table - Responsive */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg sm:text-xl">
            SOAP Notes ({filteredNotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm sm:text-base">Loading SOAP notes...</div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground mb-2 text-sm sm:text-base">No SOAP notes found</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Create a treatment to add SOAP notes</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Client</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Service</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Provider</TableHead>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="font-medium text-foreground">{note.clientName}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{note.service}</div>
                        <div className="text-xs text-muted-foreground">ID: {note.clientId}</div>
                      </TableCell>
                      <TableCell className="text-foreground text-xs sm:text-sm hidden sm:table-cell">{note.service}</TableCell>
                      <TableCell className="text-foreground text-xs sm:text-sm hidden md:table-cell">{note.provider}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {new Date(note.date).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(note)}
                            className="border-border hover:bg-primary/5 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          {!isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditNote(note)}
                              className="border-border hover:bg-primary/5 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SOAP Note Details Dialog - Responsive */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">SOAP Note Details</DialogTitle>
            <DialogDescription className="text-sm">
              Complete treatment documentation
            </DialogDescription>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4 sm:space-y-6">
              {/* Basic Information - Responsive */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center text-sm sm:text-base">
                  <User className="mr-2 h-4 w-4" />
                  Client Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
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
                {selectedNote.subjective ? (
                  <div>
                    <h3 className="font-semibold text-primary mb-2 flex items-center">
                      <Stethoscope className="mr-2 h-4 w-4" />
                      S - Subjective
                    </h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-foreground whitespace-pre-wrap">{selectedNote.subjective}</p>
                    </div>
                  </div>
                ) : null}

                {selectedNote.objective ? (
                  <div>
                    <h3 className="font-semibold text-primary mb-2 flex items-center">
                      <Eye className="mr-2 h-4 w-4" />
                      O - Objective
                    </h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-foreground whitespace-pre-wrap">{selectedNote.objective}</p>
                    </div>
                  </div>
                ) : null}

                {selectedNote.assessment ? (
                  <div>
                    <h3 className="font-semibold text-primary mb-2 flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      A - Assessment
                    </h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-foreground whitespace-pre-wrap">{selectedNote.assessment}</p>
                    </div>
                  </div>
                ) : null}

                {selectedNote.plan ? (
                  <div>
                    <h3 className="font-semibold text-primary mb-2 flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      P - Plan
                    </h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-foreground whitespace-pre-wrap">{selectedNote.plan}</p>
                    </div>
                  </div>
                ) : null}

                {selectedNote.followUp ? (
                  <div>
                    <h3 className="font-semibold text-primary mb-2">Follow-up</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-foreground whitespace-pre-wrap">{selectedNote.followUp}</p>
                    </div>
                  </div>
                ) : null}

                {/* If no structured SOAP sections, show full notes */}
                {!selectedNote.subjective && !selectedNote.objective && !selectedNote.assessment && !selectedNote.plan && selectedNote.notes && (
                  <div>
                    <h3 className="font-semibold text-primary mb-2">Notes</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-foreground whitespace-pre-wrap">{selectedNote.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions - Responsive */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="border-border hover:bg-primary/5 w-full sm:w-auto"
                >
                  Close
                </Button>
                {!isAdmin && (
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleEditNote(selectedNote);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Note
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit SOAP Note Dialog - Responsive */}
      <Dialog open={isEditNoteOpen} onOpenChange={setIsEditNoteOpen}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit SOAP Note</DialogTitle>
            <DialogDescription className="text-sm">
              Update treatment documentation
            </DialogDescription>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4 sm:space-y-6">
              {/* Appointment Selection */}
              <div>
                <Label htmlFor="edit-appointment" className="text-foreground">Appointment</Label>
                <Select
                  value={editNote.appointment_id}
                  onValueChange={(value) => setEditNote({ ...editNote, appointment_id: value })}
                >
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue placeholder="Select appointment" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id.toString()}>
                        {apt.client?.name || 'Unknown'} - {apt.service?.name || 'Service'} - {new Date(apt.start_time).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Treatment Type */}
              <div>
                <Label htmlFor="edit-treatment-type" className="text-foreground">Treatment Type</Label>
                <Select
                  value={editNote.treatment_type}
                  onValueChange={(value) => setEditNote({ ...editNote, treatment_type: value })}
                >
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue placeholder="Select treatment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SOAP Sections */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-subjective" className="text-lg font-semibold text-primary">
                    S - Subjective
                  </Label>
                  <Textarea
                    id="edit-subjective"
                    value={editNote.subjective}
                    onChange={(e) => setEditNote({ ...editNote, subjective: e.target.value })}
                    placeholder="Patient's reported symptoms, concerns, and history..."
                    className="bg-input-background border-border"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-objective" className="text-lg font-semibold text-primary">
                    O - Objective
                  </Label>
                  <Textarea
                    id="edit-objective"
                    value={editNote.objective}
                    onChange={(e) => setEditNote({ ...editNote, objective: e.target.value })}
                    placeholder="Observable findings, measurements, and clinical data..."
                    className="bg-input-background border-border"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-assessment" className="text-lg font-semibold text-primary">
                    A - Assessment
                  </Label>
                  <Textarea
                    id="edit-assessment"
                    value={editNote.assessment}
                    onChange={(e) => setEditNote({ ...editNote, assessment: e.target.value })}
                    placeholder="Clinical diagnosis, evaluation, and recommendations..."
                    className="bg-input-background border-border"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-plan" className="text-lg font-semibold text-primary">
                    P - Plan
                  </Label>
                  <Textarea
                    id="edit-plan"
                    value={editNote.plan}
                    onChange={(e) => setEditNote({ ...editNote, plan: e.target.value })}
                    placeholder="Treatment plan, procedures performed, and instructions..."
                    className="bg-input-background border-border"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-followUp">Follow-up</Label>
                  <Textarea
                    id="edit-followUp"
                    value={editNote.followUp}
                    onChange={(e) => setEditNote({ ...editNote, followUp: e.target.value })}
                    placeholder="Follow-up appointments, monitoring, and next steps..."
                    className="bg-input-background border-border"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditNoteOpen(false);
                    setEditingNote(null);
                    setEditNote({
                      appointment_id: "",
                      treatment_type: "",
                      notes: "",
                      description: "",
                      subjective: "",
                      objective: "",
                      assessment: "",
                      plan: "",
                      followUp: "",
                    });
                  }}
                  className="border-border hover:bg-primary/5 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateNote}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Update SOAP Note
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
