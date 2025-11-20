"use client";

import React, { useState, useEffect, useRef } from "react";
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
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Save,
  Upload,
  Camera,
} from "lucide-react";
import { getUserProfile, updateUserProfile, uploadProfilePhoto } from "@/lib/api";
import { notify } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

// Helper to ensure profile images use absolute backend URLs
const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If already absolute URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Convert relative URL to absolute backend URL
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  // Remove /api from base URL if present, since storage is served from root
  const baseUrl = apiBase.replace('/api', '');
  // Ensure imagePath starts with / if it doesn't
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${baseUrl}${cleanPath}`;
};

export function ProfileSettings({ onPageChange }) {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    bio: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    date_of_birth: "",
    emergency_contact: "",
    emergency_phone: "",
    profile_image: "",
    notification_preferences: {
      email: true,
      sms: true,
      push: false,
      appointmentReminders: true,
      systemUpdates: true,
      marketing: false,
    },
    privacy_settings: {
      profileVisibility: "staff",
      showEmail: false,
      showPhone: true,
      allowDirectMessages: true,
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch user profile on component mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        setError("");
        
        // Debug: Check authentication
        const token = localStorage.getItem("token");
        console.log("🔍 Profile fetch - Debug info:");
        console.log("🔑 Token present:", !!token);
        if (token) {
          console.log("🔑 Token (first 30 chars):", token.substring(0, 30) + "...");
        }
        console.log("👤 Current user:", user);
        
        const profile = await getUserProfile();
        // Ensure profile image URL is absolute
        if (profile.profile_image) {
          profile.profile_image = getProfileImageUrl(profile.profile_image);
        }
        setProfileData(profile);
      } catch (error) {
        console.error("❌ Error fetching profile:", error);
        setError("Failed to load profile: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (parent, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      console.log("Saving profile:", profileData);
      await updateUserProfile(profileData);
      notify.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Error saving profile: " + error.message);
      notify.error("Error saving profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data if needed
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setError("");
    const toastId = notify.loading("Uploading profile photo...");
    try {
      const result = await uploadProfilePhoto(file);
      setProfileData(prev => ({ 
        ...prev, 
        profile_image: getProfileImageUrl(result.profile_image_url) 
      }));
      notify.dismiss(toastId);
      notify.success("Profile photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      setError("Error uploading photo: " + error.message);
      notify.dismiss(toastId);
      notify.error("Error uploading photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  // Real-time toggle handler for notification and privacy settings
  const handleToggleChange = async (parent, field, checked) => {
    const oldValue = profileData[parent]?.[field];
    
    // Optimistically update UI
    handleNestedInputChange(parent, field, checked);
    
    try {
      // Save immediately to backend - only send the specific field that changed
      const updatedData = {
        [parent]: {
          ...profileData[parent],
          [field]: checked
        }
      };
      await updateUserProfile(updatedData);
      notify.success("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      // Revert on error
      handleNestedInputChange(parent, field, oldValue);
      notify.error("Failed to update settings. Please try again.");
    }
  };

  const departments = [
    "Injectables",
    "Skincare",
    "Laser",
    "Surgery",
    "Administration",
    "Reception",
  ];

  const titles = [
    "Medical Director",
    "Doctor",
    "Nurse Practitioner",
    "Registered Nurse",
    "Aesthetician",
    "Receptionist",
    "Administrator",
  ];

  return (
    <div className="space-y-6">
      {/* Header - Responsive & Professional */}
      <div className="space-y-3 sm:space-y-0">
        {/* Mobile: Heading on top, Back button small icon */}
        <div className="flex items-start justify-between gap-3 sm:hidden">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your personal information and preferences</p>
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
              <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your personal information and preferences</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-border hover:bg-primary/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile: Action buttons below heading */}
        <div className="sm:hidden">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-border hover:bg-primary/5 flex-1"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
                size="sm"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
              size="sm"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!isLoading && (
        <>
          {/* Profile Header */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div 
                className="w-24 h-24 bg-muted rounded-full flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden ring-1 ring-border"
                onClick={handlePhotoClick}
              >
                {profileData.profile_image ? (
                  <img 
                    src={profileData.profile_image} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-contain object-center p-0.5"
                  />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              {isEditing && (
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full"
                  onClick={handlePhotoClick}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">
                {profileData.first_name} {profileData.last_name}
              </h2>
              <p className="text-muted-foreground">{profileData.title}</p>
              <p className="text-muted-foreground">{profileData.department}</p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="outline">Active</Badge>
                <Badge variant="outline">Verified</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <User className="mr-2 h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.first_name || ""}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  disabled={!isEditing}
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.last_name || ""}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  disabled={!isEditing}
                  className="bg-input-background border-border"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>

            {!isClient && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Select 
                    value={profileData.title || ""} 
                    onValueChange={(value) => handleInputChange("title", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="bg-input-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {titles.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={profileData.department || ""} 
                    onValueChange={(value) => handleInputChange("department", value)}
                    disabled={!isEditing}
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
            )}

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio || ""}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profileData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profileData.city || ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  disabled={!isEditing}
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profileData.state || ""}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  disabled={!isEditing}
                  className="bg-input-background border-border"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={profileData.zip_code || ""}
                onChange={(e) => handleInputChange("zip_code", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={profileData.date_of_birth || ""}
                onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={profileData.emergency_contact || ""}
                  onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                  disabled={!isEditing}
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={profileData.emergency_phone || ""}
                  onChange={(e) => handleInputChange("emergency_phone", e.target.value)}
                  disabled={!isEditing}
                  className="bg-input-background border-border"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Communication Methods</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch
                    id="email-notifications"
                    checked={profileData.notification_preferences?.email || false}
                    onCheckedChange={(checked) => handleToggleChange("notification_preferences", "email", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <Switch
                    id="sms-notifications"
                    checked={profileData.notification_preferences?.sms || false}
                    onCheckedChange={(checked) => handleToggleChange("notification_preferences", "sms", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <Switch
                    id="push-notifications"
                    checked={profileData.notification_preferences?.push || false}
                    onCheckedChange={(checked) => handleToggleChange("notification_preferences", "push", checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Notification Types</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="appointment-reminders">Appointment Reminders</Label>
                  <Switch
                    id="appointment-reminders"
                    checked={profileData.notification_preferences?.appointmentReminders || false}
                    onCheckedChange={(checked) => handleToggleChange("notification_preferences", "appointmentReminders", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="system-updates">System Updates</Label>
                  <Switch
                    id="system-updates"
                    checked={profileData.notification_preferences?.systemUpdates || false}
                    onCheckedChange={(checked) => handleToggleChange("notification_preferences", "systemUpdates", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketing">Marketing Communications</Label>
                  <Switch
                    id="marketing"
                    checked={profileData.notification_preferences?.marketing || false}
                    onCheckedChange={(checked) => handleToggleChange("notification_preferences", "marketing", checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="profile-visibility">Profile Visibility</Label>
              <Select 
                value={profileData.privacy_settings?.profileVisibility || "staff"} 
                onValueChange={(value) => handleNestedInputChange("privacy_settings", "profileVisibility", value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="staff">Staff Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-email">Show Email Address</Label>
                <Switch
                  id="show-email"
                  checked={profileData.privacy_settings?.showEmail || false}
                  onCheckedChange={(checked) => handleToggleChange("privacy_settings", "showEmail", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-phone">Show Phone Number</Label>
                <Switch
                  id="show-phone"
                  checked={profileData.privacy_settings?.showPhone || false}
                  onCheckedChange={(checked) => handleToggleChange("privacy_settings", "showPhone", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-messages">Allow Direct Messages</Label>
                <Switch
                  id="allow-messages"
                  checked={profileData.privacy_settings?.allowDirectMessages || false}
                  onCheckedChange={(checked) => handleToggleChange("privacy_settings", "allowDirectMessages", checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
