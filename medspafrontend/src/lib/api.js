const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// RBAC Watchdog - Inline implementation to avoid module issues
const getStaffEquivalentEndpoint = (url) => {
  const mappings = {
    '/admin/appointments': '/staff/appointments',
    '/admin/clients': '/staff/clients',
    '/admin/payments': '/staff/payments',
    '/admin/packages': '/staff/packages',
    '/admin/services': '/staff/services',
    '/admin/products': '/staff/products',
  };
  
  for (const [adminPath, staffPath] of Object.entries(mappings)) {
    if (url.startsWith(adminPath)) {
      return url.replace(adminPath, staffPath);
    }
  }
  
  return null;
};

const isAllowedEndpoint = (url) => {
  const allowed = [
    "/staff/appointments",
    "/staff/clients",
    "/staff/payments",
    "/staff/packages",
    "/staff/packages/assign",
    "/staff/products",
    "/staff/services",
    "/reception/appointments",
    "/reception/clients",
    "/reception/payments",
    "/reception/packages",
    "/reception/packages/assign",
    "/reception/products",
    "/reception/services",
    "/client/appointments/form-data",
    "/profile"  // Profile management is available to all authenticated users
  ];
  
  const blocked = ["/admin/*", "/provider/*"];
  
  // Check blocked patterns first
  for (const pattern of blocked) {
    if (pattern.includes('*')) {
      const prefix = pattern.replace('/*', '');
      if (url.startsWith(prefix)) {
        return false;
      }
    } else if (url === pattern) {
      return false;
    }
  }
  
  // Check allowed patterns
  for (const allowedPath of allowed) {
    if (url.startsWith(allowedPath) || url.includes(allowedPath)) {
      return true;
    }
  }
  
  // Special case: /client/appointments/form-data is allowed
  if (url.includes('/client/appointments/form-data')) {
    return true;
  }
  
  // Allow /reception/* endpoints for reception role
  if (url.startsWith('/reception/')) {
    return true;
  }
  
  // Allow /profile and /profile/* endpoints for all authenticated users
  if (url.startsWith('/profile')) {
    return true;
  }
  
  return false;
};

// Generic fetch wrapper
export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token"); // JWT store kar rahe ho localStorage me
  
  // 🛡️ RBAC Watchdog: Check for Reception role violations
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (currentUser?.role === 'reception') {
      // Check if URL contains /admin/ or /staff/ - Reception should use /reception/* only
      if (url.includes('/admin/')) {
        console.warn(`🚨 RBAC warning: role=reception attempted admin endpoint: ${url}`);
        
        // Try to get reception-equivalent endpoint
        const receptionEquivalent = url.replace('/admin/', '/reception/');
        console.log(`✅ RBAC fix applied: ${url} → ${receptionEquivalent}`);
        url = receptionEquivalent;
      } else if (url.includes('/staff/') && !url.includes('/staff/clients') && !url.includes('/staff/payments')) {
        // Only allow certain staff endpoints for backward compatibility, otherwise redirect to reception
        console.warn(`🚨 RBAC warning: role=reception attempted staff endpoint: ${url}`);
        const receptionEquivalent = url.replace('/staff/', '/reception/');
        console.log(`✅ RBAC fix applied: ${url} → ${receptionEquivalent}`);
        url = receptionEquivalent;
      }
      
      // Validate endpoint is allowed
      if (!isAllowedEndpoint(url)) {
        // For unknown endpoints that don't start with /reception/ or /profile, block them
        if (!url.startsWith('/reception/') && !url.startsWith('/profile') && !url.includes('/client/appointments/form-data')) {
          console.warn(`🚨 RBAC warning: role=reception attempted unauthorized endpoint: ${url}`);
          if (typeof window !== 'undefined') {
            try {
              // Dynamic import for toast notification
              import('./toast').then(({ notify }) => {
                notify.error('Access restricted for Reception role');
              }).catch(() => {
                // Toast not available, continue
              });
            } catch (e) {
              // Toast not available
            }
          }
          throw new Error(`Unauthorized endpoint for Reception role: ${url}`);
        }
      }
    }
    
    // 🛡️ RBAC Enforcement: Admin can ONLY access /admin/* routes (read-only)
    if (currentUser?.role === 'admin') {
        // Block admin from accessing /staff/* or /reception/* routes
        if (url.includes('/staff/') || url.includes('/reception/')) {
          console.warn(`🚨 RBAC warning: role=admin attempted unauthorized endpoint: ${url}`);
          console.warn(`⚠️ Admin role is restricted to /admin/* routes only (read-only)`);
          if (typeof window !== 'undefined') {
            try {
              import('./toast').then(({ notify }) => {
                notify.error('Admins have view-only access. Access restricted to admin endpoints.');
              }).catch(() => {});
            } catch (e) {}
          }
          throw new Error(`Unauthorized endpoint for Admin role: ${url}. Admin can only access /admin/* routes (read-only).`);
        }
      // Log admin read-only mode
      if (url.startsWith('/admin/')) {
        console.log(`✅ RBAC: Admin read-only mode verified for ${url}`);
      }
    } else if (currentUser?.role && currentUser.role !== 'admin' && typeof url === 'string' && url.startsWith('/admin/')) {
      // General warning for other roles
      console.warn(`⚠️ RBAC warning: role=${currentUser.role} attempting to call admin endpoint: ${url}. Consider using staff/client endpoint.`);
    }
  } catch (rbacError) {
      // Re-throw RBAC blocking errors
      if (rbacError.message?.includes('Access restricted') || rbacError.message?.includes('Unauthorized endpoint')) {
        throw rbacError;
      }
    }
  
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
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    console.log(`👤 User role:`, currentUser.role);
    
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

      // Auto-retry for 5xx when date-filtered appointments fail: strip date and retry once
      if (
        status >= 500 &&
        typeof url === 'string' &&
        url.includes('/appointments') &&
        url.includes('?')
      ) {
        try {
          const baseUrl = url.split('?')[0];
          console.warn(`♻️ Auto-retrying without filters due to ${status} for ${url} -> ${baseUrl}`);
          const retryRes = await fetch(`${API_BASE}${baseUrl}`, { ...options, headers });
          if (retryRes.ok) {
            const ct = retryRes.headers.get('content-type') || '';
            return ct.includes('application/json') ? await retryRes.json() : null;
          }
        } catch (_) {
          // ignore and continue to normal error handling
        }
      }
      
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
        // Handle RBAC middleware 403 from backend
        const errorData = await res.json().catch(() => ({ message: "Access forbidden" }));
        const errorMessage = errorData.message || errorData.error || "Access forbidden. You do not have permission to access this resource.";
        
        // Show toast and trigger redirect for unauthorized role access
        if (typeof window !== 'undefined') {
          try {
            const { notify } = await import('./toast');
            notify.error('Access restricted for your role');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                const event = new CustomEvent('navigate', { detail: { page: 'dashboard' } });
                window.dispatchEvent(event);
              }
            }, 1000);
          } catch (e) {
            // Toast not available
          }
        }
        
        throw new Error(errorMessage);
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
  } else if (user.role === 'reception') {
    url = `/reception/clients${queryParams ? `?${queryParams}` : ''}`;
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
  } else if (user.role === 'reception') {
    endpoint = `/reception/clients/${id}`;
  } else {
    endpoint = `/staff/clients/${id}`;
  }
  
  return fetchWithAuth(endpoint);
}

export async function createClient(clientData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Admin is read-only, reception uses staff endpoint
  if (user.role === 'admin') {
    throw new Error('Admin role has read-only access. Cannot create clients.');
  }
  
  const endpoint = (user.role === 'reception')
    ? '/reception/clients'
    : (user.role === 'provider' ? '/staff/clients' : '/admin/clients');
  
  return fetchWithAuth(endpoint, {
    method: "POST",
    body: JSON.stringify(clientData),
  });
}

export async function updateClient(id, clientData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Admin is read-only, reception uses staff endpoint
  if (user.role === 'admin') {
    throw new Error('Admin role has read-only access. Cannot update clients.');
  }
  
  const endpoint = (user.role === 'reception')
    ? `/reception/clients/${id}`
    : (user.role === 'provider' ? `/staff/clients/${id}` : `/admin/clients/${id}`);
  
  return fetchWithAuth(endpoint, {
    method: "PUT",
    body: JSON.stringify(clientData),
  });
}

export async function deleteClient(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Admin is read-only, reception uses staff endpoint
  if (user.role === 'admin') {
    throw new Error('Admin role has read-only access. Cannot delete clients.');
  }
  
  const endpoint = (user.role === 'reception')
    ? `/reception/clients/${id}`
    : (user.role === 'provider' ? `/staff/clients/${id}` : `/admin/clients/${id}`);
  
  return fetchWithAuth(endpoint, {
    method: "DELETE",
  });
}

// ✅ Appointments API Functions
export async function getAppointments(filters = {}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Ensure valid YYYY-MM-DD date if provided; fallback to today when invalid
  const ensureValidDate = (value) => {
    if (!value || typeof value !== 'string') return null;
    const m = /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (!m) return null;
    const d = new Date(value + 'T00:00:00');
    return isNaN(d.getTime()) ? null : value;
  };

  const today = new Date().toISOString().slice(0, 10);
  const sanitized = { ...filters };
  if (sanitized.date) {
    const valid = ensureValidDate(sanitized.date);
    sanitized.date = valid || today;
  }

  const queryParams = new URLSearchParams(sanitized).toString();

  // Use role-based endpoint
  let url;
  if (user.role === 'admin') {
    url = `/admin/appointments${queryParams ? `?${queryParams}` : ''}`;
  } else if (user.role === 'reception') {
    url = `/reception/appointments${queryParams ? `?${queryParams}` : ''}`;
  } else if (user.role === 'provider') {
    url = `/staff/appointments${queryParams ? `?${queryParams}` : ''}`;
  } else {
    // Client or fallback
    url = `/client/appointments${queryParams ? `?${queryParams}` : ''}`;
  }

  console.log(`🔍 Fetching appointments as ${user.role} from:`, url);
  try {
    const result = await fetchWithAuth(url);
    console.log('📋 Appointments response:', result);
    return result;
  } catch (err) {
    // Retry once without date filter if the endpoint returned a server error
    const message = String(err?.message || '');
    if (message.toLowerCase().includes('server error') || message.includes('500')) {
      try {
        const retryUrl = url.replace(/\?[^]*$/, '');
        console.warn('♻️ Retrying appointments fetch without date filter:', retryUrl);
        const retry = await fetchWithAuth(retryUrl);
        console.log('📋 Appointments retry response:', retry);
        return retry;
      } catch (e2) {
        throw err; // propagate original
      }
    }
    throw err;
  }
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
  
  // Use role-based endpoint
  let endpoint;
  if (user.role === 'client') {
    endpoint = `/client/appointments/${id}`;
  } else if (user.role === 'admin') {
    endpoint = `/admin/appointments/${id}`;
  } else if (user.role === 'reception') {
    endpoint = `/reception/appointments/${id}`;
  } else {
    endpoint = `/staff/appointments/${id}`;
  }
    
  return fetchWithAuth(endpoint);
}

export async function createAppointment(appointmentData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('📝 Creating appointment:', appointmentData);
  
  // Use role-based endpoint
  let endpoint;
  if (user.role === 'client') {
    endpoint = "/client/appointments";
  } else if (user.role === 'admin') {
    // Admin is read-only, but allow for backward compatibility
    throw new Error('Admin role has read-only access. Cannot create appointments.');
  } else if (user.role === 'reception') {
    endpoint = "/reception/appointments";
  } else {
    endpoint = "/staff/appointments";
  }
  
  const result = await fetchWithAuth(endpoint, {
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
  } else if (user.role === 'reception') {
    endpoint = `/reception/appointments/${id}`;
  } else {
    // Admin, provider use staff endpoint (admin routes are read-only)
    endpoint = `/staff/appointments/${id}`;
  }
  
  return fetchWithAuth(endpoint, {
    method: "PUT",
    body: JSON.stringify(appointmentData),
  });
}

export async function updateAppointmentStatus(id, status) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Use role-based endpoint
  let endpoint;
  if (user.role === 'client') {
    endpoint = `/client/appointments/${id}/status`;
  } else if (user.role === 'admin') {
    endpoint = `/admin/appointments/${id}/status`;
  } else if (user.role === 'reception') {
    endpoint = `/reception/appointments/${id}/status`;
  } else {
    // Provider
    endpoint = `/staff/appointments/${id}/status`;
  }
  
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
  } else if (user.role === 'reception') {
    endpoint = `/reception/appointments/${id}`;
  } else {
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
  } else if (user.role === 'reception') {
    url = `/reception/packages${queryParams ? `?${queryParams}` : ''}`;
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
  } else if (user.role === 'reception') {
    endpoint = `/reception/packages/${id}`;
  } else {
    endpoint = `/staff/packages/${id}`;
  }
  
  return fetchWithAuth(endpoint);
}

export async function createPackage(packageData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Admin has read-only access, cannot create
  if (user.role === 'admin') {
    throw new Error('Access forbidden. Admin role has read-only access. Cannot create packages.');
  }
  
  // Staff (provider/reception) can create via /staff/packages
  const endpoint = (user.role === 'reception')
    ? '/reception/packages'
    : (user.role === 'provider' ? '/staff/packages' : null);
  
  if (!endpoint) {
    throw new Error('Unauthorized. Only staff can create packages.');
  }
  
  return fetchWithAuth(endpoint, {
    method: "POST",
    body: JSON.stringify(packageData),
  });
}

export async function updatePackage(id, packageData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Admin has read-only access, cannot update
  if (user.role === 'admin') {
    throw new Error('Access forbidden. Admin role has read-only access. Cannot update packages.');
  }
  
  // Staff (provider/reception) can update via /staff/packages
  let endpoint;
  if (user.role === 'reception') {
    endpoint = `/reception/packages/${id}`;
  } else if (user.role === 'provider') {
    endpoint = `/staff/packages/${id}`;
  } else {
    throw new Error('Unauthorized. Only staff can update packages.');
  }
  
  return fetchWithAuth(endpoint, {
    method: "PUT",
    body: JSON.stringify(packageData),
  });
}

export async function deletePackage(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Admin has read-only access, cannot delete
  if (user.role === 'admin') {
    throw new Error('Access forbidden. Admin role has read-only access. Cannot delete packages.');
  }
  
  // Staff (provider/reception) can delete via /staff/packages
  let endpoint;
  if (user.role === 'reception') {
    endpoint = `/reception/packages/${id}`;
  } else if (user.role === 'provider') {
    endpoint = `/staff/packages/${id}`;
  } else if (user.role === 'admin') {
    // This won't be reached due to check above, but keeping for clarity
    endpoint = `/admin/packages/${id}`;
  } else {
    throw new Error('Unauthorized. Only staff can delete packages.');
  }
  
  return fetchWithAuth(endpoint, {
    method: "DELETE",
  });
}

export async function assignPackageToClient(clientId, packageId) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Admin is read-only, reception/provider use staff endpoint
  if (user.role === 'admin') {
    throw new Error('Admin role has read-only access. Cannot assign packages.');
  }
  
  // Use staff endpoint for reception/provider
  const endpoint = (user.role === 'reception')
    ? '/reception/packages/assign'
    : (user.role === 'provider' ? '/staff/packages/assign' : '/admin/packages/assign');
  
  // Log RBAC fix if needed
  if (user.role === 'reception') {
    console.log('✅ RBAC: Using /reception/packages/assign for reception role');
  }
  
  return fetchWithAuth(endpoint, {
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
  } else if (user.role === 'reception') {
    url = `/reception/services${queryParams ? `?${queryParams}` : ''}`;
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
  } else if (user.role === 'reception') {
    endpoint = `/reception/services/${id}`;
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
  } else if (user.role === 'reception') {
    url = `/reception/payments${queryParams ? `?${queryParams}` : ''}`;
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
  } else if (user.role === 'reception') {
    endpoint = `/reception/payments/${id}`;
  } else {
    endpoint = `/staff/payments/${id}`;
  }
  
  return fetchWithAuth(endpoint);
}

export async function createPayment(paymentData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Use role-based endpoint
  let endpoint;
  if (user.role === 'client') {
    endpoint = "/client/payments";
  } else if (user.role === 'admin') {
    throw new Error('Admin role has read-only access. Cannot create payments.');
  } else if (user.role === 'reception') {
    endpoint = "/reception/payments";
  } else {
    endpoint = "/staff/payments";
  }
  
  return fetchWithAuth(endpoint, {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
}

export async function updatePayment(id, paymentData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Admin is read-only, reception/provider use staff endpoint
  if (user.role === 'admin') {
    throw new Error('Admin role has read-only access. Cannot update payments.');
  }
  
  // Use staff endpoint for reception/provider
  const endpoint = (user.role === 'reception')
    ? `/reception/payments/${id}`
    : (user.role === 'provider' ? `/staff/payments/${id}` : `/admin/payments/${id}`);
  
  return fetchWithAuth(endpoint, {
    method: "PUT",
    body: JSON.stringify(paymentData),
  });
}

export async function deletePayment(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Admin is read-only, reception/provider use staff endpoint
  if (user.role === 'admin') {
    throw new Error('Admin role has read-only access. Cannot delete payments.');
  }
  
  // Use staff endpoint for reception/provider
  const endpoint = (user.role === 'reception')
    ? `/reception/payments/${id}`
    : (user.role === 'provider' ? `/staff/payments/${id}` : `/admin/payments/${id}`);
  
  return fetchWithAuth(endpoint, {
    method: "DELETE",
  });
}

export async function confirmStripePayment(paymentId, paymentIntentId) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Use role-based endpoint
  let endpoint;
  if (user.role === 'admin') {
    endpoint = `/admin/payments/${paymentId}/confirm-stripe`;
  } else if (user.role === 'client') {
    endpoint = `/client/payments/${paymentId}/confirm-stripe`;
  } else if (user.role === 'reception') {
    endpoint = `/reception/payments/${paymentId}/confirm-stripe`;
  } else {
    endpoint = `/staff/payments/${paymentId}/confirm-stripe`;
  }
  
  return fetchWithAuth(endpoint, {
    method: "POST",
    body: JSON.stringify({ payment_intent_id: paymentIntentId }),
  });
}

export async function generateReceipt(paymentId) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  // Use role-based endpoint
  let receiptUrl;
  if (user.role === 'admin') {
    receiptUrl = `/admin/payments/${paymentId}/receipt`;
  } else if (user.role === 'client') {
    receiptUrl = `/client/payments/${paymentId}/receipt`;
  } else if (user.role === 'reception') {
    receiptUrl = `/reception/payments/${paymentId}/receipt`;
  } else {
    receiptUrl = `/staff/payments/${paymentId}/receipt`;
  }

  const response = await fetch(`${API_BASE}${receiptUrl}`, {
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const queryParams = new URLSearchParams(filters).toString();
  
  // Use role-based endpoint
  let url;
  if (user.role === 'admin') {
    url = `/admin/products${queryParams ? `?${queryParams}` : ''}`;
  } else if (user.role === 'reception') {
    url = `/reception/products${queryParams ? `?${queryParams}` : ''}`;
    console.log('✅ RBAC: Using /reception/products for reception role');
  } else if (user.role === 'provider') {
    url = `/staff/products${queryParams ? `?${queryParams}` : ''}`;
    console.log('✅ RBAC: Using /staff/products for provider role');
  } else {
    url = `/admin/products${queryParams ? `?${queryParams}` : ''}`;
  }
  
  return fetchWithAuth(url);
}

export async function getProduct(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Use role-based endpoint
  let endpoint;
  if (user.role === 'admin') {
    endpoint = `/admin/products/${id}`;
  } else if (user.role === 'reception') {
    endpoint = `/reception/products/${id}`;
  } else if (user.role === 'provider') {
    endpoint = `/staff/products/${id}`;
  } else {
    endpoint = `/admin/products/${id}`;
  }
  
  return fetchWithAuth(endpoint);
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Provider/Staff should use stock-notifications endpoint (read-only)
  // Admin can access stock-alerts (full access)
  const url = (user.role === 'provider' || user.role === 'reception' || user.role === 'staff')
    ? "/staff/stock-notifications"
    : "/admin/stock-alerts";
  
  console.log(`✅ RBAC: Using ${url} for ${user.role} role`);
  return fetchWithAuth(url);
}

export async function getStockAlertStatistics() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const url = (user.role === 'provider' || user.role === 'reception' || user.role === 'staff')
    ? "/staff/stock-notifications/statistics" // If available, otherwise will return empty
    : "/admin/stock-alerts/statistics";
  
  console.log(`✅ RBAC: Using ${url} for ${user.role} role`);
  return fetchWithAuth(url);
}

export async function dismissStockAlert(alertId) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Only admin can dismiss alerts
  if (user.role !== 'admin') {
    throw new Error('Access denied. Only admin can dismiss stock alerts.');
  }
  return fetchWithAuth(`/admin/stock-alerts/${alertId}/dismiss`, {
    method: "POST",
  });
}

export async function resolveStockAlert(alertId) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Only admin can resolve alerts
  if (user.role !== 'admin') {
    throw new Error('Access denied. Only admin can resolve stock alerts.');
  }
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
// ✅ Admin Dashboard API Functions (READ-ONLY)
export async function getAdminDashboardStats() {
  console.log('📊 Fetching admin dashboard stats from /admin/dashboard');
  const stats = await fetchWithAuth('/admin/dashboard');
  console.log('✅ Admin dashboard stats:', stats);
  console.log('✅ RBAC: Admin read-only mode verified');
  return stats;
}

export async function getStaff() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const url = user.role === 'admin' 
    ? '/admin/staff' 
    : '/admin/users'; // Fallback for other roles
  console.log(`👥 Fetching staff from ${url}`);
  const staff = await fetchWithAuth(url);
  console.log(`✅ Staff data loaded: ${Array.isArray(staff) ? staff.length : 0} staff members`);
  return staff;
}

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

// ✅ Treatments API Functions (Provider-only)
export async function getTreatments(filters = {}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const queryParams = new URLSearchParams(filters).toString();
  
  // Provider uses /staff/treatments, client uses /client/treatments
  const endpoint = (user.role === 'client') 
    ? `/client/treatments${queryParams ? `?${queryParams}` : ''}`
    : `/staff/treatments${queryParams ? `?${queryParams}` : ''}`;
  
  console.log(`✅ RBAC: Using ${endpoint} for ${user.role} role`);
  return fetchWithAuth(endpoint);
}

export async function getTreatment(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const endpoint = (user.role === 'client') 
    ? `/client/treatments/${id}`
    : `/staff/treatments/${id}`;
  
  return fetchWithAuth(endpoint);
}

export async function createTreatment(treatmentData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role === 'client') {
    throw new Error('Clients cannot create treatments.');
  }
  
  const endpoint = `/staff/treatments`;
  
  return fetchWithAuth(endpoint, {
    method: "POST",
    body: JSON.stringify(treatmentData),
  });
}

export async function updateTreatment(id, treatmentData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role === 'client') {
    throw new Error('Clients cannot update treatments.');
  }
  
  const endpoint = `/staff/treatments/${id}`;
  
  return fetchWithAuth(endpoint, {
    method: "PUT",
    body: JSON.stringify(treatmentData),
  });
}

// ✅ Consent Forms API Functions (Provider-only)
export async function getConsentForms(filters = {}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const queryParams = new URLSearchParams(filters).toString();
  
  // Provider uses /staff/consent-forms, client uses /client/consent-forms
  const endpoint = (user.role === 'client') 
    ? `/client/consent-forms${queryParams ? `?${queryParams}` : ''}`
    : `/staff/consent-forms${queryParams ? `?${queryParams}` : ''}`;
  
  console.log(`✅ RBAC: Using ${endpoint} for ${user.role} role`);
  return fetchWithAuth(endpoint);
}

export async function getConsentForm(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const endpoint = (user.role === 'client') 
    ? `/client/consent-forms/${id}`
    : `/staff/consent-forms/${id}`;
  
  return fetchWithAuth(endpoint);
}

export async function createConsentForm(consentData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role === 'provider' || user.role === 'admin') {
    // Admin is read-only, but allow provider
    if (user.role === 'admin') {
      throw new Error('Admin role has read-only access. Cannot create consent forms.');
    }
    const endpoint = `/staff/consent-forms`;
    return fetchWithAuth(endpoint, {
      method: "POST",
      body: JSON.stringify(consentData),
    });
  }
  
  // Client can create consent forms
  const endpoint = `/client/consent-forms`;
  return fetchWithAuth(endpoint, {
    method: "POST",
    body: JSON.stringify(consentData),
  });
}

export async function updateConsentForm(id, consentData) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const endpoint = (user.role === 'client') 
    ? `/client/consent-forms/${id}`
    : `/staff/consent-forms/${id}`;
  
  return fetchWithAuth(endpoint, {
    method: "PUT",
    body: JSON.stringify(consentData),
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

// ✅ Compliance Alerts API Functions (Provider + Admin)
export async function getComplianceAlerts(filters = {}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const queryParams = new URLSearchParams(filters).toString();
  
  // Provider uses /staff/ endpoint if available, otherwise /admin/ (read-only)
  const url = (user.role === 'provider')
    ? `/staff/compliance-alerts${queryParams ? `?${queryParams}` : ''}` // Will fallback to admin if not available
    : `/admin/compliance-alerts${queryParams ? `?${queryParams}` : ''}`;
  
  console.log(`✅ RBAC: Using ${url} for ${user.role} role`);
  return fetchWithAuth(url);
}

export async function getComplianceAlert(id) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const url = (user.role === 'provider')
    ? `/staff/compliance-alerts/${id}`
    : `/admin/compliance-alerts/${id}`;
  
  console.log(`✅ RBAC: Using ${url} for ${user.role} role`);
  return fetchWithAuth(url);
}

export async function getComplianceStatistics() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const url = (user.role === 'provider')
    ? `/staff/compliance-alerts/statistics`
    : `/admin/compliance-alerts/statistics`;
  
  console.log(`✅ RBAC: Using ${url} for ${user.role} role`);
  return fetchWithAuth(url);
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
  