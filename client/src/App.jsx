import React, { useState } from "react";
import { useSocket } from "./socket/socket";
import ChatRoom from "./pages/ChatRoom";

const App = () => {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { connect, isConnected, users, joinRoom, unreadCounts, currentRoom } =
    useSocket();

  const handleLogin = () => {
    if (!username.trim()) return;
    connect(username);
    joinRoom(username, "global");
    setIsLoggedIn(true);
  };

  const handleRoomJoin = (room) => {
    joinRoom(username, room);
  };

  const pageStyle = {
    backgroundColor: darkMode ? "#121212" : "#f4f4f4",
    color: darkMode ? "#f0f0f0" : "#000",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  };

  const layoutStyle = {
    display: "flex",
    flex: 1,
    flexDirection: "row",
    minHeight: "90vh",
  };

  const sidebarStyle = {
    width: 200,
    padding: 10,
    borderRight: darkMode ? "1px solid #333" : "1px solid #ccc",
    background: darkMode ? "#1a1a1a" : "#fafafa",
  };

  const chatContainerStyle = {
    flex: 1,
    padding: 10,
  };

  const buttonStyle = (active) => ({
    display: "block",
    marginBottom: 8,
    width: "100%",
    textAlign: "left",
    padding: 8,
    borderRadius: 4,
    background: active
      ? darkMode
        ? "#333"
        : "#e0e0e0"
      : darkMode
      ? "#222"
      : "#fff",
    color: darkMode ? "#fff" : "#000",
    border: "1px solid #ccc",
    cursor: "pointer",
  });

  return (
    <div style={pageStyle}>
      <div style={{ padding: 10 }}>
        <button
          onClick={() => setDarkMode((d) => !d)}
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

        {/* 🔌 Reconnection Banner */}
        {!isConnected && (
          <div
            style={{
              background: "#ffcccc",
              color: "#900",
              padding: "8px 12px",
              borderRadius: 5,
              fontWeight: "bold",
              marginTop: 10,
              display: "inline-block",
            }}
          >
            🔌 Reconnecting to server...
          </div>
        )}
      </div>

      {!isLoggedIn ? (
        <div style={{ padding: 20 }}>
          <h2>Enter Username</h2>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: 6 }}
            placeholder="Your username"
          />
          <button onClick={handleLogin} style={{ marginLeft: 10, padding: 6 }}>
            Join
          </button>
        </div>
      ) : (
        <div style={layoutStyle}>
          {/* Sidebar */}
          <div style={sidebarStyle}>
            <h3>Rooms</h3>

            {/* Global room */}
            <button
              style={buttonStyle(currentRoom === "global")}
              onClick={() => handleRoomJoin("global")}
            >
              🌐 Global Chat{" "}
              {unreadCounts["global"] > 0 && (
                <span style={{ color: "red" }}>({unreadCounts["global"]})</span>
              )}
            </button>

            {/* Private rooms - each user except self */}
            {users
              .filter((u) => u.username !== username)
              .map((user) => {
                const roomId = [username, user.username].sort().join("_");
                return (
                  <button
                    key={user.id}
                    onClick={() => handleRoomJoin(roomId)}
                    style={buttonStyle(currentRoom === roomId)}
                  >
                    💬 {user.username}{" "}
                    {unreadCounts[roomId] > 0 && (
                      <span style={{ color: "red" }}>
                        ({unreadCounts[roomId]})
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Chat area */}
          <div style={chatContainerStyle}>
            <h2>Welcome, {username}</h2>
            <p>Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</p>
            <h3>
              Current Room:{" "}
              {currentRoom === "global"
                ? "🌐 Global Chat"
                : `💬 Chat with ${currentRoom
                    .replace(username, "")
                    .replace("_", "")
                    .trim()}`}
            </h3>

            <ChatRoom
              username={username}
              room={currentRoom}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
