import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../config";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState(""); // State to store CSRF token
  const navigate = useNavigate();

  // Fetch CSRF token when the component mounts
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await axios.get(`${BASE_URL}csrf/`, {
          withCredentials: true, // Include credentials for CSRF token
        });
        const csrfToken = response.headers["x-csrftoken"] || response.data.csrfToken; // Extract CSRF token
        setCsrfToken(csrfToken); // Store CSRF token in state
      } catch (error) {
        console.error("Failed to fetch CSRF token", error);
      }
    };

    fetchCSRFToken();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send log
      // in request to the backend
      const response = await axios.post(
        `${BASE_URL}`,  // Ensure this matches your Django login endpoint
        formData,  // Send JSON data
        {
          headers: {
            "Content-Type": "application/json",  // Use JSON content type
            "X-CSRFToken": csrfToken,  // Include CSRF token in headers
          },
          withCredentials: true,  // Include credentials for session-based auth
        }
      );

      if (response.status === 200) {
        // Save the JWT token in localStorage
        localStorage.setItem("token", response.data.token);

        // Save user data in localStorage (optional)
        localStorage.setItem("user", JSON.stringify(response.data));

        // Navigate to the home page with user data
        navigate("/home", { state: { user: response.data } });
      } else {
        setError("Invalid credentials");
      }
    } catch (error) {
      if (error.response) {
        // Handle specific error messages from the backend
        setError(error.response.data.error || "An error occurred while logging in.");
      } else {
        setError("An error occurred while submitting");
      }
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <p>
          <label>Username:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </p>
        <p>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </p>
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
};

export default Login;