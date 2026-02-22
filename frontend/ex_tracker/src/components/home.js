import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import BASE_URL from "../config";
import { useLocation, useNavigate } from "react-router-dom";

const Home = () => {
    const location = useLocation();
    const user = location.state?.user || {};
    const [groups, setGroups] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const fetchCSRFToken = async () => {
        try {
            await axios.get(`${BASE_URL}csrf/`, { withCredentials: true });
        } catch (error) {
            console.error("Failed to fetch CSRF token", error);
        }
    };

    const fetchUserGroups = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${BASE_URL}api/v1/groups/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "X-Username": user.username,
                    "Content-Type": "application/json",
                },
                withCredentials: true,
            });

            if (response.data.groups) {
                setGroups(response.data.groups);
            } else {
                setError("No groups found.");
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
            setError("Error fetching groups");
        }
    }, [user.username]);

    useEffect(() => {
        if (user.username) {
            fetchCSRFToken();
            fetchUserGroups();
        }
    }, [user.username, fetchUserGroups]);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${BASE_URL}api/v1/groups/create/`,
                { name: groupName, created_by: user.username },
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "X-Username": user.username,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );

            setGroupName("");
            alert("Group created successfully!");
            await fetchUserGroups();
            navigate("/home", { state: { user: user } });
        } catch (error) {
            console.error("Error creating group:", error);
            setError("Error creating group");
        }
    };

    const handleLogout = () => {
        navigate("/");
    };

    const handleSettlements = () => {
        navigate(`/settlements/${user.username}`, { state: { user: user } });
    };

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
                            data-testid="settlements-button"
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

            {/* Main Section */}
            <div className="flex justify-center items-start pt-10 px-4">
                <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg p-8 space-y-8">

                    {/* Greeting */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user.username}!</h2>
                        {error && <p className="text-red-600">{error}</p>}
                    </div>

                    {/* User Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 border rounded-md">
                            <p className="text-sm text-gray-500 mb-1">College</p>
                            <p className="font-semibold text-gray-700">{user.college}</p>
                        </div>
                        <div className="p-4 bg-gray-50 border rounded-md">
                            <p className="text-sm text-gray-500 mb-1">Semester</p>
                            <p className="font-semibold text-gray-700">{user.semester}</p>
                        </div>
                        <div className="p-4 bg-gray-50 border rounded-md">
                            <p className="text-sm text-gray-500 mb-1">Default Payment Method</p>
                            <p className="font-semibold text-gray-700">{user.default_payment_methods}</p>
                        </div>
                    </div>

                    {/* Group List */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Groups</h3>
                        {groups.length > 0 ? (
                            <ul className="space-y-2">
                                {groups.map((group) => (
                                    <li key={group.group_id}>
                                        <button
                                            onClick={() => navigate(`/groups/${group.group_id}`, { state: { user: user } })}
                                            className="w-full text-left px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-md text-blue-800 font-medium"
                                        >
                                            {group.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">You are not part of any groups yet.</p>
                        )}
                    </div>

                    {/* Group Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Create Group */}
                        <div className="bg-gray-50 p-4 border rounded-md">
                            <h3 className="text-lg font-semibold mb-2 text-gray-700">Create New Group</h3>
                            <form onSubmit={handleCreateGroup} className="flex flex-col space-y-3">
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Enter group name"
                                    className="border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                />
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md">
                                    Create Group
                                </button>
                            </form>
                        </div>

                        {/* Settlements */}
                        <div className="bg-gray-50 p-4 border rounded-md flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-700">Manage Settlements</h3>
                                <p className="text-sm text-gray-600 mb-4">Settle balances among group members.</p>
                            </div>
                            <button
                                onClick={handleSettlements}
                                className="mt-auto bg-green-500 hover:bg-green-600 text-white py-2 rounded-md"
                            >
                                Go to Settlements
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
