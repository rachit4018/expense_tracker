import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config";

const Group = () => {
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

    const handleLogout = () => {
        navigate("/");
    };
    const handleSettlements = () => {
        navigate(`/settlements/${user.username}`, { state: { user: user } });
    };

    useEffect(() => {
        const fetchGroupDetails = async () => {
            try {
                const csrfToken = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("csrftoken="))
                    ?.split("=")[1];
                const token = localStorage.getItem("token");

                const response = await axios.get(`${BASE_URL}groups/api/${groupId}/`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "X-Username": username,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
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

        if (username) fetchGroupDetails();
    }, [groupId, username]);

    const handleAddMember = async () => {
        if (!selectedMember) {
            alert("Please select a member.");
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                `${BASE_URL}group/${groupId}/add_member/`,
                { username: selectedMember },
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "X-Username": username,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );

            if (response.data.success) {
                alert("Member added successfully!");
                window.location.reload();
            } else {
                alert("Member already exists in the group.");
            }
        } catch (error) {
            console.error("Error adding member:", error);
            setError("Failed to add member. Please try again.");
        }
    };

    if (loading) return <p className="text-center mt-10 text-lg text-gray-600">Loading group details...</p>;
    if (error) return <p className="text-red-600 text-center mt-10">{error}</p>;

    return (
        <div className="min-h-screen bg-pink-100">
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

            <div className="py-10 px-4">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Group Info */}
                    {groupDetails && (
                        <div className="bg-white rounded-lg shadow p-6 w-full">
                            <h1 className="text-2xl font-bold text-indigo-700 mb-4">Group Details</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <p><strong>Name:</strong> {groupDetails.name}</p>
                                <p><strong>Created By:</strong> {groupDetails.created_by}</p>
                            </div>

                            <div>
                                <h2 className="font-semibold text-lg mb-2">Members</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-gray-700">
                                    {groupDetails.members.map((member) => (
                                        <div
                                            key={member.username}
                                            className="bg-indigo-100 rounded px-3 py-2 text-center"
                                        >
                                            {member.username}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Expenses Section */}
                    <div className="bg-white rounded-lg shadow p-6 w-full">
                        <h2 className="text-xl font-semibold mb-4 text-indigo-700">Expenses</h2>
                        {expenses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {expenses.map((expense) => (
                                    <div
                                        key={expense.id}
                                        className="bg-gray-100 rounded-md p-4 text-gray-800"
                                    >
                                        <p><strong>Amount:</strong> ₹{expense.amount}</p>
                                        <p><strong>By:</strong> {expense.created_by}</p>
                                        <p><strong>Date:</strong> {expense.date}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No expenses found.</p>
                        )}
                    </div>

                    {/* Add Member Section */}
                    {groupDetails.created_by === username && (
                        <div className="bg-white rounded-lg shadow p-6 w-full">
                            <h2 className="text-xl font-semibold mb-4 text-indigo-700">Add Member</h2>
                            <div className="flex flex-col gap-4">
                                <select
                                    onChange={(e) => setSelectedMember(e.target.value)}
                                    className="border border-gray-300 rounded-md px-4 py-2 w-full focus:outline-none"
                                >
                                    <option value="">Select a member</option>
                                    {availableMembers.map((member) => (
                                        <option key={member.username} value={member.username}>
                                            {member.username}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    data-testid="add-member-button"
                                    onClick={handleAddMember}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md w-full"
                                >
                                    Add Member
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4 w-full">
                        <button
                            onClick={() => navigate(`/expense/${groupId}`, { state: { user } })}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md w-full sm:w-1/2"
                        >
                            ➕ Add Expense
                        </button>
                        <button
                            onClick={() => navigate("/home", { state: { user } })}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md w-full sm:w-1/2"
                        >
                            🏠 Go to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Group;
