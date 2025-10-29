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
import { getUsers, createUser, updateUser, deleteUser, getLocations } from "@/lib/api";
import { notify } from "@/lib/toast";
import { useConfirm } from "../ui/confirm-dialog";

export function StaffManagement({ onPageChange }) {
  const { confirm, dialog } = useConfirm();
  const [staff, setStaff] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  
  const role = JSON.parse(localStorage.getItem("user") || "{}").role;
  const isAdmin = role === "admin";

  // Fetch staff data and locations from backend on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        const [users, locationsData] = await Promise.all([
          getUsers(),
          getLocations()
        ]);
        // Filter users to show only staff members (provider, reception roles)
        const staffMembers = users.filter(user => 
          user.role === 'provider' || user.role === 'reception' || user.role === 'admin'
        );
        setStaff(staffMembers);
        setLocations(locationsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "",
    location_id: "",
  });

  const roles = [
    "admin",
    "provider",
    "reception",
  ];

  const handleInputChange = (field, value) => {
    setNewStaff(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field, value) => {
    setEditingStaff(prev => ({ ...prev, [field]: value }));
  };

  const handleAddStaff = async () => {
    if (newStaff.name && newStaff.email && newStaff.role && newStaff.location_id) {
      try {
        setLoading(true);
        setError("");
        
        // Create user via API (password is optional, backend will auto-generate)
        const createdUser = await createUser({
          name: newStaff.name,
          email: newStaff.email,
          role: newStaff.role,
          location_id: newStaff.location_id,
        });
        
        // Refresh staff list from backend
        const users = await getUsers();
        const staffMembers = users.filter(user => 
          user.role === 'provider' || user.role === 'reception' || user.role === 'admin'
        );
        setStaff(staffMembers);
        
        // Reset form
        setNewStaff({
          name: "",
          email: "",
          role: "",
          location_id: "",
        });
        setIsAddingStaff(false);
      } catch (error) {
        console.error("Error adding staff:", error);
        setError("Failed to add staff member: " + error.message);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please fill in all required fields (Name, Email, Role, and Location)");
    }
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff({ ...staffMember });
  };

  const handleSaveEdit = async () => {
    if (editingStaff) {
      try {
        setLoading(true);
        setError("");
        
        // Update user via API
        await updateUser(editingStaff.id, {
          name: editingStaff.name,
          email: editingStaff.email,
          role: editingStaff.role,
          location_id: editingStaff.location_id || null,
        });
        
        // Refresh staff list from backend
        const users = await getUsers();
        const staffMembers = users.filter(user => 
          user.role === 'provider' || user.role === 'reception' || user.role === 'admin'
        );
        setStaff(staffMembers);
        
        setEditingStaff(null);
      } catch (error) {
        console.error("Error updating staff:", error);
        setError("Failed to update staff member: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      try {
        setLoading(true);
        setError("");
        
        // Delete user via API
        await deleteUser(staffId);
        
        // Refresh staff list from backend
        const users = await getUsers();
        const staffMembers = users.filter(user => 
          user.role === 'provider' || user.role === 'reception' || user.role === 'admin'
        );
        setStaff(staffMembers);
      } catch (error) {
        console.error("Error deleting staff:", error);
        setError("Failed to delete staff member: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      "admin": "bg-red-100 text-red-800",
      "provider": "bg-blue-100 text-blue-800",
      "reception": "bg-green-100 text-green-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {!isAdmin && (
            <Button
              variant="outline"
              onClick={() => onPageChange("dashboard")}
              className="border-border hover:bg-primary/5"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
            <p className="text-muted-foreground">Manage your staff members and their permissions</p>
          </div>
        </div>
        {!isAdmin && (
          <Button
            onClick={() => setIsAddingStaff(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading staff data...</div>
        </div>
      )}

      {/* Staff List */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {staff.map((staffMember) => (
            <Card key={staffMember.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">
                      {staffMember.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRoleColor(staffMember.role)}>
                        {staffMember.role}
                      </Badge>
                    </div>
                  </div>
                  {!isAdmin && (
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
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{staffMember.email}</span>
                </div>
                {staffMember.location && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{staffMember.location.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newStaff.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter full name"
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
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
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Select 
                  value={newStaff.location_id} 
                  onValueChange={(value) => handleInputChange("location_id", value)}
                >
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                disabled={loading}
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
                <Label htmlFor="editName">Full Name</Label>
                <Input
                  id="editName"
                  value={editingStaff.name}
                  onChange={(e) => handleEditInputChange("name", e.target.value)}
                  className="bg-input-background border-border"
                />
              </div>
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
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editLocation">Location</Label>
                <Select 
                  value={editingStaff.location_id ? String(editingStaff.location_id) : ""} 
                  onValueChange={(value) => handleEditInputChange("location_id", value)}
                >
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                disabled={loading}
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
