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

    // Fetch CSRF Token
    const fetchCSRFToken = async () => {
        try {
            await axios.get(`${BASE_URL}csrf/`, { withCredentials: true });
        } catch (error) {
            console.error("Failed to fetch CSRF token", error);
        }
    };

    // Fetch User Groups (memoized with useCallback)
    const fetchUserGroups = useCallback(async () => {
        try {
            const csrfToken = document.cookie
                .split("; ")
                .find((row) => row.startsWith("csrftoken="))
                ?.split("=")[1];
    
            const token = localStorage.getItem("token"); // Get the token from local storage
    
            const response = await axios.get(`${BASE_URL}api/groups/`, {
                headers: {
                    "Authorization": `Token ${token}`, // Include the token in the headers
                    "X-Username": user.username,
                    "X-CSRFToken": csrfToken,
                    "Content-Type": "application/json",
                },
                withCredentials: true,
            });
    
            if (response.data.groups) {
                setGroups(response.data.groups); // Set groups in state
            } else {
                setError("No groups found.");
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
            setError("Error fetching groups");
        }
    }, [user.username]); // Add user.username as a dependency

    // Fetch user groups when the component mounts or user changes
    useEffect(() => {
        if (user.username) {
            fetchCSRFToken();
            fetchUserGroups();
        }
    }, [user.username, fetchUserGroups]); // Add fetchUserGroups to the dependency array

    // Handle Group Creation
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const csrfToken = document.cookie
                .split("; ")
                .find((row) => row.startsWith("csrftoken="))
                ?.split("=")[1];

            await axios.post(
                `${BASE_URL}api/groups/create/`,
                { group_name: groupName },
                {
                    headers: {
                        "X-Username": user.username,
                        "X-CSRFToken": csrfToken,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );

            setGroupName(""); // Clear the input field
            alert("Group created successfully!");

            // Refresh the list of groups after creation
            await fetchUserGroups();
        } catch (error) {
            console.error("Error creating group:", error);
            setError("Error creating group");
        }
    };

    // Handle Logout
    const handleLogout = async () => {
        try{
            navigate("/");
        } catch (error) {
            console.error("Logout failed:", error);
            setError("Logout failed");
        }
    };

    return (
        <div>
            <h1>Welcome, {user.username}!</h1>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <p>College: {user.college}</p>
            <p>Semester: {user.semester}</p>
            <p>Default Payment Method: {user.default_payment_methods}</p>

            <h2>Your Groups</h2>
            <ul>
                {groups.length > 0 ? (
                    groups.map((group) => (
                        <li key={group.group_id}>
                          <a href={`/groups/${group.group_id}`} // Valid href
                onClick={(e) => {
                    e.preventDefault(); // Prevent default navigation
                    navigate(`/groups/${group.group_id}`,{ state: { user: user}}); 
                            }}
                            >
                                {group.name}</a>
                        </li>
                    ))
                ) : (
                    <li>You are not part of any groups yet.</li>
                )}
            </ul>

            <h2>Create a New Group</h2>
            <form onSubmit={handleCreateGroup}>
                <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    required
                />
                <button type="submit">Create Group</button>
            </form>

            <h2>Settlement</h2>
            <a href={`${BASE_URL}/settlements/${user.username}/`}>
                <button>Go to Settlement</button>
            </a>

            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default Home;