const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Generic fetch wrapper
export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token"); // JWT store kar rahe ho localStorage me
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    console.log(`🔗 Making API call to: ${API_BASE}${url}`);
    console.log(`🔑 Token present: ${!!token}`);
    
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    
    console.log(`📡 Response status: ${res.status} ${res.statusText}`);
    console.log(`📋 Content-Type: ${res.headers.get("content-type")}`);
    
    // Check if response is HTML (error page) instead of JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("❌ Non-JSON response received:", text.substring(0, 500) + "...");
      
      // If it's a 401 error, redirect to login
      if (res.status === 401) {
        console.log("🔐 Unauthorized - redirecting to login");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      
      throw new Error(`Server returned HTML instead of JSON. Status: ${res.status}. URL: ${API_BASE}${url}`);
    }
    
    if (!res.ok) {
      try {
        const err = await res.json();
        console.error("❌ API Error:", err);
        
        // Handle specific error cases
        if (res.status === 401) {
          console.log("🔐 Unauthorized - clearing token and redirecting");
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        
        throw new Error(err.message || `API Error: ${res.status} ${res.statusText}`);
      } catch (parseError) {
        console.error("❌ Failed to parse error response:", parseError);
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
    }
    
    const data = await res.json();
    console.log(`✅ API call successful for ${url}`);
    return data;
  } catch (error) {
    console.error(`❌ API call failed for ${url}:`, error);
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to ${API_BASE}. Please check if the server is running.`);
    }
    
    throw error;
  }
}

// ✅ Users API Functions
export async function getUsers() {
  return fetchWithAuth("/admin/users");
}

export async function createUser(userData) {
  return fetchWithAuth("/admin/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateUser(id, userData) {
  return fetchWithAuth(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

export async function deleteUser(id) {
  return fetchWithAuth(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

// ✅ Clients API Functions
export async function getClients(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/admin/clients${queryParams ? `?${queryParams}` : ''}`;
  return fetchWithAuth(url);
}

export async function getClient(id) {
  return fetchWithAuth(`/admin/clients/${id}`);
}

export async function createClient(clientData) {
  return fetchWithAuth("/admin/clients", {
    method: "POST",
    body: JSON.stringify(clientData),
  });
}

export async function updateClient(id, clientData) {
  return fetchWithAuth(`/admin/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(clientData),
  });
}

export async function deleteClient(id) {
  return fetchWithAuth(`/admin/clients/${id}`, {
    method: "DELETE",
  });
}

// ✅ Appointments API Functions
export async function getAppointments(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/admin/appointments${queryParams ? `?${queryParams}` : ''}`;
  console.log('🔍 Fetching appointments from:', url);
  const result = await fetchWithAuth(url);
  console.log('📋 Appointments response:', result);
  return result;
}

export async function getAppointment(id) {
  console.log('🔍 Fetching appointment detail:', id);
  return fetchWithAuth(`/admin/appointments/${id}`);
}

export async function createAppointment(appointmentData) {
  console.log('📝 Creating appointment:', appointmentData);
  const result = await fetchWithAuth("/client/appointments", {
    method: "POST",
    body: JSON.stringify(appointmentData),
  });
  console.log('✅ Appointment created:', result);
  return result;
}

export async function updateAppointment(id, appointmentData) {
  return fetchWithAuth(`/admin/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(appointmentData),
  });
}

export async function updateAppointmentStatus(id, status) {
  return fetchWithAuth(`/admin/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteAppointment(id) {
  return fetchWithAuth(`/client/appointments/${id}`, {
    method: "DELETE",
  });
}

// ✅ Helper Functions for Appointments
export function formatAppointmentForDisplay(appointment) {
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
}

export function formatAppointmentForAPI(formData) {
  return {
    client_id: Number(formData.client_id),
    provider_id: formData.provider_id ? Number(formData.provider_id) : null,
    location_id: Number(formData.location_id),
    service_id: formData.service_id ? Number(formData.service_id) : null,
    package_id: formData.package_id ? Number(formData.package_id) : null,
    start_time: formData.start_time,
    end_time: formData.end_time,
    status: formData.status || "booked",
    notes: formData.notes || "",
  };
}

export function isValidStatus(status) {
  const validStatuses = ["booked", "completed", "canceled"];
  return validStatuses.includes(status);
}

export function formatDateTime(dateTime) {
  if (!dateTime) return "N/A";
  const date = new Date(dateTime);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    full: date.toLocaleString(),
  };
}

export function createDateTimeString(date, time) {
  if (!date || !time) return null;
  return `${date}T${time}:00`;
}

// ✅ Packages API Functions
export async function getPackages(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/admin/packages${queryParams ? `?${queryParams}` : ''}`;
  return fetchWithAuth(url);
}

export async function getPackage(id) {
  return fetchWithAuth(`/admin/packages/${id}`);
}

export async function createPackage(packageData) {
  return fetchWithAuth("/admin/packages", {
    method: "POST",
    body: JSON.stringify(packageData),
  });
}

export async function updatePackage(id, packageData) {
  return fetchWithAuth(`/admin/packages/${id}`, {
    method: "PUT",
    body: JSON.stringify(packageData),
  });
}

export async function deletePackage(id) {
  return fetchWithAuth(`/admin/packages/${id}`, {
    method: "DELETE",
  });
}

export async function assignPackageToClient(clientId, packageId) {
  return fetchWithAuth("/admin/packages/assign", {
    method: "POST",
    body: JSON.stringify({ client_id: clientId, package_id: packageId }),
  });
}

export async function getMyPackages() {
  return fetchWithAuth("/client/packages");
}

// ✅ Services API Functions
export async function getServices(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/admin/services${queryParams ? `?${queryParams}` : ''}`;
  return fetchWithAuth(url);
}

export async function getService(id) {
  return fetchWithAuth(`/admin/services/${id}`);
}

export async function createService(serviceData) {
  return fetchWithAuth("/admin/services", {
    method: "POST",
    body: JSON.stringify(serviceData),
  });
}

export async function updateService(id, serviceData) {
  return fetchWithAuth(`/admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(serviceData),
  });
}

export async function deleteService(id) {
  return fetchWithAuth(`/admin/services/${id}`, {
    method: "DELETE",
  });
}

// ✅ Payments API Functions
export async function getPayments(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/admin/payments${queryParams ? `?${queryParams}` : ''}`;
  return fetchWithAuth(url);
}

export async function getPayment(id) {
  return fetchWithAuth(`/admin/payments/${id}`);
}

export async function createPayment(paymentData) {
  return fetchWithAuth("/client/payments", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
}

export async function updatePayment(id, paymentData) {
  return fetchWithAuth(`/admin/payments/${id}`, {
    method: "PUT",
    body: JSON.stringify(paymentData),
  });
}

export async function deletePayment(id) {
  return fetchWithAuth(`/admin/payments/${id}`, {
    method: "DELETE",
  });
}

export async function confirmStripePayment(paymentId, paymentIntentId) {
  return fetchWithAuth(`/admin/payments/${paymentId}/confirm-stripe`, {
    method: "POST",
    body: JSON.stringify({ payment_intent_id: paymentIntentId }),
  });
}

export async function generateReceipt(paymentId) {
  return fetchWithAuth(`/admin/payments/${paymentId}/receipt`);
}

export async function getMyPayments() {
  return fetchWithAuth("/client/payments");
}

// ✅ Products/Inventory API Functions
export async function getProducts(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/admin/products${queryParams ? `?${queryParams}` : ''}`;
  return fetchWithAuth(url);
}

export async function getProduct(id) {
  return fetchWithAuth(`/admin/products/${id}`);
}

export async function createProduct(productData) {
  return fetchWithAuth("/admin/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
}

export async function updateProduct(id, productData) {
  return fetchWithAuth(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(productData),
  });
}

export async function deleteProduct(id) {
  return fetchWithAuth(`/admin/products/${id}`, {
    method: "DELETE",
  });
}

export async function adjustStock(productId, adjustmentData) {
  return fetchWithAuth(`/admin/products/${productId}/adjust`, {
    method: "POST",
    body: JSON.stringify(adjustmentData),
  });
}

export async function getStockNotifications() {
  return fetchWithAuth("/admin/stock-notifications");
}

export async function markStockNotificationAsRead(notificationId) {
  return fetchWithAuth(`/admin/stock-notifications/${notificationId}/read`, {
    method: "POST",
  });
}

// ✅ Notifications API Functions
export async function getNotifications() {
  return fetchWithAuth("/notifications");
}

export async function getUnreadNotifications() {
  return fetchWithAuth("/notifications/unread");
}

export async function markNotificationAsRead(notificationId) {
  return fetchWithAuth(`/notifications/${notificationId}/read`, {
    method: "POST",
  });
}

// ✅ Reports API Functions
export async function getRevenueReport(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const url = `/admin/reports/revenue${queryParams ? `?${queryParams}` : ''}`;
  return fetchWithAuth(url);
}

export async function getClientRetentionReport(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const url = `/admin/reports/client-retention${queryParams ? `?${queryParams}` : ''}`;
  return fetchWithAuth(url);
}

export async function getStaffPerformanceReport(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const url = `/admin/reports/staff-performance${queryParams ? `?${queryParams}` : ''}`;
  return fetchWithAuth(url);
}

// ✅ File Upload API Functions
export async function getSignedUrl(fileData) {
  return fetchWithAuth("/files/signed-url", {
    method: "POST",
    body: JSON.stringify(fileData),
  });
}

export async function getConsentFormFile(id, filename) {
  return fetchWithAuth(`/files/consent-forms/${id}/${filename}`);
}

export async function getTreatmentPhoto(id, type) {
  return fetchWithAuth(`/files/treatments/${id}/${type}`);
}

// ✅ Locations API Functions
export async function getLocations(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/admin/locations${queryParams ? `?${queryParams}` : ''}`;
  return fetchWithAuth(url);
}

export async function getLocation(id) {
  return fetchWithAuth(`/admin/locations/${id}`);
}

export async function createLocation(locationData) {
  return fetchWithAuth("/admin/locations", {
    method: "POST",
    body: JSON.stringify(locationData),
  });
}

export async function updateLocation(id, locationData) {
  return fetchWithAuth(`/admin/locations/${id}`, {
    method: "PUT",
    body: JSON.stringify(locationData),
  });
}

export async function deleteLocation(id) {
  return fetchWithAuth(`/admin/locations/${id}`, {
    method: "DELETE",
  });
}
  