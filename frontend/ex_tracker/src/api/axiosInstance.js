import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

const axiosInstance = axios.create({
  baseURL: `${API_BASE}/expense_tracker`,
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    "Content-Type": "application/json",
  },
});

const PUBLIC_PATHS = [
  "/csrf/",
  "/login/",
  "/signup/",
  "/verify_code/",
  "/resend-code/",
  "/reset_password/",
];

const shouldSkipAuth = (url = "") => {
  return PUBLIC_PATHS.some((path) => url.startsWith(path));
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");

    if (token && !shouldSkipAuth(config.url || "")) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const errorMessage =
        error.response.data?.detail ||
        error.response.data?.error ||
        "";

      const isExpiredToken =
        error.response.status === 401 &&
        typeof errorMessage === "string" &&
        errorMessage.toLowerCase().includes("token has expired");

      if (isExpiredToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }

      console.error("API Error:", error.response.data);
    } else {
      console.error("Network Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;