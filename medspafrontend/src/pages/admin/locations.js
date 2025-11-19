"use client";

import { useEffect, useState } from "react";
import { getLocations, createLocation, updateLocation, deleteLocation } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, Plus, Trash2, MapPin, Phone, Loader2 } from "lucide-react";
import { notify } from "../../lib/toast";
import { useConfirm } from "../../components/ui/confirm-dialog";

export default function LocationsPage({ onPageChange }) {
  const { user } = useAuth();
  const { confirm, dialog } = useConfirm();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    timezone: "America/New_York",
  });

  useEffect(() => {
    if (!user) return;
    fetchLocations();
  }, [user]);

  // Add refresh on window focus to catch any updates
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchLocations();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching locations from API: GET /admin/locations");
      
      const response = await getLocations();
      console.log("📥 Raw API response:", response);
      console.log("📥 Response type:", typeof response);
      console.log("📥 Is array?", Array.isArray(response));
      
      // Handle different response formats
      let locationsArray = [];
      if (Array.isArray(response)) {
        locationsArray = response;
      } else if (response && Array.isArray(response.data)) {
        locationsArray = response.data;
      } else if (response && response.locations && Array.isArray(response.locations)) {
        locationsArray = response.locations;
      } else if (response && typeof response === 'object' && response.id) {
        // If it's a single object, wrap it in an array
        locationsArray = [response];
      } else {
        console.warn("⚠️ Unexpected response format:", response);
        locationsArray = [];
      }
      
      console.log("✅ Processed locations array:", locationsArray);
      console.log("✅ Total locations to display:", locationsArray.length);
      
      // Verify each location has required fields
      locationsArray.forEach((loc, index) => {
        if (!loc.id) {
          console.warn(`⚠️ Location at index ${index} missing ID:`, loc);
        }
      });
      
      setLocations(locationsArray);
      
      if (locationsArray.length === 0) {
        console.log("ℹ️ No locations found in database");
      }
    } catch (err) {
      console.error("❌ Failed to fetch locations:", err);
      console.error("❌ Error details:", {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      setError("Unable to load locations. Check console for details.");
      notify.error("Failed to load locations: " + (err.message || "Unknown error"));
      setLocations([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name) {
      setError("Location name is required");
      notify.error("Please enter a location name");
      return;
    }

    try {
      setIsAdding(true);
      console.log("➕ Creating location with data:", JSON.stringify(formData, null, 2));
      
      const response = await createLocation(formData);
      console.log("✅ Location created - Full response:", JSON.stringify(response, null, 2));
      
      // Handle response format: { location: {...} } or direct object
      const locationData = response.location || response;
      
      if (!locationData) {
        console.error("❌ No location data in response:", response);
        throw new Error("Invalid response from server. Location data not found.");
      }
      
      if (!locationData.id) {
        console.error("❌ Location data missing ID:", locationData);
        throw new Error("Invalid response from server. Location ID not found.");
      }
      
      console.log("✅ Location created successfully!");
      console.log("   - ID:", locationData.id);
      console.log("   - Name:", locationData.name);
      notify.success("Location added successfully!");
      
      // Reset form immediately
      setFormData({
        name: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        phone: "",
        timezone: "America/New_York",
      });
      
      // CRITICAL: Immediately refetch ALL locations from database
      // This ensures we get the complete list including the newly created location
      console.log("🔄 Refetching all locations from database...");
      await fetchLocations();
      console.log("✅ Locations list refreshed - should now include new location");
    } catch (err) {
      console.error("❌ Error creating location:", err);
      const errorMessage = err.message || "Failed to add location";
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    const confirmed = await confirm({
      title: "Delete Location",
      description: "Are you sure you want to delete this location? This action cannot be undone.",
    });

    if (!confirmed) return;

    try {
      await deleteLocation(locationId);
      notify.success("Location deleted successfully!");
      await fetchLocations();
    } catch (err) {
      console.error("Error deleting location:", err);
      notify.error("Failed to delete location: " + (err.message || "Unknown error"));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading locations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Responsive & Professional */}
      <div className="space-y-3 sm:space-y-0">
        {/* Mobile: Heading on top, Back button small icon */}
        <div className="flex items-start justify-between gap-3 sm:hidden">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">Locations</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your business locations</p>
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Locations</h1>
              <p className="text-sm text-muted-foreground">Manage your business locations</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={fetchLocations}
            disabled={loading}
            className="border-border hover:bg-primary/5"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
        
        {/* Mobile: Refresh button below heading */}
        <div className="sm:hidden">
          <Button
            variant="outline"
            onClick={fetchLocations}
            disabled={loading}
            className="border-border hover:bg-primary/5 w-full"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Existing Locations */}
      {locations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((location) => (
            <Card key={location.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{location.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={
                        location.status === 'active' 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {location.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLocation(location.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {location.address && (
                    <div className="flex items-start space-x-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-foreground">{location.address}</p>
                        <p className="text-muted-foreground">
                          {location.city}, {location.state} {location.zip}
                        </p>
                      </div>
                    </div>
                  )}
                  {location.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{location.phone}</span>
                    </div>
                  )}
                  {location.timezone && (
                    <div className="text-xs text-muted-foreground">
                      Timezone: {location.timezone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Location Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Location</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddLocation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter location name"
                  required
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                  className="bg-input-background border-border"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter address"
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Enter city"
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="Enter state"
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => handleInputChange("zip", e.target.value)}
                  placeholder="Enter ZIP code"
                  className="bg-input-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange("timezone", e.target.value)}
                  placeholder="America/New_York"
                  className="bg-input-background border-border"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isAdding}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Location
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {dialog}
    </div>
  );
}
