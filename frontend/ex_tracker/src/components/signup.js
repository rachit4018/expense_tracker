import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config";

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
    const [messages, setMessages] = useState([]); // Ensure messages is an array
    const [error, setError] = useState("");
    const [csrfToken, setCsrfToken] = useState(""); // State to store CSRF token
    const navigate = useNavigate();

    // Fetch CSRF token when the component mounts
    useEffect(() => {
        const fetchCSRFToken = async () => {
            try {
                const response = await axios.get(`${BASE_URL}csrf/`, {
                    withCredentials: true,
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
            // Send signup request to the backend
            const response = await axios.post(
                `${BASE_URL}signup/`,  // Ensure this matches your Django signup endpoint
                formData,  // Send JSON data
                {
                    headers: {
                        "Content-Type": "application/json",  // Use JSON content type
                        "X-CSRFToken": csrfToken,  // Include CSRF token in headers
                    },
                    withCredentials: true,  // Include credentials for session-based auth
                }
            );

            if (response.status === 201) {
                // Signup successful
                setMessages(["Sign up successful! Redirecting to verification page..."]); // Set messages as an array
                setTimeout(() => navigate("/verifycode"), 1000);  // Redirect to verification page
            } else {
                // Handle other success statuses (if any)
                setMessages(response.data.messages || []); // Ensure messages is an array
            }
        } catch (error) {
            if (error.response) {
                // Handle specific error messages from the backend
                setError(error.response.data.error || "Sign up failed. Please check your details.");
                setMessages(error.response.data.details ? [error.response.data.details] : []); // Ensure messages is an array
            } else {
                setError("An error occurred while submitting.");
            }
            console.error(error);
        }
    };

    return (
        <div>
            <h1>Sign Up</h1>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {messages.length > 0 && (
                <div>
                    {messages.map((msg, index) => (
                        <p key={index}>{msg}</p>
                    ))}
                </div>
            )}
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
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password1"
                        value={formData.password1}
                        onChange={handleChange}
                        required
                    />
                </p>
                <p>
                    <label>Confirm Password:</label>
                    <input
                        type="password"
                        name="password2"
                        value={formData.password2}
                        onChange={handleChange}
                        required
                    />
                </p>
                <p>
                    <label>College:</label>
                    <input
                        type="text"
                        name="college"
                        value={formData.college}
                        onChange={handleChange}
                        required
                    />
                </p>
                <p>
                    <label>Semester:</label>
                    <input
                        type="text"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        required
                    />
                </p>
                <p>
                    <label>Default Payment Method:</label>
                    <input
                        type="text"
                        name="default_payment_method"
                        value={formData.default_payment_method}
                        onChange={handleChange}
                        required
                    />
                </p>
                <button type="submit">Sign Up</button>
            </form>
            <p>
                Already have an account? <a href="/">Log in</a>
            </p>
            <p>
                After signing up, please check your email for the verification code. If you don't see the email, check your spam folder.
            </p>
        </div>
    );
};

export default Signup;