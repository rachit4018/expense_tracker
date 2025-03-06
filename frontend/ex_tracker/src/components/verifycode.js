import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../config";

const VerifyCode = () => {
    const [formData, setFormData] = useState({ email: "", code: "" });
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
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
            // Send verification request to the backend
            const response = await axios.post(
                `${BASE_URL}verify_code/`,
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
                // Verification successful
                setMessage(response.data.message);
                setTimeout(() => navigate("/"), 1000);  // Redirect to login page after successful verification
            }
        } catch (error) {
            if (error.response) {
                // Handle specific error messages from the backend
                setError(error.response.data.error || "Verification failed. Please try again.");
            } else {
                setError("An error occurred while submitting.");
            }
            console.error(error);
        }
    };

    return (
        <div>
            <h1>Verify Code</h1>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {message && <p style={{ color: "green" }}>{message}</p>}
            <form onSubmit={handleSubmit}>
                <p>
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </p>
                <p>
                    <label>Verification Code:</label>
                    <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        required
                    />
                </p>
                <button type="submit">Verify</button>
            </form>
        </div>
    );
};

export default VerifyCode;