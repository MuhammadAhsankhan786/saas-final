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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import {
  createClient,
  getLocations,
} from "@/lib/api";

export function AddClient({ onPageChange }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location_id: "",
  });
  const [locations, setLocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load locations from API
  useEffect(() => {
    async function loadLocations() {
      try {
        const locationsData = await getLocations();
        setLocations(locationsData || []);
      } catch (error) {
        console.error("Error loading locations:", error);
        setError("Failed to load locations");
      }
    }
    loadLocations();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    try {
      if (!formData.name || !formData.email || !formData.location_id) {
        setError("Please fill in all required fields");
        return;
      }

      const newClient = await createClient(formData);
      console.log("Client created successfully:", newClient);
      
      alert("Client added successfully!");
      onPageChange("clients/list");
    } catch (error) {
      console.error("Error adding client:", error);
      setError("Error adding client: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => onPageChange("clients/list")}
            className="border-border hover:bg-primary/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Client List
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Client</h1>
            <p className="text-muted-foreground">Register a new client in the system</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <User className="mr-2 h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
                className="bg-input-background border-border"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="client@example.com"
                  className="bg-input-background border-border"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  className="bg-input-background border-border"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location_id">Location *</Label>
              <Select 
                value={formData.location_id} 
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
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onPageChange("clients/list")}
            className="border-border hover:bg-primary/5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Adding Client..." : "Add Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}