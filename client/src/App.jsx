import React, { useState } from "react";
import { useSocket } from "./socket/socket";
import ChatRoom from "./pages/ChatRoom";

const App = () => {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("global");
  const [darkMode, setDarkMode] = useState(false);

  const {
    connect,
    isConnected,
    users,
    joinRoom,
    unreadCounts, // ✅ pull in unread count
  } = useSocket();

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
  };

  return (
    <div style={pageStyle}>
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

            <div style={{ marginBottom: 10 }}>
              {/* Global Room Button */}
              <button onClick={() => handleRoomJoin("global")}>
                🌐 Global Chat{" "}
                {unreadCounts["global"] > 0 && (
                  <span style={{ color: "red" }}>
                    ({unreadCounts["global"]})
                  </span>
                )}
              </button>

              {/* Private Chat Buttons */}
              {users
                .filter((u) => u.username !== username)
                .map((user) => {
                  const roomKey = [username, user.username].sort().join("_");

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleRoomJoin(roomKey)}
                      style={{ marginLeft: 5 }}
                    >
                      💬 Chat with {user.username}{" "}
                      {unreadCounts[roomKey] > 0 && (
                        <span style={{ color: "red" }}>
                          ({unreadCounts[roomKey]})
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>

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
