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
        // Fetch CSRF token before submitting login request
        const csrfToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("csrftoken="))
            ?.split("=")[1];

        console.log("CSRF Token:", csrfToken);

        // Send login request
        const response = await axios.post(
            `${BASE_URL}`,  // ✅ Ensure correct endpoint
            formData,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,  // ✅ Include CSRF token
                },
                withCredentials: true,
            }
        );

        if (response.status === 200) {
            // Store JWT Token
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data));

            // Navigate to home
            navigate("/home", { state: { user: response.data } });
        } else {
            setError("Invalid credentials");
        }
    } catch (error) {
        console.error("Login error:", error);
        setError("An error occurred while logging in.");
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