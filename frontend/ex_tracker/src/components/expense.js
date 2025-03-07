import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config"; // Assuming you have a config file for the base URL

const Expense = () => {
    const groupId = parseInt(useParams().groupId, 10);
    const navigate = useNavigate();
    const location = useLocation();
    const user = location.state?.user || {};
    const username = user.username;
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState("");
    const [formData, setFormData] = useState({
        amount: "",
        category: "",
        split_type: "equal",
        date: new Date().toISOString().split("T")[0],
        receipt_image: null,
        created_by: username,
        groupid: groupId,
    });

    // Fetch categories when the component mounts
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${BASE_URL}expense/add/${groupId}`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                });

                if (response.data && response.data.categories) {
                    setCategories(response.data.categories);
                } else {
                    setError("No categories found.");
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                setError("Error fetching categories.");
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "receipt_image") {
            setFormData({ ...formData, [name]: files[0] }); // Handle file input
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const csrfToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("csrftoken="))
            ?.split("=")[1];

        const data = new FormData();
        data.append("amount", formData.amount);
        data.append("category", formData.category);
        data.append("split_type", formData.split_type);
        data.append("date", formData.date);
        data.append("created_by", formData.created_by);
        data.append("group_id", formData.groupid);
        if (formData.receipt_image) {
            data.append("receipt_image", formData.receipt_image);
        }

        try {
            const response = await axios.post(
                `${BASE_URL}expense/add_expense_api/${groupId}`,
                data,
                {
                    headers: {
                        "X-CSRFToken": csrfToken,
                        "Content-Type": "multipart/form-data",
                    },
                    withCredentials: true,
                }
            );

            if (response.status === 201) {
                setMessage("Expense added successfully!");
                alert("Expense added successfully!");
                navigate(`/groups/${groupId}`,{ state: { user: user } }); // Redirect to the group details page
            } else {
                setError(response.data.error || "Failed to add expense.");
            }
        } catch (error) {
            console.error("Error adding expense:", error);
            setError("Failed to add expense. Please try again.");
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
            <h1>Add Expense to Group</h1>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {message && <p style={{ color: "green" }}>{message}</p>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {/* Amount Field */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label htmlFor="amount">Amount:</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="Enter expense amount"
                        step="0.01"
                        required
                        style={{ padding: "8px", fontSize: "16px" }}
                    />
                </div>

                {/* Category Field */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label htmlFor="category">Category:</label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        style={{ padding: "8px", fontSize: "16px" }}
                    >
                        <option value="" disabled>
                            Select a category
                        </option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Split Type Field */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label htmlFor="split_type">Split Type:</label>
                    <select
                        id="split_type"
                        name="split_type"
                        value={formData.split_type}
                        onChange={handleChange}
                        required
                        style={{ padding: "8px", fontSize: "16px" }}
                    >
                        <option value="equal">Equal</option>
                    </select>
                </div>

                {/* Date Field */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label htmlFor="date">Date:</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        style={{ padding: "8px", fontSize: "16px" }}
                    />
                </div>

                {/* Receipt Image Field */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label htmlFor="receipt_image">Receipt Image:</label>
                    <input
                        type="file"
                        id="receipt_image"
                        name="receipt_image"
                        onChange={handleChange}
                        style={{ padding: "8px", fontSize: "16px" }}
                    />
                </div>

                {/* Submit Button */}
                <div>
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
                        Add Expense
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Expense;