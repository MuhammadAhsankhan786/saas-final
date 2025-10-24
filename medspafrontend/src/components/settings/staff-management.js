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
import { Switch } from "../ui/switch";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Shield,
  Save,
  X,
  Check,
} from "lucide-react";

export function StaffManagement({ onPageChange }) {
  const [staff, setStaff] = useState([
    {
      id: "1",
      firstName: "Dr. Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@medispa.com",
      phone: "(555) 123-4567",
      role: "Doctor",
      department: "Dermatology",
      licenseNumber: "MD-2024-001",
      hireDate: "2024-01-15",
      salary: 120000,
      hourlyRate: 0,
      isActive: true,
      schedule: {
        monday: { start: "09:00", end: "17:00", available: true },
        tuesday: { start: "09:00", end: "17:00", available: true },
        wednesday: { start: "09:00", end: "17:00", available: true },
        thursday: { start: "09:00", end: "17:00", available: true },
        friday: { start: "09:00", end: "17:00", available: true },
        saturday: { start: "10:00", end: "15:00", available: true },
        sunday: { start: "10:00", end: "15:00", available: false },
      },
      permissions: {
        viewAppointments: true,
        createAppointments: true,
        editAppointments: true,
        deleteAppointments: false,
        viewClients: true,
        editClients: true,
        viewReports: true,
        manageInventory: false,
        manageStaff: false,
        systemSettings: false,
      },
    },
    {
      id: "2",
      firstName: "Emily",
      lastName: "Davis",
      email: "emily.davis@medispa.com",
      phone: "(555) 234-5678",
      role: "Nurse",
      department: "Aesthetics",
      licenseNumber: "RN-2024-002",
      hireDate: "2024-02-01",
      salary: 0,
      hourlyRate: 35,
      isActive: true,
      schedule: {
        monday: { start: "08:00", end: "16:00", available: true },
        tuesday: { start: "08:00", end: "16:00", available: true },
        wednesday: { start: "08:00", end: "16:00", available: true },
        thursday: { start: "08:00", end: "16:00", available: true },
        friday: { start: "08:00", end: "16:00", available: true },
        saturday: { start: "09:00", end: "14:00", available: true },
        sunday: { start: "09:00", end: "14:00", available: false },
      },
      permissions: {
        viewAppointments: true,
        createAppointments: true,
        editAppointments: true,
        deleteAppointments: false,
        viewClients: true,
        editClients: true,
        viewReports: false,
        manageInventory: true,
        manageStaff: false,
        systemSettings: false,
      },
    },
    {
      id: "3",
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.brown@medispa.com",
      phone: "(555) 345-6789",
      role: "Receptionist",
      department: "Administration",
      licenseNumber: "",
      hireDate: "2024-03-01",
      salary: 0,
      hourlyRate: 20,
      isActive: true,
      schedule: {
        monday: { start: "09:00", end: "18:00", available: true },
        tuesday: { start: "09:00", end: "18:00", available: true },
        wednesday: { start: "09:00", end: "18:00", available: true },
        thursday: { start: "09:00", end: "18:00", available: true },
        friday: { start: "09:00", end: "18:00", available: true },
        saturday: { start: "10:00", end: "16:00", available: true },
        sunday: { start: "10:00", end: "16:00", available: false },
      },
      permissions: {
        viewAppointments: true,
        createAppointments: true,
        editAppointments: true,
        deleteAppointments: false,
        viewClients: true,
        editClients: true,
        viewReports: false,
        manageInventory: false,
        manageStaff: false,
        systemSettings: false,
      },
    },
  ]);

  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [newStaff, setNewStaff] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    licenseNumber: "",
    hireDate: "",
    salary: 0,
    hourlyRate: 0,
    isActive: true,
    schedule: {
      monday: { start: "09:00", end: "17:00", available: true },
      tuesday: { start: "09:00", end: "17:00", available: true },
      wednesday: { start: "09:00", end: "17:00", available: true },
      thursday: { start: "09:00", end: "17:00", available: true },
      friday: { start: "09:00", end: "17:00", available: true },
      saturday: { start: "10:00", end: "15:00", available: true },
      sunday: { start: "10:00", end: "15:00", available: false },
    },
    permissions: {
      viewAppointments: true,
      createAppointments: true,
      editAppointments: true,
      deleteAppointments: false,
      viewClients: true,
      editClients: true,
      viewReports: false,
      manageInventory: false,
      manageStaff: false,
      systemSettings: false,
    },
  });

  const roles = [
    "Doctor",
    "Nurse",
    "Aesthetician",
    "Receptionist",
    "Manager",
    "Administrator",
  ];

  const departments = [
    "Dermatology",
    "Aesthetics",
    "Administration",
    "Management",
    "Support",
  ];

  const days = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
  ];

  const dayNames = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const handleInputChange = (field, value) => {
    setNewStaff(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field, value) => {
    setEditingStaff(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (day, field, value) => {
    setNewStaff(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
  };

  const handleEditScheduleChange = (day, field, value) => {
    setEditingStaff(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
  };

  const handlePermissionChange = (permission, value) => {
    setNewStaff(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const handleEditPermissionChange = (permission, value) => {
    setEditingStaff(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const handleAddStaff = () => {
    if (newStaff.firstName && newStaff.lastName && newStaff.email && newStaff.role) {
      const staffMember = {
        id: Date.now().toString(),
        ...newStaff,
      };
      setStaff(prev => [...prev, staffMember]);
      setNewStaff({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "",
        department: "",
        licenseNumber: "",
        hireDate: "",
        salary: 0,
        hourlyRate: 0,
        isActive: true,
        schedule: {
          monday: { start: "09:00", end: "17:00", available: true },
          tuesday: { start: "09:00", end: "17:00", available: true },
          wednesday: { start: "09:00", end: "17:00", available: true },
          thursday: { start: "09:00", end: "17:00", available: true },
          friday: { start: "09:00", end: "17:00", available: true },
          saturday: { start: "10:00", end: "15:00", available: true },
          sunday: { start: "10:00", end: "15:00", available: false },
        },
        permissions: {
          viewAppointments: true,
          createAppointments: true,
          editAppointments: true,
          deleteAppointments: false,
          viewClients: true,
          editClients: true,
          viewReports: false,
          manageInventory: false,
          manageStaff: false,
          systemSettings: false,
        },
      });
      setIsAddingStaff(false);
    }
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff({ ...staffMember });
  };

  const handleSaveEdit = () => {
    if (editingStaff) {
      setStaff(prev => prev.map(s => s.id === editingStaff.id ? editingStaff : s));
      setEditingStaff(null);
    }
  };

  const handleDeleteStaff = (staffId) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      setStaff(prev => prev.filter(s => s.id !== staffId));
    }
  };

  const handleToggleActive = (staffId) => {
    setStaff(prev => prev.map(s => 
      s.id === staffId ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const getRoleColor = (role) => {
    const colors = {
      "Doctor": "bg-blue-100 text-blue-800",
      "Nurse": "bg-green-100 text-green-800",
      "Aesthetician": "bg-purple-100 text-purple-800",
      "Receptionist": "bg-orange-100 text-orange-800",
      "Manager": "bg-red-100 text-red-800",
      "Administrator": "bg-gray-100 text-gray-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
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
            <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
            <p className="text-muted-foreground">Manage your staff members and their permissions</p>
          </div>
        </div>
        <Button
          onClick={() => setIsAddingStaff(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {staff.map((staffMember) => (
          <Card key={staffMember.id} className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">
                    {staffMember.firstName} {staffMember.lastName}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getRoleColor(staffMember.role)}>
                      {staffMember.role}
                    </Badge>
                    <Badge variant={staffMember.isActive ? "outline" : "secondary"}>
                      {staffMember.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditStaff(staffMember)}
                    className="border-border hover:bg-primary/5"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteStaff(staffMember.id)}
                    className="border-border hover:bg-destructive/5 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{staffMember.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{staffMember.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{staffMember.department}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Hired: {new Date(staffMember.hireDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>
                  {staffMember.salary > 0 
                    ? `$${staffMember.salary.toLocaleString()}/year`
                    : `$${staffMember.hourlyRate}/hour`
                  }
                </span>
              </div>
              {staffMember.licenseNumber && (
                <div className="text-sm text-muted-foreground">
                  License: {staffMember.licenseNumber}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Staff Modal */}
      {isAddingStaff && (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Add New Staff Member</CardTitle>
              <Button
                variant="outline"
                onClick={() => setIsAddingStaff(false)}
                className="border-border hover:bg-primary/5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newStaff.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newStaff.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newStaff.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newStaff.role} 
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select 
                  value={newStaff.department} 
                  onValueChange={(value) => handleInputChange("department", value)}
                >
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={newStaff.licenseNumber}
                  onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={newStaff.hireDate}
                  onChange={(e) => handleInputChange("hireDate", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary">Annual Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={newStaff.salary}
                  onChange={(e) => handleInputChange("salary", parseFloat(e.target.value) || 0)}
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={newStaff.hourlyRate}
                  onChange={(e) => handleInputChange("hourlyRate", parseFloat(e.target.value) || 0)}
                  className="bg-input-background border-border"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={newStaff.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
              <Label>Active</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAddingStaff(false)}
                className="border-border hover:bg-primary/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStaff}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Check className="mr-2 h-4 w-4" />
                Add Staff Member
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Edit Staff Member</CardTitle>
              <Button
                variant="outline"
                onClick={() => setEditingStaff(null)}
                className="border-border hover:bg-primary/5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editingStaff.firstName}
                  onChange={(e) => handleEditInputChange("firstName", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editingStaff.lastName}
                  onChange={(e) => handleEditInputChange("lastName", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingStaff.email}
                  onChange={(e) => handleEditInputChange("email", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={editingStaff.phone}
                  onChange={(e) => handleEditInputChange("phone", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editRole">Role</Label>
                <Select 
                  value={editingStaff.role} 
                  onValueChange={(value) => handleEditInputChange("role", value)}
                >
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editDepartment">Department</Label>
                <Select 
                  value={editingStaff.department} 
                  onValueChange={(value) => handleEditInputChange("department", value)}
                >
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editLicenseNumber">License Number</Label>
                <Input
                  id="editLicenseNumber"
                  value={editingStaff.licenseNumber}
                  onChange={(e) => handleEditInputChange("licenseNumber", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="editHireDate">Hire Date</Label>
                <Input
                  id="editHireDate"
                  type="date"
                  value={editingStaff.hireDate}
                  onChange={(e) => handleEditInputChange("hireDate", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editSalary">Annual Salary</Label>
                <Input
                  id="editSalary"
                  type="number"
                  value={editingStaff.salary}
                  onChange={(e) => handleEditInputChange("salary", parseFloat(e.target.value) || 0)}
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="editHourlyRate">Hourly Rate</Label>
                <Input
                  id="editHourlyRate"
                  type="number"
                  value={editingStaff.hourlyRate}
                  onChange={(e) => handleEditInputChange("hourlyRate", parseFloat(e.target.value) || 0)}
                  className="bg-input-background border-border"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={editingStaff.isActive}
                onCheckedChange={(checked) => handleEditInputChange("isActive", checked)}
              />
              <Label>Active</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setEditingStaff(null)}
                className="border-border hover:bg-primary/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
