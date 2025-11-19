"use client";

import React, { useState, useRef, useEffect } from "react";
import { notify } from "@/lib/toast";
import { uploadTreatmentPhotos, getTreatments, createTreatment, getTreatmentPhoto } from "@/lib/api";
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
  Camera,
  Plus,
  Eye,
  Edit,
  Download,
  Calendar,
  User,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

const services = [
  "Botox Treatment",
  "Dermal Filler",
  "Hydrafacial",
  "PRP Treatment",
  "Laser Hair Removal",
  "Chemical Peel",
  "Microneedling",
  "CoolSculpting",
];

export function BeforeAfterPhotos({ onPageChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSession, setNewSession] = useState({
    clientName: "",
    clientId: "",
    appointmentId: "",
    provider: "",
    service: "",
    notes: "",
  });
  
  // File input refs for photo uploads
  const beforePhotoInputRef = useRef(null);
  const afterPhotoInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [photoBlobUrls, setPhotoBlobUrls] = useState({}); // Cache for photo blob URLs

  // Helper function to fetch photo as blob URL
  const fetchPhotoAsBlob = async (treatmentId, type) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const response = await fetch(`${baseUrl}/files/treatments/${treatmentId}/${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) return null;
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`Error fetching ${type} photo:`, error);
      return null;
    }
  };

  // Fetch real treatments data
  useEffect(() => {
    async function fetchTreatments() {
      try {
        setLoading(true);
        const data = await getTreatments();
        const treatmentsList = Array.isArray(data) ? data : (data?.data || []);
        setTreatments(treatmentsList);
        console.log('✅ Treatments fetched:', treatmentsList);
        
        // Pre-fetch photo blob URLs for treatments with photos
        const blobUrlPromises = [];
        treatmentsList.forEach(treatment => {
          if (treatment.before_photo) {
            const key = `${treatment.id}-before`;
            if (!photoBlobUrls[key]) {
              blobUrlPromises.push(
                fetchPhotoAsBlob(treatment.id, 'before').then(blobUrl => ({
                  key,
                  url: blobUrl
                }))
              );
            }
          }
          if (treatment.after_photo) {
            const key = `${treatment.id}-after`;
            if (!photoBlobUrls[key]) {
              blobUrlPromises.push(
                fetchPhotoAsBlob(treatment.id, 'after').then(blobUrl => ({
                  key,
                  url: blobUrl
                }))
              );
            }
          }
        });
        
        if (blobUrlPromises.length > 0) {
          const results = await Promise.all(blobUrlPromises);
          const newBlobUrls = {};
          results.forEach(({ key, url }) => {
            if (url) newBlobUrls[key] = url;
          });
          setPhotoBlobUrls(prev => ({ ...prev, ...newBlobUrls }));
        }
      } catch (error) {
        console.error('❌ Error fetching treatments:', error);
        notify.error('Failed to load treatments');
      } finally {
        setLoading(false);
      }
    }
    fetchTreatments();
  }, []);

  // Convert treatments to photo sessions format
  const photoSessions = treatments.map((treatment) => {
    // Get blob URLs from cache
    const beforePhotoUrl = treatment.before_photo 
      ? photoBlobUrls[`${treatment.id}-before`] || null
      : null;
    const afterPhotoUrl = treatment.after_photo 
      ? photoBlobUrls[`${treatment.id}-after`] || null
      : null;

    return {
      id: treatment.id?.toString() || '',
      treatmentId: treatment.id,
      appointmentId: treatment.appointment_id,
      clientName: treatment.appointment?.client?.name || 'Unknown Client',
      clientId: treatment.appointment?.client?.id?.toString() || '',
      date: treatment.treatment_date || treatment.appointment?.start_time || new Date().toISOString().split('T')[0],
      provider: treatment.provider?.name || 'Provider',
      service: treatment.treatment_type || treatment.appointment?.service?.name || 'Treatment',
      beforePhotos: treatment.before_photo ? [{ 
        id: 'before-1', 
        url: beforePhotoUrl,
        description: 'Before treatment' 
      }] : [],
      afterPhotos: treatment.after_photo ? [{ 
        id: 'after-1', 
        url: afterPhotoUrl,
        description: 'After treatment' 
      }] : [],
      notes: treatment.notes || treatment.description || '',
      createdAt: treatment.created_at,
    };
  });

  const filteredSessions = photoSessions.filter((session) =>
    session.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setIsDetailsOpen(true);
  };

  const handleCreateSession = () => {
    // Here you would typically create a new photo session
    console.log("Creating new photo session:", newSession);
    notify.success("Photo session created successfully!");
    setIsCreateSessionOpen(false);
    setNewSession({
      clientName: "",
      clientId: "",
      appointmentId: "",
      provider: "",
      service: "",
      notes: "",
    });
  };

  const handleInputChange = (field, value) => {
    setNewSession(prev => ({ ...prev, [field]: value }));
  };

  const handleUploadPhoto = (sessionId, type) => {
    // Trigger file input based on type
    if (type === "before") {
      beforePhotoInputRef.current?.click();
    } else if (type === "after") {
      afterPhotoInputRef.current?.click();
    }
  };

  const handleFileSelect = async (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      notify.error("Please select a valid image file (JPEG or PNG)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      notify.error("Image size must be less than 2MB");
      return;
    }

    if (!selectedSession || !selectedSession.treatmentId) {
      notify.error("Please select a valid treatment session");
      return;
    }

    try {
      setUploading(true);
      
      // Prepare photo data
      const photoData = {};
      if (type === "before") {
        photoData.before_photo = file;
      } else if (type === "after") {
        photoData.after_photo = file;
      }

      const treatmentId = selectedSession.treatmentId;
      
      console.log(`📤 Uploading ${type} photo for treatment ${treatmentId}...`);
      
      // Upload photo via API
      const response = await uploadTreatmentPhotos(treatmentId, photoData);
      
      notify.success(`${type === "before" ? "Before" : "After"} photo uploaded successfully!`);
      
      // Refresh treatments data
      const data = await getTreatments();
      const treatmentsList = Array.isArray(data) ? data : (data?.data || []);
      setTreatments(treatmentsList);
      
      // Update selected session with new data
      const updatedTreatment = treatmentsList.find(t => t.id === treatmentId);
      
      // Fetch new photo blob URLs if photos were uploaded
      const newBlobUrls = {};
      if (updatedTreatment?.before_photo && type === 'before') {
        const blobUrl = await fetchPhotoAsBlob(treatmentId, 'before');
        if (blobUrl) {
          newBlobUrls[`${treatmentId}-before`] = blobUrl;
        }
      }
      if (updatedTreatment?.after_photo && type === 'after') {
        const blobUrl = await fetchPhotoAsBlob(treatmentId, 'after');
        if (blobUrl) {
          newBlobUrls[`${treatmentId}-after`] = blobUrl;
        }
      }
      
      if (Object.keys(newBlobUrls).length > 0) {
        setPhotoBlobUrls(prev => ({ ...prev, ...newBlobUrls }));
      }
      if (updatedTreatment) {
        // Get blob URLs from cache
        const beforePhotoUrl = updatedTreatment.before_photo 
          ? (newBlobUrls[`${treatmentId}-before`] || photoBlobUrls[`${treatmentId}-before`] || null)
          : null;
        const afterPhotoUrl = updatedTreatment.after_photo 
          ? (newBlobUrls[`${treatmentId}-after`] || photoBlobUrls[`${treatmentId}-after`] || null)
          : null;

        const updatedSession = {
          ...selectedSession,
          beforePhotos: updatedTreatment.before_photo ? [{ 
            id: 'before-1', 
            url: beforePhotoUrl,
            description: 'Before treatment' 
          }] : [],
          afterPhotos: updatedTreatment.after_photo ? [{ 
            id: 'after-1', 
            url: afterPhotoUrl,
            description: 'After treatment' 
          }] : [],
        };
        setSelectedSession(updatedSession);
      }
      
      // Also update the treatments list to reflect the change
      setTreatments(treatmentsList);
      
      console.log("✅ Photo uploaded successfully:", response);
      
      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error("❌ Error uploading photo:", error);
      notify.error(error.message || `Failed to upload ${type} photo`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadPhotos = (sessionId) => {
    // Here you would typically download all photos for a session
    console.log(`Downloading all photos for session ${sessionId}`);
    notify.success("Photos downloaded successfully!");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Create Photo Session Dialog - Shared between desktop and mobile */}
      <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
        <DialogContent className="bg-card border-border max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create New Photo Session</DialogTitle>
            <DialogDescription className="text-sm">
              Set up a new before/after photo session for a client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={newSession.clientName}
                  onChange={(e) => handleInputChange("clientName", e.target.value)}
                  placeholder="Enter client name"
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={newSession.clientId}
                  onChange={(e) => handleInputChange("clientId", e.target.value)}
                  placeholder="Enter client ID"
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="appointmentId">Appointment ID</Label>
                <Input
                  id="appointmentId"
                  value={newSession.appointmentId}
                  onChange={(e) => handleInputChange("appointmentId", e.target.value)}
                  placeholder="Enter appointment ID"
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  value={newSession.provider}
                  onChange={(e) => handleInputChange("provider", e.target.value)}
                  placeholder="Enter provider name"
                  className="bg-input-background border-border"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="service">Service</Label>
              <Select value={newSession.service} onValueChange={(value) => handleInputChange("service", value)}>
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
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newSession.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about the photo session..."
                className="bg-input-background border-border"
                rows={3}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateSessionOpen(false)}
                className="border-border hover:bg-primary/5 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
              >
                Create Session
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
            <h1 className="text-xl font-bold text-foreground">Before/After Photos</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Document treatment results with photo comparisons</p>
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
              <h1 className="text-2xl font-bold text-foreground">Before/After Photos</h1>
              <p className="text-sm text-muted-foreground">Document treatment results with photo comparisons</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsCreateSessionOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground" 
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Photo Session
          </Button>
        </div>
        
        {/* Mobile: Action buttons below heading */}
        <div className="sm:hidden">
          <Button 
            onClick={() => setIsCreateSessionOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full" 
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Photo Session
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Search Photo Sessions</CardTitle>
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

      {/* Photo Sessions Table - Responsive */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg sm:text-xl">
            Photo Sessions ({filteredSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm sm:text-base">Loading treatments...</div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground mb-2 text-sm sm:text-base">No treatments found</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Create a treatment to upload before/after photos</p>
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
                    <TableHead className="text-xs sm:text-sm">Photos</TableHead>
                    <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="font-medium text-foreground">{session.clientName}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{session.service}</div>
                        <div className="text-xs text-muted-foreground">ID: {session.clientId}</div>
                      </TableCell>
                      <TableCell className="text-foreground text-xs sm:text-sm hidden sm:table-cell">{session.service}</TableCell>
                      <TableCell className="text-foreground text-xs sm:text-sm hidden md:table-cell">{session.provider}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {new Date(session.date).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {session.beforePhotos.length} Before
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {session.afterPhotos.length} After
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(session)}
                            className="border-border hover:bg-primary/5 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPhotos(session.id)}
                            className="border-border hover:bg-primary/5 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                          >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
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

      {/* Photo Session Details Dialog - Responsive */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Photo Session Details</DialogTitle>
            <DialogDescription className="text-sm">
              Before and after photos for this treatment session
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-6">
              {/* Hidden file inputs */}
              <input
                type="file"
                ref={beforePhotoInputRef}
                accept="image/jpeg,image/jpg,image/png"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e, "before")}
              />
              <input
                type="file"
                ref={afterPhotoInputRef}
                accept="image/jpeg,image/jpg,image/png"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e, "after")}
              />

              {/* Basic Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Session Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Client Name</div>
                    <div className="font-medium text-foreground">{selectedSession.clientName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Service</div>
                    <div className="font-medium text-foreground">{selectedSession.service}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Provider</div>
                    <div className="font-medium text-foreground">{selectedSession.provider}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium text-foreground">
                      {new Date(selectedSession.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Before Photos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center">
                    <Camera className="mr-2 h-4 w-4" />
                    Before Photos ({selectedSession.beforePhotos.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUploadPhoto(selectedSession.id, "before")}
                    disabled={uploading}
                    className="border-border hover:bg-primary/5"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Before Photo"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedSession.beforePhotos.map((photo) => (
                    <div key={photo.id} className="border border-border rounded-lg p-4">
                      <div className="aspect-[3/4] bg-muted rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {photo.url ? (
                          <img 
                            src={photo.url} 
                            alt={photo.description}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`h-full w-full items-center justify-center ${photo.url ? 'hidden' : 'flex'}`}>
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm text-foreground">{photo.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* After Photos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center">
                    <Camera className="mr-2 h-4 w-4" />
                    After Photos ({selectedSession.afterPhotos.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUploadPhoto(selectedSession.id, "after")}
                    disabled={uploading}
                    className="border-border hover:bg-primary/5"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload After Photo"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedSession.afterPhotos.map((photo) => (
                    <div key={photo.id} className="border border-border rounded-lg p-4">
                      <div className="aspect-[3/4] bg-muted rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {photo.url ? (
                          <img 
                            src={photo.url} 
                            alt={photo.description}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`h-full w-full items-center justify-center ${photo.url ? 'hidden' : 'flex'}`}>
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm text-foreground">{photo.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedSession.notes && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Notes</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-foreground">{selectedSession.notes}</p>
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
                  onClick={() => handleDownloadPhotos(selectedSession.id)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All Photos
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
