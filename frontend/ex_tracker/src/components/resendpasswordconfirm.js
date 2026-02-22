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
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

const ResendPasswordConfirm = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [csrfToken, setCsrfToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch CSRF Token
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await axios.get(`${BASE_URL}csrf/`, {
          withCredentials: true,
        });
        const token =
          response.headers["x-csrftoken"] || response.data.csrfToken;
        setCsrfToken(token);
      } catch (err) {
        setError("Failed to get CSRF token.");
      }
    };
    fetchCSRFToken();
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}reset_password/${token}/`,
        { new_password: newPassword, confirm_password: confirmPassword },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );

      if (response.data.message) {
        setSuccess(true);
        setMessage(response.data.message);

        setTimeout(() => navigate("/"), 1400);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-100 flex flex-col">
      {/* Background Texture */}
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

      {/* Main Section */}
      <section className="relative z-10 flex-grow flex flex-col lg:flex-row items-center justify-between px-6 lg:px-20 py-16 gap-10">
        {/* Info Column */}
        <div className="max-w-xl text-gray-800">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Reset Your Password
          </h2>
          <p className="mb-4 text-lg">
            Enter your new password below and regain access to your account
            securely.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>🔐 Create a strong password</li>
            <li>⚠️ Don’t share your password with anyone</li>
            <li>🔁 You will be redirected after successful reset</li>
          </ul>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-md bg-white/90 shadow-xl rounded-xl p-8 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Set Your New Password
          </h3>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm text-center animate-pulse">
              {message}
            </div>
          )}

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
              className={`w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center text-sm text-gray-500 py-6 border-t">
        &copy; {new Date().getFullYear()} Expense Tracker. Built for peace of
        mind 💙
      </footer>
    </div>
  );
};

export default ResendPasswordConfirm;
