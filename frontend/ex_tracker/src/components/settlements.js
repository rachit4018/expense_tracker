import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../config";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const Settlements = () => {
    const location = useLocation();
    const user = location.state?.user || {};
    const navigate = useNavigate();
    const [settlements, setSettlements] = useState([]);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [csrfToken, setCsrfToken] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: "group_name",  // Default sort by group_name
        direction: "asc",   // Default sort direction
    });

    // Fetch CSRF Token (only once when the component mounts)
    useEffect(() => {
        const fetchCSRFToken = async () => {
            try {
                const response = await axios.get(`${BASE_URL}csrf/`, { withCredentials: true });
                const csrfToken = response.headers["x-csrftoken"] || response.data.csrfToken;
                setCsrfToken(csrfToken);
            } catch (error) {
                console.error("Failed to fetch CSRF token", error);
            }
        };

        fetchCSRFToken();
    }, []);

    // Fetch settlements data when the component mounts or when user.username changes
    useEffect(() => {
        const fetchSettlements = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    setError("Authorization token not found.");
                    return;
                }

                const response = await axios.get(`${BASE_URL}settlements/${user.username}/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "X-Username": user.username,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                });

                if (response.data) {
                    setSettlements(response.data.settlements);
                } else {
                    setError("No settlements found.");
                }
            } catch (error) {
                console.error("Error fetching settlements:", error);
                setError("Error fetching settlements.");
            }
        };

        if (user.username) {
            fetchSettlements();
        }
    }, [user.username]);

    // Handle sorting by column
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sortedSettlements = [...settlements].sort((a, b) => {
            if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
            if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
            return 0;
        });

        setSettlements(sortedSettlements);
    };

    const handleMarkCompleted = async (settlementId) => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("Authorization token not found.");
                return;
            }

            const response = await axios.patch(
                `${BASE_URL}settlements/api/${settlementId}/`,
                { payment_status: "Completed" },
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "X-Username": user.username,
                    },
                    withCredentials: true,
                }
            );

            if (response.status === 200) {
                setSettlements((prevSettlements) =>
                    prevSettlements.map((settlement) =>
                        settlement.id === settlementId
                            ? { ...settlement, payment_status: "Completed" }
                            : settlement
                    )
                );
                setMessage("Payment status updated successfully!");
            } else {
                setError(response.data.error || "Failed to update payment status.");
            }
        } catch (error) {
            console.error("Error updating payment status:", error);
            setError("Failed to update payment status. Please try again.");
        }
    };
    const handleLogout = () => {
        navigate("/");
    };
    const handleSettlements = () => {
        navigate(`/settlements/${user.username}`, { state: { user: user } });
    };

    return (
        <div className="min-h-screen bg-pink-50">
            {/* Navbar */}
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <button onClick={() => navigate("/home", { state: { user } })} className="flex items-center">
                    <h1 className="text-2xl font-bold text-indigo-700">💸 Expense Tracker</h1>
                    </button>
                    <div className="flex space-x-4">
                        <button
                            onClick={handleSettlements}
                            className="text-indigo-700 hover:underline font-medium"
                        >
                            Settlements
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-indigo-700 hover:underline font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">Your Settlements</h2>

                {message && <p className="text-green-600 mb-4">{message}</p>}
                {error && <p className="text-red-600 mb-4">{error}</p>}

                // ✅ Inside the return JSX: wrap the table in a container with a test id
<div
  className="overflow-x-auto bg-white shadow-lg rounded-lg"
  data-testid="settlements-table"
>
  <table className="min-w-full table-auto">
    <thead className="bg-indigo-600 text-white">
      <tr>
        <th
          className="px-6 py-3 text-left cursor-pointer"
          onClick={() => handleSort("group_name")}
          data-testid="sort-group"
        >
          Group
          {sortConfig.key === "group_name" && (
            <span>{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
          )}
        </th>
        <th
          className="px-6 py-3 text-left cursor-pointer"
          onClick={() => handleSort("amount")}
          data-testid="sort-amount"
        >
          Amount
          {sortConfig.key === "amount" && (
            <span>{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
          )}
        </th>
        <th
          className="px-6 py-3 text-left cursor-pointer"
          onClick={() => handleSort("payment_status")}
          data-testid="sort-status"
        >
          Payment Status
          {sortConfig.key === "payment_status" && (
            <span>{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
          )}
        </th>
        <th
          className="px-6 py-3 text-left cursor-pointer"
          onClick={() => handleSort("settlement_method")}
          data-testid="sort-method"
        >
          Settlement Method
          {sortConfig.key === "settlement_method" && (
            <span>{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
          )}
        </th>
        <th
          className="px-6 py-3 text-left cursor-pointer"
          onClick={() => handleSort("due_date")}
          data-testid="sort-due-date"
        >
          Due Date
          {sortConfig.key === "due_date" && (
            <span>{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
          )}
        </th>
        <th
          className="px-6 py-3 text-left cursor-pointer"
          onClick={() => handleSort("settlement_date")}
          data-testid="sort-settlement-date"
        >
          Settlement Date
          {sortConfig.key === "settlement_date" && (
            <span>{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
          )}
        </th>
        <th className="px-6 py-3 text-left">Actions</th>
      </tr>
    </thead>
    <tbody data-testid="settlements-body">
      {settlements.length > 0 ? (
        settlements.map((settlement) => (
          <tr
            key={settlement.id}
            className="border-b"
            data-testid={`settlement-row-${settlement.id}`}
          >
            <td className="px-6 py-4">{settlement.group_name}</td>
            <td className="px-6 py-4">{settlement.amount}</td>
            <td className="px-6 py-4">{settlement.payment_status}</td>
            <td className="px-6 py-4">
              {settlement.settlement_method || "Not Specified"}
            </td>
            <td className="px-6 py-4">{settlement.due_date}</td>
            <td className="px-6 py-4">{settlement.settlement_date}</td>
            <td className="px-6 py-4">
              {settlement.payment_status === "Pending" ? (
                <button
                  onClick={() => handleMarkCompleted(settlement.id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  data-testid={`complete-button-${settlement.id}`}
                >
                  Mark as Completed
                </button>
              ) : (
                <span
                  className="text-green-600 font-semibold"
                  data-testid="completed-status"
                >
                  Completed
                </span>
              )}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td
            colSpan="7"
            className="text-center py-4 text-gray-500"
            data-testid="no-settlements"
          >
            No settlements found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

            </div>
        </div>
    );
};

export default Settlements;
