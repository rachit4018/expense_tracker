import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../config";
import { useNavigate } from "react-router-dom";

const InputField = ({
  label,
  type,
  name,
  value,
  onChange,
  required,
  autoComplete,
  error,
  children,
  ...rest
}) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-gray-700 mb-1 font-medium">
      {label}
    </label>
    <div className="relative">
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
          error ? "border-red-400" : ""
        }`}
        {...rest}
      />
      {children}
    </div>
    {error && (
      <span id={`${name}-error`} className="text-xs text-red-600">
        {error}
      </span>
    )}
  </div>
);

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}csrf/`, {
          withCredentials: true,
        });
        const token = response.headers["x-csrftoken"] || response.data.csrfToken;
        setCsrfToken(token);
      } catch (error) {
        setError("Failed to fetch CSRF token.");
      } finally {
        setLoading(false);
      }
    };
    fetchCSRFToken();
  }, []);

   const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Email is invalid";
    }
    if (!formData.password) errs.password = "Password is required";
    return errs;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}login/`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data));
        setSuccess(true);
        setTimeout(() => {
          navigate("/home", { state: { user: response.data } });
        }, 1000);
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data.error || "Invalid credentials");
      } else if (error.request) {
        setError("No response from the server. Please try again.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-100 flex flex-col">
      {/* Optional background pattern overlay */}
      <div
        className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/connected.png')] opacity-10 z-0"
        aria-hidden="true"
      ></div>

      {/* Navbar */}
      <nav className="relative z-10 bg-white/90 shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="text-lg font-semibold text-gray-800">
          <h1 className="text-2xl font-bold text-indigo-700">💸 Expense Tracker</h1>
          </a>
        </div>
      </nav>

      {/* Main Section */}
      <section className="relative z-10 flex-grow flex flex-col lg:flex-row items-center justify-between px-6 lg:px-20 py-16 gap-10">
        {/* Info Column */}
        <div className="max-w-xl text-gray-800">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Smarter Expense Tracking
          </h2>
          <p className="mb-4 text-lg">
            Expense Tracker helps you split costs, settle balances, and manage
            your group or personal finances with ease.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>✅ Track & categorize your expenses</li>
            <li>💳 Manage payment preferences</li>
            <li>👥 Collaborate in groups or solo</li>
            <li>📊 Get clear summaries anytime</li>
          </ul>
        </div>

        {/* Login Form Card */}
        <div className="w-full max-w-md bg-white/90 shadow-xl rounded-xl p-8 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Login to Your Account
          </h3>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm text-center animate-pulse">
              Login successful! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} aria-busy={loading}>
            <InputField
              label="Email"
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              error={errors.email}
              disabled={loading}
            />

            <InputField
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              error={errors.password}
              disabled={loading}
            >
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </InputField>

            {/* Reset Password Link  */}

            <p className="text-right text-sm text-indigo-600 hover:underline mb-3">
              <a href="/reset_password">Forgot Password?</a>
            </p>

            <button
              type="submit"
              className={`w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don’t have an account?{" "}
            <a href="/signup" className="text-indigo-600 hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center text-sm text-gray-500 py-6 border-t">
        &copy; {new Date().getFullYear()} Expense Tracker. Built for peace of mind 💙
      </footer>
    </div>
  );
};

export default Login;
