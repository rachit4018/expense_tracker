import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config"; // Assuming you have a config file for the base URL

const Group = () => {
    //const { groupId } = useParams(); // Get groupId from the URL
    const groupId = parseInt(useParams().groupId, 10);
    const navigate = useNavigate();
    const location = useLocation();
    const user = location.state?.user || {};
    const username = user.username;
    const [groupDetails, setGroupDetails] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState("");

    // Fetch group details, expenses, and available members
    useEffect(() => {
        const fetchGroupDetails = async () => {
            try {
                // Fetch CSRF token from cookies
                const csrfToken = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("csrftoken="))
                    ?.split("=")[1];

                // Fetch authorization token from localStorage
                const token = localStorage.getItem("token");

                if (!token) {
                    console.error("Authorization token not found in localStorage.");
                    setError("Authorization token not found.");
                    return;
                }

                // Debugging: Log tokens and headers
                // Make the API request
                const response = await axios.get(`${BASE_URL}groups/api/${groupId}/`, {
                    headers: {
                        "Authorization": `Token ${token}`,
                        "X-Username": username,
                        "X-CSRFToken": csrfToken,
                        "Content-Type": "application/json",
                    }, withCredentials: true,
                });

                if (response.data) {
                    setGroupDetails(response.data.group);
                    setExpenses(response.data.expenses);
                    setAvailableMembers(response.data.available_members);
                } else {
                    setError("No data found.");
                }
            } catch (error) {
                console.error("Error fetching group details:", error);
                setError("Error fetching group details.");
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchGroupDetails();
        }
    }, [groupId, username]);

    // Handle adding a member to the group
    const handleAddMember = async (selectedMember) => {
        if (!selectedMember) {
            alert("Please select a valid member.");
            return;
        }

        try {
            const response = await axios.post(
                `${BASE_URL}group/${groupId}/add_member/`,
                { username: selectedMember },
                {
                    headers: {
                        "X-Username": username,
                        "X-CSRFToken": document.cookie
                            .split("; ")
                            .find((row) => row.startsWith("csrftoken="))
                            ?.split("=")[1],
                    },
                }
            );

            if (response.data.success) {
                alert("Member added successfully!");
                window.location.reload(); // Reload the page to fetch updated details
            } else {
                setError("Failed to add member.");
            }
        } catch (error) {
            console.error("Error adding member:", error);
            setError("Failed to add member. Please try again.");
        }
    };

    if (loading) {
        return <p>Loading group details...</p>;
    }

    if (error) {
        return <p style={{ color: "red" }}>{error}</p>;
    }

    return (
        <div>
            <h1>Group Details</h1>
            {groupDetails ? (
                <div id="group-details">
                    <p>
                        <strong>Group Name:</strong> {groupDetails.name}
                    </p>
                    <p>
                        <strong>Created By:</strong> {groupDetails.created_by}
                    </p>
                    <p>
                        <strong>Members:</strong>
                    </p>
                    <ul>
                        {groupDetails.members.map((member) => (
                            <li key={member.username}>{member.username}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p>No group details found.</p>
            )}

            <h2>Expenses</h2>
            <ul id="expenses">
                {expenses.length > 0 ? (
                    expenses.map((expense) => (
                        <li key={expense.id}>
                            Amount: {expense.amount}, Created by: {expense.created_by}, Created On:{" "}
                            {expense.date}
                        </li>
                    ))
                ) : (
                    <li>No expenses found.</li>
                )}
            </ul>

            {/* Show "Add Members" section only if the current user is the group creator */}
            {groupDetails && groupDetails.created_by === username && (
                <div id="add-member-section">
                    <h2>Add Members</h2>
                    <select
                        id="available-members"
                        onChange={(e) => setSelectedMember(e.target.value)}
                    >
                        <option value="">Select a member</option>
                        {availableMembers.map((member) => (
                            <option key={member.username} value={member.username}>
                                {member.username}
                            </option>
                        ))}
                    </select>
                    <button onClick={() => handleAddMember(selectedMember)}>Add Member</button>
                </div>
            )}

            <br />
            {/* Add Expense Button */}
            <button id="add-expense-button">
                <a href={`${BASE_URL}add_expense/${groupId}/`}>Add Expense</a>
            </button>
            <br />
            <br />
            {/* Home Button */}
            <button id="home-button" onClick={() => navigate("/home", { state: { user: user } })}>
                Home
            </button>
        </div>
    );
};

export default Group;