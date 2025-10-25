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

export function ProfileSettings({ onPageChange }) {
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
        const profile = await getUserProfile();
        setProfileData(profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

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
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Error saving profile: " + error.message);
      alert("Error saving profile. Please try again.");
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
    try {
      const result = await uploadProfilePhoto(file);
      setProfileData(prev => ({ 
        ...prev, 
        profile_image: result.profile_image_url 
      }));
      alert("Profile photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      setError("Error uploading photo: " + error.message);
      alert("Error uploading photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
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
            <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your personal information and preferences</p>
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
                className="w-24 h-24 bg-muted rounded-full flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={handlePhotoClick}
              >
                {profileData.profile_image ? (
                  <img 
                    src={profileData.profile_image} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover"
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
                    onCheckedChange={(checked) => handleNestedInputChange("notification_preferences", "email", checked)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <Switch
                    id="sms-notifications"
                    checked={profileData.notification_preferences?.sms || false}
                    onCheckedChange={(checked) => handleNestedInputChange("notification_preferences", "sms", checked)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <Switch
                    id="push-notifications"
                    checked={profileData.notification_preferences?.push || false}
                    onCheckedChange={(checked) => handleNestedInputChange("notification_preferences", "push", checked)}
                    disabled={!isEditing}
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
                    onCheckedChange={(checked) => handleNestedInputChange("notification_preferences", "appointmentReminders", checked)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="system-updates">System Updates</Label>
                  <Switch
                    id="system-updates"
                    checked={profileData.notification_preferences?.systemUpdates || false}
                    onCheckedChange={(checked) => handleNestedInputChange("notification_preferences", "systemUpdates", checked)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketing">Marketing Communications</Label>
                  <Switch
                    id="marketing"
                    checked={profileData.notification_preferences?.marketing || false}
                    onCheckedChange={(checked) => handleNestedInputChange("notification_preferences", "marketing", checked)}
                    disabled={!isEditing}
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
                  onCheckedChange={(checked) => handleNestedInputChange("privacy_settings", "showEmail", checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-phone">Show Phone Number</Label>
                <Switch
                  id="show-phone"
                  checked={profileData.privacy_settings?.showPhone || false}
                  onCheckedChange={(checked) => handleNestedInputChange("privacy_settings", "showPhone", checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-messages">Allow Direct Messages</Label>
                <Switch
                  id="allow-messages"
                  checked={profileData.privacy_settings?.allowDirectMessages || false}
                  onCheckedChange={(checked) => handleNestedInputChange("privacy_settings", "allowDirectMessages", checked)}
                  disabled={!isEditing}
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
