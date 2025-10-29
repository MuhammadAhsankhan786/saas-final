"use client";

import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import {
  Button
} from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import {
  createAppointment,
  updateAppointment,
  formatAppointmentForAPI,
  createDateTimeString,
  isValidStatus,
  getLocations,
  getUsers,
  getServices,
  getPackages,
  getClients,
  fetchWithAuth,
  getAppointmentFormData,
} from "@/lib/api";
import { notify } from "@/lib/toast";

export default function AppointmentForm({ appointment = null, editingAppointment = null, onSuccess, onPageChange, onClose }) {
  // Get user role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isClient = user.role === "client";
  
  // Use editingAppointment if provided, otherwise use appointment
  const appointmentToEdit = editingAppointment || appointment;
  
  const [formData, setFormData] = useState({
    client_id: appointmentToEdit?.client_id || "",
    provider_id: appointmentToEdit?.provider_id || "none",
    location_id: appointmentToEdit?.location_id || "",
    service_id: appointmentToEdit?.service_id || "none",
    package_id: appointmentToEdit?.package_id || "none",
    date: appointmentToEdit ? appointmentToEdit.start_time.split("T")[0] : "",
    start_time: appointmentToEdit
      ? new Date(appointmentToEdit.start_time).toISOString().slice(11, 16)
      : "",
    end_time: appointmentToEdit
      ? new Date(appointmentToEdit.end_time).toISOString().slice(11, 16)
      : "",
    status: appointmentToEdit?.status || "booked",
    notes: appointmentToEdit?.notes || "",
  });

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [error, setError] = useState("");

  // Load data from API
  useEffect(() => {
    async function loadData() {
      try {
        setError("");
        // Load data based on user role
        if (isClient) {
          // For clients, use the new form-data endpoint
          const formDataResponse = await getAppointmentFormData();
          
          if (formDataResponse) {
            setLocations(formDataResponse.locations || []);
            setUsers(formDataResponse.providers || []);
            setServices(formDataResponse.services || []);
            setPackages(formDataResponse.packages || []);
            
            // Set client's own info if available from formData
            if (formDataResponse.client) {
              setClients([formDataResponse.client]);
              setFormData(prev => ({ 
                ...prev, 
                client_id: formDataResponse.client.id,
                location_id: formDataResponse.client.location_id 
              }));
            }
          }
          
          // Get location_id from user profile if not set
          const clientData = await fetchWithAuth("/me");
          if (clientData && !formDataResponse?.client) {
            setFormData(prev => ({ 
              ...prev, 
              location_id: clientData.location_id 
            }));
          }
        } else {
          // For admin/reception/staff - use standard admin endpoints
          const [locationsData, usersData, servicesData, packagesData, clientsData] = await Promise.all([
            getLocations(),
            getUsers(),
            getServices(),
            getPackages(),
            getClients(),
          ]);
          
          setLocations(locationsData || []);
          setUsers(usersData || []);
          setServices(servicesData || []);
          setPackages(packagesData || []);
          setClients(clientsData || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load form data. Please refresh the page.");
      }
    }
    loadData();
  }, [isClient, appointmentToEdit]);
  
  // Update form data when appointmentToEdit changes
  useEffect(() => {
    if (appointmentToEdit) {
      console.log("📝 Updating form with appointment data:", appointmentToEdit);
      const newFormData = {
        client_id: appointmentToEdit?.client_id || "",
        provider_id: appointmentToEdit?.provider_id ? String(appointmentToEdit.provider_id) : "none",
        location_id: appointmentToEdit?.location_id ? String(appointmentToEdit.location_id) : "",
        service_id: appointmentToEdit?.service_id ? String(appointmentToEdit.service_id) : "none",
        package_id: appointmentToEdit?.package_id ? String(appointmentToEdit.package_id) : "none",
        date: appointmentToEdit.start_time?.split("T")[0] || "",
        start_time: appointmentToEdit.start_time
          ? new Date(appointmentToEdit.start_time).toISOString().slice(11, 16)
          : "",
        end_time: appointmentToEdit.end_time
          ? new Date(appointmentToEdit.end_time).toISOString().slice(11, 16)
          : "",
        status: appointmentToEdit?.status || "booked",
        notes: appointmentToEdit?.notes || "",
      };
      console.log("📝 New form data:", newFormData);
      setFormData(newFormData);
    }
  }, [appointmentToEdit]);

  // handle input change
  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // validation
    if (!formData.client_id) return setError("Please select a client.");
    if (!formData.location_id) return setError("Please select a location.");
    if (!formData.date || !formData.start_time || !formData.end_time)
      return setError("Please select date and time.");

    const startTime = createDateTimeString(formData.date, formData.start_time);
    const endTime = createDateTimeString(formData.date, formData.end_time);
    if (new Date(endTime) <= new Date(startTime))
      return setError("End time must be after start time.");

    if (!isValidStatus(formData.status))
      return setError("Invalid appointment status.");

    const payload = formatAppointmentForAPI({
      ...formData,
      start_time: startTime,
      end_time: endTime,
      provider_id: formData.provider_id === "none" ? null : formData.provider_id,
      service_id: formData.service_id === "none" ? null : formData.service_id,
      package_id: formData.package_id === "none" ? null : formData.package_id,
    });

    try {
      setLoading(true);
      if (appointmentToEdit) {
        await updateAppointment(appointmentToEdit.id, payload);
        notify.success("Appointment updated successfully");
      } else {
        await createAppointment(payload);
        notify.success("Appointment created successfully");
      }
      if (onSuccess) onSuccess();
      if (onClose) onClose(); // Close modal if editing in modal
    } catch (err) {
      console.error(err);
      const errorMessage = err.message || "Something went wrong while saving appointment.";
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => {
            console.log("🔙 Back to Dashboard clicked, changing page to 'dashboard'");
            onPageChange("dashboard");
          }}
          className="border-border hover:bg-primary/5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {appointmentToEdit ? "Edit Appointment" : "Create Appointment"}
          </h1>
          <p className="text-muted-foreground">
            {appointmentToEdit ? "Update appointment details" : "Schedule a new appointment"}
          </p>
        </div>
      </div>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>
            {appointmentToEdit ? "Edit Appointment" : "Create Appointment"}
          </CardTitle>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client */}
          <div>
            <label className="block mb-1 font-medium">Client</label>
            <Select
              value={formData.client_id ? String(formData.client_id) : ""}
              onValueChange={(value) => handleChange("client_id", value)}
              disabled={isClient}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name} ({client.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <label className="block mb-1 font-medium">Location</label>
            <Select
              value={formData.location_id ? String(formData.location_id) : ""}
              onValueChange={(value) => handleChange("location_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Provider */}
          <div>
            <label className="block mb-1 font-medium">Provider</label>
            <Select
              value={formData.provider_id || "none"}
              onValueChange={(value) =>
                handleChange(
                  "provider_id",
                  value === "none" ? null : value
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Provider</SelectItem>
                {users.filter(user => user.role === "provider").map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service */}
          <div>
            <label className="block mb-1 font-medium">Service</label>
            <Select
              value={formData.service_id || "none"}
              onValueChange={(value) =>
                handleChange(
                  "service_id",
                  value === "none" ? null : value
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Service</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={String(service.id)}>
                    {service.name} - ${service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Package */}
          <div>
            <label className="block mb-1 font-medium">Package</label>
            <Select
              value={formData.package_id || "none"}
              onValueChange={(value) =>
                handleChange(
                  "package_id",
                  value === "none" ? null : value
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Package</SelectItem>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={String(pkg.id)}>
                    {pkg.name} - ${pkg.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-medium">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Start Time</label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange("start_time", e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">End Time</label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => handleChange("end_time", e.target.value)}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block mb-1 font-medium">Status</label>
            <Select
              value={formData.status || "booked"}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-1 font-medium">Notes</label>
            <Textarea
              placeholder="Add any notes..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? "Saving..."
              : appointmentToEdit
              ? "Update Appointment"
              : "Create Appointment"}
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}