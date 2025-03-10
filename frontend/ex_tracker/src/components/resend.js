import React, { useState } from "react";
import axios from "axios";
import BASE_URL from "../config";
import { useNavigate } from "react-router-dom"; // Assuming you have a config file for the base URL

const ResendCode = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const Navigate = useNavigate();


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const csrfToken = document.cookie
                .split("; ")
            const response = await axios.post(
                `${BASE_URL}resend_code/`,
                { email },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken.find((row) => row.startsWith("csrftoken="))?.split("=")[1],  // Extract CSRF token
                    },
                    withCredentials: true,
                }
            );

            if (response.data.message) {
                setMessage(response.data.message);
                Navigate("/verifycode");
                setError("");
            }
        } catch (error) {
            if (error.response) {
                setError(error.response.data.error || "An error occurred.");
            } else {
                setError("An error occurred. Please try again.");
            }
            setMessage("");
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
            <h1>Resend Verification Code</h1>
            {message && <p style={{ color: "green" }}>{message}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: "8px", fontSize: "16px" }}
                    />
                </div>

                <button
                    type="submit"
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "16px",
                    }}
                >
                    Resend Code
                </button>
            </form>
        </div>
    );
};

export default ResendCode;