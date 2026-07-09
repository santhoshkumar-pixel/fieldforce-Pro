import axios from "axios";

// 1. Get base API URL from environment variables, fallback to local development port
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In production, never fallback to localhost
  return import.meta.env.PROD ? "" : "http://localhost:8080";
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Add Request Interceptor for Authentication Headers
axiosInstance.interceptors.request.use(
  (config) => {
    // Session headers from sessionStorage for role-based access control
    try {
      const sessionStr = sessionStorage.getItem("fieldforce_admin_session");
      if (sessionStr) {
        const sessionUser = JSON.parse(sessionStr);
        if (sessionUser) {
          if (sessionUser.role) config.headers["X-User-Role"] = sessionUser.role;
          if (sessionUser.name) config.headers["X-User-Name"] = sessionUser.name;
          if (sessionUser.zone) config.headers["X-User-Zone"] = sessionUser.zone;
          if (sessionUser.email) config.headers["X-User-Email"] = sessionUser.email;
          if (sessionUser.id) config.headers["X-User-Id"] = sessionUser.id;
        }
      }
    } catch (e) {
      console.error("Error reading session storage for headers:", e);
    }

    // Authorization Bearer token from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
