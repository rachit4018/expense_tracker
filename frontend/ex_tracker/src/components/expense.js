import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config";

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
    group_id: groupId,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized access.");
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${BASE_URL}expense/add/${groupId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        if (Array.isArray(response.data?.categories)) {
          setCategories(response.data.categories);
        } else {
          setError("No categories found.");
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Error fetching categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [groupId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "receipt_image" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "receipt_image" && !value) return; // Skip empty file
      data.append(key === "groupid" ? "group_id" : key, value);
    });

    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        `${BASE_URL}expense/add_expense_api/${groupId}`,
        data,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        setMessage("Expense added successfully!");
        setTimeout(() => {
          navigate(`/groups/${groupId}`, { state: { user } });
        }, 1000);
      } else {
        setError(response.data.error || "Failed to add expense.");
      }
    } catch (err) {
      console.error("Error adding expense:", err);
      setError(err.response?.data?.error || "Failed to add expense. Please try again.");
    }
  };

  const handleLogout = () => navigate("/");
  const handleSettlements = () => navigate(`/settlements/${user.username}`, { state: { user } });

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-pink-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => navigate("/home", { state: { user } })} className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-700">💸 Expense Tracker</h1>
          </button>
          <div className="flex space-x-4">
            <button onClick={handleSettlements} className="text-indigo-700 hover:underline font-medium">Settlements</button>
            <button onClick={handleLogout} className="text-indigo-700 hover:underline font-medium">Logout</button>
          </div>
        </div>
      </nav>

      {/* Form Section */}
      <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Expense to Group</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {message && <p className="text-green-600 mb-4">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label htmlFor='amount' className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              id="amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter amount"
              step="0.01"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor='category' className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="" disabled>Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Split Type */}
          <div>
            <label htmlFor='split_type' data-testid="split_type" className="block text-sm font-medium text-gray-700 mb-1">Split Type</label>
            <select
              id="split_type"
              name="split_type"
              value={formData.split_type}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="equal">Equal</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor='date' className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              id="date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Receipt Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Image (optional)</label>
            <input
              type="file"
              name="receipt_image"
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md"
            />
          </div>

          {/* Submit Button */}
          <div className="text-right">
            <button
              data-testid="add-expense-button"
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Expense;
