import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config";

// Reusable InputField
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

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password1: "",
    password2: "",
    college: "",
    semester: "",
    default_payment_method: "",
  });
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
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
      } catch (err) {
        setError("Failed to fetch CSRF token.");
      } finally {
        setLoading(false);
      }
    };

    fetchCSRFToken();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setMessages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessages([]);

    if (formData.password1 !== formData.password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}signup/`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        setMessages(["Sign up successful! Redirecting to verification page..."]);
        setTimeout(() => navigate("/verifycode"), 1200);
      } else {
        setMessages(response.data.messages || []);
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error || "Signup failed. Please check your details.");
        if (err.response.data.details) {
          const details = Array.isArray(err.response.data.details)
            ? err.response.data.details
            : [err.response.data.details];
          setMessages(details);
        }
      } else {
        setError("An error occurred while submitting.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-100 flex flex-col relative overflow-hidden">
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/connected.png')] opacity-10 z-0"
        aria-hidden="true"
      ></div>

      {/* Navbar */}
      <nav className="relative z-10 bg-white/90 shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-700">💸 Expense Tracker</h1>
          <a href="/login" className="text-indigo-700 hover:underline font-medium">
            Log In
          </a>
        </div>
      </nav>

      {/* Main Section */}
      <section className="relative z-10 flex-grow flex flex-col lg:flex-row items-center justify-between px-6 lg:px-20 py-16 gap-10">
        {/* Info Column */}
        <div className="max-w-xl text-gray-800">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Join the Expense Tracker Community
          </h2>
          <p className="mb-4 text-lg">
            Create your free account to start tracking expenses, splitting costs,
            and managing your finances with friends or solo!
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>🚀 Quick, easy signup</li>
            <li>🔒 Secure & private</li>
            <li>📧 Email verification for safety</li>
            <li>🎓 Ideal for students, roommates, and friends</li>
          </ul>
        </div>

        {/* Signup Form */}
        <div className="w-full max-w-md bg-white/90 shadow-xl rounded-xl p-8 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Create Your Account
          </h3>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {messages.length > 0 && (
            <div className="mb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`px-4 py-2 rounded text-sm mb-1 ${
                    msg.toLowerCase().includes("success")
                      ? "bg-green-100 text-green-700 animate-pulse"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {msg}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} aria-busy={loading}>
            <InputField label="Username" type="text" name="username" value={formData.username} onChange={handleChange} required autoComplete="username" disabled={loading} />
            <InputField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" disabled={loading} />
            <InputField
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password1"
              value={formData.password1}
              onChange={handleChange}
              required
              autoComplete="new-password"
              disabled={loading}
            >
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                aria-label="Toggle password"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </InputField>
            <InputField
              label="Confirm Password"
              type={showPassword2 ? "text" : "password"}
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              required
              autoComplete="new-password"
              disabled={loading}
            >
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                aria-label="Toggle password"
                onClick={() => setShowPassword2((s) => !s)}
              >
                {showPassword2 ? "🙈" : "👁️"}
              </button>
            </InputField>
            <InputField label="College" type="text" name="college" value={formData.college} onChange={handleChange} required autoComplete="organization" disabled={loading} />
            <InputField label="Semester" type="text" name="semester" value={formData.semester} onChange={handleChange} required disabled={loading} />
            <InputField label="Default Payment Method" type="text" name="default_payment_method" value={formData.default_payment_method} onChange={handleChange} required disabled={loading} />

            <button
              data-testid="signup-submit-button"
              type="submit"
              className={`w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing up...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-600 hover:underline">
              Log in
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

export default Signup;
