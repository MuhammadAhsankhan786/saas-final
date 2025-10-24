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

// Mock photo data
const photoSessions = [
  {
    id: "1",
    clientName: "Emma Johnson",
    clientId: "client-1",
    appointmentId: "apt-1",
    date: "2025-12-21",
    provider: "Dr. Chen",
    service: "Botox Treatment",
    beforePhotos: [
      { id: "1", url: "/api/placeholder/300/400", description: "Front view before treatment" },
      { id: "2", url: "/api/placeholder/300/400", description: "Side profile before treatment" },
    ],
    afterPhotos: [
      { id: "3", url: "/api/placeholder/300/400", description: "Front view after treatment" },
      { id: "4", url: "/api/placeholder/300/400", description: "Side profile after treatment" },
    ],
    notes: "Significant improvement in forehead lines. Client very satisfied with results.",
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
    beforePhotos: [
      { id: "5", url: "/api/placeholder/300/400", description: "Lip profile before filler" },
    ],
    afterPhotos: [
      { id: "6", url: "/api/placeholder/300/400", description: "Lip profile after filler" },
    ],
    notes: "Subtle enhancement achieved. Natural-looking results.",
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
    beforePhotos: [
      { id: "7", url: "/api/placeholder/300/400", description: "Skin condition before treatment" },
    ],
    afterPhotos: [
      { id: "8", url: "/api/placeholder/300/400", description: "Skin condition after treatment" },
    ],
    notes: "Noticeable improvement in skin texture and brightness.",
    createdAt: "2025-12-21T13:00:00Z",
  },
];

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
  const [newSession, setNewSession] = useState({
    clientName: "",
    clientId: "",
    appointmentId: "",
    provider: "",
    service: "",
    notes: "",
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
    alert("Photo session created successfully!");
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
    // Here you would typically handle photo upload
    console.log(`Uploading ${type} photo for session ${sessionId}`);
    alert(`${type} photo uploaded successfully!`);
  };

  const handleDownloadPhotos = (sessionId) => {
    // Here you would typically download all photos for a session
    console.log(`Downloading all photos for session ${sessionId}`);
    alert("Photos downloaded successfully!");
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
            <h1 className="text-2xl font-bold text-foreground">Before/After Photos</h1>
            <p className="text-muted-foreground">Document treatment results with photo comparisons</p>
          </div>
        </div>
        <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              New Photo Session
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Photo Session</DialogTitle>
              <DialogDescription>
                Set up a new before/after photo session for a client
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateSessionOpen(false)}
                  className="border-border hover:bg-primary/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSession}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Create Session
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

      {/* Photo Sessions Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Photo Sessions ({filteredSessions.length})
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
                  <TableHead>Photos</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{session.clientName}</div>
                      <div className="text-sm text-muted-foreground">ID: {session.clientId}</div>
                    </TableCell>
                    <TableCell className="text-foreground">{session.service}</TableCell>
                    <TableCell className="text-foreground">{session.provider}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {session.beforePhotos.length} Before
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {session.afterPhotos.length} After
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(session)}
                          className="border-border hover:bg-primary/5"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPhotos(session.id)}
                          className="border-border hover:bg-primary/5"
                        >
                          <Download className="h-4 w-4" />
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

      {/* Photo Session Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Photo Session Details</DialogTitle>
            <DialogDescription>
              Before and after photos for this treatment session
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-6">
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
                    className="border-border hover:bg-primary/5"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Before Photo
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedSession.beforePhotos.map((photo) => (
                    <div key={photo.id} className="border border-border rounded-lg p-4">
                      <div className="aspect-[3/4] bg-muted rounded-lg mb-2 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
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
                    className="border-border hover:bg-primary/5"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload After Photo
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedSession.afterPhotos.map((photo) => (
                    <div key={photo.id} className="border border-border rounded-lg p-4">
                      <div className="aspect-[3/4] bg-muted rounded-lg mb-2 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
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
