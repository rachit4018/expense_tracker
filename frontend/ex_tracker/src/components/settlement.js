import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../config"; // Assuming you have a config file for the base URL\
import { useLocation, useNavigate } from "react-router-dom";

const Settlements = () => {
    const location = useLocation();
    const user = location.state?.user || {};
    const [settlements, setSettlements] = useState([]);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1];

    // Fetch settlements data when the component mounts
    useEffect(() => {
        const fetchSettlements = async () => {
            try {
                const response = await axios.get(`${BASE_URL}settlements/${user.username}/`, {
                    headers: {
                        "X-CSRFToken": csrfToken,
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

        fetchSettlements();
    }, [csrfToken]);

    // Handle marking a settlement as completed
    const handleMarkCompleted = async (settlementId) => {
        try {
            const response = await axios.patch(
                `${BASE_URL}settlements/api/${settlementId}/`,
                { payment_status: "Completed" },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken,
                        "X-Username": user.username,
                    },
                    withCredentials: true,
                }
            );

            if (response.status === 200) {
                // Update the settlement status in the state
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

    return (
        <div>
            <h1>Your Settlements</h1>
            {message && <p className="message">{message}</p>}
            {error && <p className="error">{error}</p>}

            <table>
                <thead>
                    <tr>
                        <th>Group</th>
                        <th>Amount</th>
                        <th>Payment Status</th>
                        <th>Settlement Method</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {settlements.length > 0 ? (
                        settlements.map((settlement) => (
                            <tr key={settlement.id}>
                                <td>{settlement.group_name}</td>
                                <td>{settlement.amount}</td>
                                <td id={`status-${settlement.id}`}>{settlement.payment_status}</td>
                                <td>{settlement.settlement_method || "Not Specified"}</td>
                                <td>{settlement.due_date}</td>
                                <td>
                                    {settlement.payment_status === "Pending" ? (
                                        <button
                                            className="mark-completed"
                                            onClick={() => handleMarkCompleted(settlement.id)}
                                        >
                                            Mark as Completed
                                        </button>
                                    ) : (
                                        "Completed"
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: "center" }}>
                                No settlements found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Settlements;