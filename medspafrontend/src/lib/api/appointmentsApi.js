import { fetchWithAuth } from "../api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* -------------------- 🧭 Appointment API Functions -------------------- */

// 🟢 Get All Appointments (Admin Panel)
export const getAppointments = (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/admin/appointments${queryParams ? `?${queryParams}` : ""}`;
  console.log("🔍 Fetching appointments from:", url);
  return fetchWithAuth(url);
};

// 🟢 Get Single Appointment by ID
export const getAppointment = (id) => {
  const url = `/admin/appointments/${id}`;
  console.log("🔍 Fetching appointment:", url);
  return fetchWithAuth(url);
};

// 🟢 Create New Appointment (Client Side)
export const createAppointment = (data) => {
  const url = `/client/appointments`;
  console.log("📝 Creating appointment:", data);
  return fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// 🟢 Update Appointment (Admin Side)
export const updateAppointment = (id, data) => {
  const url = `/admin/appointments/${id}`;
  console.log("✏️ Updating appointment:", id, data);
  return fetchWithAuth(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// 🟢 Update Only Appointment Status
export const updateAppointmentStatus = (id, status) => {
  const url = `/admin/appointments/${id}/status`;
  console.log("🔄 Updating appointment status:", id, status);
  return fetchWithAuth(url, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

// 🟢 Delete Appointment
export const deleteAppointment = (id) => {
  const url = `/client/appointments/${id}`;
  console.log("🗑️ Deleting appointment:", url);
  return fetchWithAuth(url, {
    method: "DELETE",
  });
};

/* -------------------- ⚙️ Helper Functions -------------------- */

// ✅ Format appointment for display (frontend use)
export const formatAppointmentForDisplay = (appointment) => {
  if (!appointment) return {};
  return {
    id: appointment.id,
    client_id: appointment.client_id,
    client: appointment.client?.clientUser || appointment.client,
    provider_id: appointment.provider_id,
    provider: appointment.provider || appointment.staff,
    location_id: appointment.location_id,
    location: appointment.location,
    service_id: appointment.service_id,
    service: appointment.service,
    package_id: appointment.package_id,
    package: appointment.package,
    start_time: appointment.start_time,
    end_time: appointment.end_time,
    status: appointment.status,
    notes: appointment.notes,
    created_at: appointment.created_at,
    updated_at: appointment.updated_at,
  };
};

// ✅ Format appointment before sending to backend
export const formatAppointmentForAPI = (formData) => ({
  client_id: Number(formData.client_id),
  provider_id: formData.provider_id ? Number(formData.provider_id) : null,
  location_id: Number(formData.location_id),
  service_id: formData.service_id ? Number(formData.service_id) : null,
  package_id: formData.package_id ? Number(formData.package_id) : null,
  start_time: formData.start_time,
  end_time: formData.end_time,
  status: formData.status || "booked",
  notes: formData.notes || "",
});

// ✅ Status Validation
export const isValidStatus = (status) => {
  const validStatuses = ["booked", "completed", "canceled"];
  return validStatuses.includes(status);
};

// ✅ Format DateTime (for UI)
export const formatDateTime = (dateTime) => {
  if (!dateTime) return "N/A";
  const date = new Date(dateTime);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    full: date.toLocaleString(),
  };
};

// ✅ Combine Date + Time
export const createDateTimeString = (date, time) => {
  if (!date || !time) return null;
  return `${date}T${time}:00`;
};
