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
  Building,
  MapPin,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Shield,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

export function BusinessSettings({ onPageChange }) {
  const [businessData, setBusinessData] = useState({
    businessName: "MediSpa Wellness Center",
    businessType: "Medical Spa",
    licenseNumber: "MED-2024-001",
    taxId: "12-3456789",
    website: "https://www.medispa-wellness.com",
    description: "Premier medical spa offering advanced aesthetic treatments and wellness services.",
    address: "123 Medical Plaza",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    phone: "(555) 123-4567",
    email: "info@medispa-wellness.com",
    hours: {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "10:00", close: "16:00", closed: false },
      sunday: { open: "10:00", close: "16:00", closed: true },
    },
    currency: "USD",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12",
    features: {
      onlineBooking: true,
      clientPortal: true,
      inventoryTracking: true,
      staffScheduling: true,
      reporting: true,
      complianceTracking: true,
    },
    locations: [
      {
        id: "1",
        name: "Downtown Clinic",
        address: "123 Medical Plaza",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        phone: "(555) 123-4567",
        isActive: true,
      },
      {
        id: "2",
        name: "Westside Location",
        address: "456 Oak Avenue",
        city: "New York",
        state: "NY",
        zipCode: "10002",
        phone: "(555) 234-5678",
        isActive: true,
      },
    ],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  const handleInputChange = (field, value) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (parent, field, value) => {
    setBusinessData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleHoursChange = (day, field, value) => {
    setBusinessData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value
        }
      }
    }));
  };

  const handleLocationInputChange = (field, value) => {
    setNewLocation(prev => ({ ...prev, [field]: value }));
  };

  const handleAddLocation = () => {
    if (newLocation.name && newLocation.address) {
      const location = {
        id: Date.now().toString(),
        ...newLocation,
        isActive: true,
      };
      setBusinessData(prev => ({
        ...prev,
        locations: [...prev.locations, location]
      }));
      setNewLocation({
        name: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        phone: "",
      });
    }
  };

  const handleRemoveLocation = (locationId) => {
    setBusinessData(prev => ({
      ...prev,
      locations: prev.locations.filter(loc => loc.id !== locationId)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log("Saving business settings:", businessData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Business settings updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const businessTypes = [
    "Medical Spa",
    "Dermatology Clinic",
    "Plastic Surgery",
    "Aesthetic Center",
    "Wellness Center",
    "Beauty Clinic",
  ];

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "Pacific/Honolulu",
  ];

  const currencies = ["USD", "CAD", "EUR", "GBP", "AUD"];

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
            <h1 className="text-2xl font-bold text-foreground">Business Settings</h1>
            <p className="text-muted-foreground">Configure your business information and preferences</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
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
              Edit Settings
            </Button>
          )}
        </div>
      </div>

      {/* Business Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessData.businessName}
                onChange={(e) => handleInputChange("businessName", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>
            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Select 
                value={businessData.businessType} 
                onValueChange={(value) => handleInputChange("businessType", value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
                value={businessData.licenseNumber}
                onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>
            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={businessData.taxId}
                onChange={(e) => handleInputChange("taxId", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={businessData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              disabled={!isEditing}
              className="bg-input-background border-border"
            />
          </div>

          <div>
            <Label htmlFor="description">Business Description</Label>
            <Textarea
              id="description"
              value={businessData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
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
              value={businessData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={!isEditing}
              className="bg-input-background border-border"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={businessData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={businessData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={businessData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={businessData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={businessData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing}
                className="bg-input-background border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map((day) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-24">
                <Label className="text-sm font-medium">{dayNames[day]}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={!businessData.hours[day].closed}
                  onCheckedChange={(checked) => handleHoursChange(day, "closed", !checked)}
                  disabled={!isEditing}
                />
                <span className="text-sm text-muted-foreground">
                  {businessData.hours[day].closed ? "Closed" : "Open"}
                </span>
              </div>
              {!businessData.hours[day].closed && (
                <div className="flex items-center space-x-2">
                  <Input
                    type="time"
                    value={businessData.hours[day].open}
                    onChange={(e) => handleHoursChange(day, "open", e.target.value)}
                    disabled={!isEditing}
                    className="w-32 bg-input-background border-border"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={businessData.hours[day].close}
                    onChange={(e) => handleHoursChange(day, "close", e.target.value)}
                    disabled={!isEditing}
                    className="w-32 bg-input-background border-border"
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={businessData.currency} 
                onValueChange={(value) => handleInputChange("currency", value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={businessData.timezone} 
                onValueChange={(value) => handleInputChange("timezone", value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select 
                value={businessData.timeFormat} 
                onValueChange={(value) => handleInputChange("timeFormat", value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 Hour (AM/PM)</SelectItem>
                  <SelectItem value="24">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Enabled Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(businessData.features).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center justify-between">
                <Label htmlFor={feature} className="capitalize">
                  {feature.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Switch
                  id={feature}
                  checked={enabled}
                  onCheckedChange={(checked) => handleNestedInputChange("features", feature, checked)}
                  disabled={!isEditing}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Locations */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Business Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {businessData.locations.map((location) => (
            <div key={location.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground">{location.name}</h4>
                <div className="flex items-center space-x-2">
                  <Badge variant={location.isActive ? "outline" : "secondary"}>
                    {location.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveLocation(location.id)}
                      className="border-border hover:bg-destructive/5 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{location.address}</p>
                <p>{location.city}, {location.state} {location.zipCode}</p>
                <p>{location.phone}</p>
              </div>
            </div>
          ))}

          {isEditing && (
            <div className="p-4 border-2 border-dashed border-border rounded-lg">
              <h4 className="font-medium text-foreground mb-4">Add New Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="locationName">Location Name</Label>
                  <Input
                    id="locationName"
                    value={newLocation.name}
                    onChange={(e) => handleLocationInputChange("name", e.target.value)}
                    placeholder="Enter location name"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="locationPhone">Phone</Label>
                  <Input
                    id="locationPhone"
                    value={newLocation.phone}
                    onChange={(e) => handleLocationInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="locationAddress">Address</Label>
                  <Input
                    id="locationAddress"
                    value={newLocation.address}
                    onChange={(e) => handleLocationInputChange("address", e.target.value)}
                    placeholder="Enter address"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="locationCity">City</Label>
                  <Input
                    id="locationCity"
                    value={newLocation.city}
                    onChange={(e) => handleLocationInputChange("city", e.target.value)}
                    placeholder="Enter city"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="locationState">State</Label>
                  <Input
                    id="locationState"
                    value={newLocation.state}
                    onChange={(e) => handleLocationInputChange("state", e.target.value)}
                    placeholder="Enter state"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="locationZip">ZIP Code</Label>
                  <Input
                    id="locationZip"
                    value={newLocation.zipCode}
                    onChange={(e) => handleLocationInputChange("zipCode", e.target.value)}
                    placeholder="Enter ZIP code"
                    className="bg-input-background border-border"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddLocation}
                className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
