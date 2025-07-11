// src/App.jsx
import React, { useState } from "react";
import { useSocket } from "./socket/socket";
import ChatRoom from "./pages/ChatRoom";
import Sidebar from "./components/Sidebar";

const App = () => {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("global");
  const [darkMode, setDarkMode] = useState(false);

  const { connect, isConnected, users, joinRoom, unreadCounts } = useSocket();

  const handleLogin = () => {
    if (username.trim()) {
      connect(username);
      joinRoom(username, "global");
      setIsLoggedIn(true);
    }
  };

  const handleRoomJoin = (room) => {
    joinRoom(username, room);
    setCurrentRoom(room);
  };

  const pageStyle = {
    backgroundColor: darkMode ? "#121212" : "#f4f4f4",
    color: darkMode ? "#f0f0f0" : "#000",
    minHeight: "100vh",
    padding: 20,
    paddingLeft: isLoggedIn ? 260 : 20, // Account for sidebar
  };

  return (
    <div style={pageStyle}>
      {isLoggedIn && (
        <Sidebar
          users={users}
          username={username}
          currentRoom={currentRoom}
          onRoomSelect={handleRoomJoin}
        />
      )}

      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button
          onClick={() => setDarkMode((prev) => !prev)}
          style={{
            marginBottom: 10,
            padding: "5px 10px",
            border: "1px solid",
            borderRadius: 5,
            cursor: "pointer",
            backgroundColor: darkMode ? "#333" : "#ddd",
            color: darkMode ? "#f0f0f0" : "#000",
          }}
        >
          {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>

        {!isLoggedIn ? (
          <div>
            <h2>Enter Username</h2>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={handleLogin} style={{ marginLeft: 10 }}>
              Join
            </button>
          </div>
        ) : (
          <div>
            <h2>Welcome, {username}</h2>
            <p>Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</p>

            <h3>
              Current Room:{" "}
              {currentRoom === "global"
                ? "🌐 Global Chat"
                : `💬 Chat with ${
                    users.find((u) => u.id === currentRoom)?.username ||
                    "Private"
                  }`}
            </h3>

            <ChatRoom
              username={username}
              room={currentRoom}
              darkMode={darkMode}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
