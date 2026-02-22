import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config";

const InputField = ({
  label,
  type,
  name,
  value,
  onChange,
  required,
  error,
  disabled,
}) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-gray-700 mb-1 font-medium">
      {label}
    </label>
    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
        error ? "border-red-400" : ""
      }`}
    />
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
);

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch CSRF token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await axios.get(`${BASE_URL}csrf/`, {
          withCredentials: true,
        });
        const token =
          response.headers["x-csrftoken"] || response.data.csrfToken;
        setCsrfToken(token);
      } catch {
        setError("Failed to load CSRF token.");
      }
    };
    fetchToken();
  }, []);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}reset_password/`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );

      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}reset_password_confirm/${token}/`,
        { new_password: newPassword, confirm_password: confirmPassword },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );

      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-100 flex flex-col">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/connected.png')] opacity-10 z-0"
        aria-hidden="true"
      ></div>

      {/* Navbar */}
      <nav className="relative z-10 bg-white/90 shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="text-lg font-semibold text-gray-800">
            <h1 className="text-2xl font-bold text-indigo-700">
              💸 Expense Tracker
            </h1>
          </a>
        </div>
      </nav>

      {/* Main Layout */}
      <section className="relative z-10 flex-grow flex flex-col lg:flex-row items-center justify-between px-6 lg:px-20 py-16 gap-10">
        {/* Left Info Block */}
        <div className="max-w-xl text-gray-800">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            {token ? "Set a New Password" : "Forgot Your Password?"}
          </h2>

          {!token ? (
            <p className="mb-4 text-lg">
              Enter your email and we’ll send you a secure password reset link.
            </p>
          ) : (
            <p className="mb-4 text-lg">
              Create a strong password to secure your account.
            </p>
          )}

          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>🔐 Reset securely using unique token</li>
            <li>⚠️ Token expires in 10 minutes</li>
            <li>📧 Check your email inbox and spam folder</li>
          </ul>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-md bg-white/90 shadow-xl rounded-xl p-8 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            {token ? "Create New Password" : "Reset Password"}
          </h3>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm text-center animate-pulse">
              {message}
            </div>
          )}

          {!token ? (
            <form onSubmit={handleEmailSubmit}>
              <InputField
                label="Email Address"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              <button
                type="submit"
                className={`w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset}>
              <InputField
                label="New Password"
                type="password"
                name="new_password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />

              <InputField
                label="Confirm Password"
                type="password"
                name="confirm_password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />

              <button
                type="submit"
                className={`w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center text-sm text-gray-500 py-6 border-t">
        &copy; {new Date().getFullYear()} Expense Tracker. Built for peace of mind 💙
      </footer>
    </div>
  );
};

export default ResetPassword;
