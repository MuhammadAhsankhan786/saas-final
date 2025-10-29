const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Generic fetch wrapper
export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token"); // JWT store kar rahe ho localStorage me
  
  // Build headers - don't force Content-Type for GET/HEAD requests or when body is FormData
  const isFormData = options.body instanceof FormData;
  const isGetRequest = !options.method || options.method.toUpperCase() === 'GET';
  const forceContentType = !isFormData && !isGetRequest;
  
  const headers = {
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(forceContentType ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  try {
    console.log(`🔗 Making API call to: ${API_BASE}${url}`);
    console.log(`🔑 Token present: ${!!token}`);
    if (token) {
      console.log(`🔑 Token (first 20 chars): ${token.substring(0, 20)}...`);
    }
    console.log(`👤 User role:`, JSON.parse(localStorage.getItem('user') || '{}').role);
    
    // Client-side guard: prevent admin from performing ANY mutations (READ-ONLY ACCESS)
    try {
      const method = (options.method || 'GET').toUpperCase();
      const isMutation = method !== 'GET' && method !== 'HEAD';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = user && user.role === 'admin';
      
      if (isAdmin && isMutation) {
        throw new Error('Access forbidden. Admin role has read-only access. Cannot modify data.');
      }
    } catch (error) {
      // Re-throw client-side guard errors
      if (error.message.includes('Access forbidden')) {
        throw error;
      }
    }

    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    
    console.log(`📡 Response status: ${res.status} ${res.statusText}`);
    console.log(`📋 Content-Type: ${res.headers.get("content-type")}`);
    
    // Log Authorization header being sent (for debugging)
    if (headers.Authorization) {
      console.log(`🔐 Authorization header sent: Bearer ${headers.Authorization.substring(7, 27)}...`);
    }
    
    // Handle 204 No Content responses (like successful DELETE)
    if (res.status === 204) {
      console.log(`✅ Success - No Content (204) for ${url}`);
      return null; // Success with no body
    }
    
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
      
      // Don't throw error for non-JSON if status is successful
      if (res.ok) {
        return { success: true };
      }
      
      throw new Error(`Server returned HTML instead of JSON. Status: ${res.status}. URL: ${API_BASE}${url}`);
    }
    
    if (!res.ok) {
      const status = res.status;
      const statusText = res.statusText;
      
      console.error(`❌ API call failed: ${status} ${statusText} for ${url}`);
      
      // Handle specific error cases first
      if (status === 401) {
        console.log("🔐 Unauthorized - Token expired or invalid");
        const errorData = await res.json().catch(() => ({}));
        console.log("🔐 Error response data:", errorData);
        console.log("🔐 Response headers:", Object.fromEntries(res.headers.entries()));
        
        // Only auto-logout if we're not already on the login page
        // This prevents redirect loops and allows the user to see the error
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          console.log("🔐 Token cleared, will redirect to login on next navigation");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        
        throw new Error(errorData.message || errorData.error || "Unauthorized. Please check your credentials.");
      }
      
      if (status === 422) {
        // Validation error - parse silently and create user-friendly message
        try {
          const errorData = await res.json();
          
          // Create user-friendly error message without console logs
          if (errorData.errors) {
            const errorMessages = Object.values(errorData.errors).flat().join(', ');
            const error = new Error(errorMessages);
            error.errors = errorData.errors;
            throw error;
          } else if (errorData.message) {
            throw new Error(errorData.message);
          } else {
            throw new Error("Validation failed. Please fill all required fields correctly.");
          }
        } catch (parseError) {
          throw new Error("Validation failed. Please check your input.");
        }
      }
      
      if (status === 404) {
        // Try to get more info about the 404
        const responseText = await res.text().catch(() => 'No response body');
        console.error(`❌ 404 Not Found - URL: ${API_BASE}${url}`);
        console.error(`❌ Response body: ${responseText.substring(0, 200)}`);
        throw new Error(`Endpoint not found: ${url}. Please check if the server is running and the route exists.`);
      }
      
      if (status === 403) {
        throw new Error("Access forbidden. You do not have permission to access this resource.");
      }
      
      if (status >= 500) {
        throw new Error(`Server error: ${statusText}. Please check the backend logs.`);
      }
      
      // Check if the error response is JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          const err = await res.json();
          console.error("❌ API Error JSON:", err);
          throw new Error(err.message || err.error || `API Error: ${status} ${statusText}`);
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError);
          throw new Error(`API Error: ${status} ${statusText}`);
        }
      } else {
        // Non-JSON error response
        const text = await res.text().catch(() => 'Unable to read response');
        console.error(`❌ Non-JSON error response: ${text.substring(0, 500)}`);
        throw new Error(`API Error: ${status} ${statusText}`);
      }
    }
    
    try {
      const data = await res.json();
      console.log(`✅ API call successful for ${url}`);
      return data;
    } catch (jsonError) {
      console.error("❌ JSON parsing error:", jsonError);
      console.error("❌ Response status:", res.status);
      console.error("❌ Content-Type:", res.headers.get("content-type"));
      
      // Try to get the raw response text for debugging
      try {
        const text = await res.text();
        console.error("❌ Raw response text:", text.substring(0, 500));
      } catch (textError) {
        console.error("❌ Could not get response text:", textError);
      }
      
      throw new Error(`Invalid JSON response from server. ${jsonError.message}`);
    }
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const queryParams = new URLSearchParams(filters).toString();
  
  // Clients don't need to access clients list
  // Only staff and admin can view clients
  if (user.role === 'client') {
    console.log('⚠️ Clients cannot access clients list');
    return [];
  }
  
  let url;
  if (user.role === 'admin') {
    url = `/admin/clients${queryParams ? `?${queryParams}` : ''}`;
  } else {
    url = `/staff/clients${queryParams ? `?${queryParams}` : ''}`;
  }
  
  console.log(`👥 Fetching clients as ${user.role} from: ${url}`);
  return fetchWithAuth(url);
}

export async function getClient(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Clients don't need to access individual clients
  if (user.role === 'client') {
    console.log('⚠️ Clients cannot access individual client data');
    return null;
  }
  
  let endpoint;
  if (user.role === 'admin') {
    endpoint = `/admin/clients/${id}`;
  } else {
    endpoint = `/staff/clients/${id}`;
  }
  
  return fetchWithAuth(endpoint);
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

export async function getMyAppointments(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/client/appointments${queryParams ? `?${queryParams}` : ''}`;
  console.log('🔍 Fetching client appointments from:', url);
  const result = await fetchWithAuth(url);
  console.log('📋 Client appointments response:', result);
  return result;
}

export async function getAppointmentFormData() {
  console.log('🔍 Fetching appointment form data from /client/appointments/form-data');
  const result = await fetchWithAuth('/client/appointments/form-data');
  console.log('📋 Form data response:', result);
  return result;
}

export async function getAppointment(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('🔍 Fetching appointment detail:', id);
  
  // Use client endpoint for client role, admin endpoint for others
  const endpoint = user.role === 'client' 
    ? `/client/appointments/${id}`
    : `/admin/appointments/${id}`;
    
  return fetchWithAuth(endpoint);
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Use role-based endpoint
  let endpoint;
  if (user.role === 'client') {
    endpoint = `/client/appointments/${id}`;
  } else {
    // Admin, reception, provider all use staff endpoint (admin routes are read-only)
    endpoint = `/staff/appointments/${id}`;
  }
  
  return fetchWithAuth(endpoint, {
    method: "PUT",
    body: JSON.stringify(appointmentData),
  });
}

export async function updateAppointmentStatus(id, status) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Use client endpoint for client role
  const endpoint = user.role === 'client' 
    ? `/client/appointments/${id}/status` 
    : `/admin/appointments/${id}/status`;
  
  return fetchWithAuth(endpoint, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteAppointment(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Use role-based endpoint
  let endpoint;
  if (user.role === 'client') {
    endpoint = `/client/appointments/${id}`;
  } else {
    // Admin, reception, provider use staff endpoint
    endpoint = `/staff/appointments/${id}`;
  }
  
  console.log(`🗑️ Deleting appointment ${id} as ${user.role} using endpoint: ${endpoint}`);
  console.log(`🔑 Full URL: ${API_BASE}${endpoint}`);
  
  try {
    const result = await fetchWithAuth(endpoint, {
      method: "DELETE",
    });
    console.log(`✅ Delete result:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Delete error:`, error);
    throw error;
  }
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
  const validStatuses = ["booked", "completed", "cancelled"];
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const queryParams = new URLSearchParams(filters).toString();
  
  // Use role-based endpoint
  let url;
  if (user.role === 'client') {
    url = `/client/packages${queryParams ? `?${queryParams}` : ''}`;
  } else if (user.role === 'admin') {
    url = `/admin/packages${queryParams ? `?${queryParams}` : ''}`;
  } else {
    url = `/staff/packages${queryParams ? `?${queryParams}` : ''}`;
  }
  
  console.log(`📦 Fetching packages as ${user.role} from: ${url}`);
  return fetchWithAuth(url);
}

export async function getPackage(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Use role-based endpoint
  let endpoint;
  if (user.role === 'client') {
    endpoint = `/client/packages/${id}`;
  } else if (user.role === 'admin') {
    endpoint = `/admin/packages/${id}`;
  } else {
    endpoint = `/staff/packages/${id}`;
  }
  
  return fetchWithAuth(endpoint);
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const queryParams = new URLSearchParams(filters).toString();
  
  // Use role-based endpoint
  let url;
  if (user.role === 'client') {
    url = `/client/services${queryParams ? `?${queryParams}` : ''}`;
  } else if (user.role === 'admin') {
    url = `/admin/services${queryParams ? `?${queryParams}` : ''}`;
  } else {
    url = `/staff/services${queryParams ? `?${queryParams}` : ''}`;
  }
  
  console.log(`🏥 Fetching services as ${user.role} from: ${url}`);
  return fetchWithAuth(url);
}

export async function getService(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Use role-based endpoint
  let endpoint;
  if (user.role === 'client') {
    endpoint = `/client/services/${id}`;
  } else if (user.role === 'admin') {
    endpoint = `/admin/services/${id}`;
  } else {
    endpoint = `/staff/services/${id}`;
  }
  
  return fetchWithAuth(endpoint);
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const queryParams = new URLSearchParams(filters).toString();
  
  // Use role-based endpoint
  let url;
  if (user.role === 'client') {
    url = `/client/payments${queryParams ? `?${queryParams}` : ''}`;
  } else if (user.role === 'admin') {
    url = `/admin/payments${queryParams ? `?${queryParams}` : ''}`;
  } else {
    url = `/staff/payments${queryParams ? `?${queryParams}` : ''}`;
  }
  
  console.log(`💳 Fetching payments as ${user.role} from: ${url}`);
  return fetchWithAuth(url);
}

export async function getPayment(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Use role-based endpoint
  let endpoint;
  if (user.role === 'client') {
    endpoint = `/client/payments/${id}`;
  } else if (user.role === 'admin') {
    endpoint = `/admin/payments/${id}`;
  } else {
    endpoint = `/staff/payments/${id}`;
  }
  
  return fetchWithAuth(endpoint);
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
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE}/admin/payments/${paymentId}/receipt`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/pdf",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to generate receipt: ${response.status}`);
  }

  // Return the blob for PDF download
  return response.blob();
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

// ✅ Stock Alerts API Functions
export async function getStockAlerts() {
  return fetchWithAuth("/admin/stock-alerts");
}

export async function getStockAlertStatistics() {
  return fetchWithAuth("/admin/stock-alerts/statistics");
}

export async function dismissStockAlert(alertId) {
  return fetchWithAuth(`/admin/stock-alerts/${alertId}/dismiss`, {
    method: "POST",
  });
}

export async function resolveStockAlert(alertId) {
  return fetchWithAuth(`/admin/stock-alerts/${alertId}/resolve`, {
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

// ✅ Business Settings API Functions
export async function getBusinessSettings() {
  return fetchWithAuth("/business-settings");
}

export async function updateBusinessSettings(settingsData) {
  return fetchWithAuth("/business-settings", {
    method: "PUT",
    body: JSON.stringify(settingsData),
  });
}

// ✅ Profile Management API Functions
// Note: All authenticated users can use /profile endpoint
// The backend ProfileController enforces that users can only access their own profile
export async function getUserProfile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // For clients, use the client-specific route to ensure proper authentication
  const endpoint = user.role === 'client' ? '/client/me/profile' : '/profile';
  return fetchWithAuth(endpoint);
}

export async function updateUserProfile(profileData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // For clients, use the client-specific route to ensure proper authentication
  const endpoint = user.role === 'client' ? '/client/me/profile' : '/profile';
  return fetchWithAuth(endpoint, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}

export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append('profile_photo', file);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem("token");
  const headers = {
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // For clients, use the client-specific route to ensure proper authentication
  const endpoint = user.role === 'client' ? '/client/me/profile/photo' : '/profile/photo';

  try {
    console.log(`🔗 Uploading profile photo to: ${API_BASE}${endpoint}`);
    console.log(`🔑 Token present: ${!!token}`);
    if (token) {
      console.log(`🔑 Token (first 20 chars): ${token.substring(0, 20)}...`);
    }
    
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });
    
    console.log(`📡 Photo upload response status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      // Check if the error response is JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          const error = await res.json();
          console.log("🔐 Photo upload error response:", error);
          throw new Error(error.message || error.error || `Upload failed: ${res.status} ${res.statusText}`);
        } catch (parseError) {
          console.error("❌ Failed to parse upload error response:", parseError);
          throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        }
      } else {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }
    }
    
    // Check if the success response is JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const data = await res.json();
        console.log(`✅ Profile photo uploaded successfully`);
        return data;
      } catch (parseError) {
        console.error("❌ Failed to parse upload success response:", parseError);
        throw new Error("Invalid JSON response from server");
      }
    } else {
      throw new Error("Server returned non-JSON response");
    }
  } catch (error) {
    console.error(`❌ Profile photo upload failed:`, error);
    throw error;
  }
}

export async function deleteProfilePhoto() {
  return fetchWithAuth("/profile/photo", {
    method: "DELETE",
  });
}

// ✅ Compliance Alerts API Functions
export async function getComplianceAlerts(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/admin/compliance-alerts${queryParams ? `?${queryParams}` : ''}`;
  return fetchWithAuth(url);
}

export async function getComplianceAlert(id) {
  return fetchWithAuth(`/admin/compliance-alerts/${id}`);
}

export async function getComplianceStatistics() {
  return fetchWithAuth("/admin/compliance-alerts/statistics");
}

export async function resolveComplianceAlert(id) {
  return fetchWithAuth(`/admin/compliance-alerts/${id}/resolve`, {
    method: "POST",
  });
}

export async function dismissComplianceAlert(id) {
  return fetchWithAuth(`/admin/compliance-alerts/${id}/dismiss`, {
    method: "POST",
  });
}

export async function exportComplianceAlertsToPDF(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const endpointUrl = `/admin/compliance-alerts/export/pdf${queryParams ? `?${queryParams}` : ''}`;
  
  const token = localStorage.getItem("token");
  
  try {
    const response = await fetch(`${API_BASE}${endpointUrl}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/pdf",
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export PDF: ${response.status}`);
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `compliance-alerts-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
    
    return { success: true };
  } catch (error) {
    console.error("Error exporting PDF:", error);
    throw error;
  }
}
  