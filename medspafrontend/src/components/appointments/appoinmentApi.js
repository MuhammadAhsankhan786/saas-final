import { fetchWithAuth } from "../api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// 🧩 Appointment List (Admin)
export const getAppointments = (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/admin/appointments${queryParams ? `?${queryParams}` : ""}`;
  console.log("🔍 Fetching admin appointments:", url);
  return fetchWithAuth(url);
};

// 🧩 Appointment Details (Admin)
export const getAppointment = (id) => {
  console.log("🔍 Fetching appointment detail:", id);
  return fetchWithAuth(`/admin/appointments/${id}`);
};

// 🧩 Appointment Create (Admin)
export const createAppointment = (data) => {
  console.log("📝 Creating appointment (admin):", data);
  return fetchWithAuth("/admin/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// 🧩 Appointment Update (Admin) — Full Update (PUT)
export const updateAppointment = (id, data) => {
  console.log("✏️ Updating appointment (admin):", id, data);
  return fetchWithAuth(`/admin/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// 🧩 Appointment Status Update (Admin)
export const updateAppointmentStatus = (id, status) => {
  console.log("🔄 Updating appointment status (admin):", id, status);
  return fetchWithAuth(`/admin/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

// 🧩 Appointment Delete (Admin)
export const deleteAppointment = (id) => {
  console.log("🗑️ Deleting appointment (admin):", id);
  return fetchWithAuth(`/admin/appointments/${id}`, {
    method: "DELETE",
  });
};

// 🧩 Helper: Format appointment before API send
export const formatAppointmentForAPI = (formData) => {
  return {
    client_id: formData.client_id,
    provider_id: formData.provider_id || null,
    location_id: formData.location_id,
    service_id: formData.service_id || null,
    package_id: formData.package_id || null,
    start_time: formData.start_time,
    end_time: formData.end_time,
    status: formData.status || "booked",
    notes: formData.notes || "",
  };
};
