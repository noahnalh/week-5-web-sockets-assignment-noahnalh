import React, { useState } from "react";
import { useSocket } from "./socket/socket";
import ChatRoom from "./pages/ChatRoom";

const App = () => {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("global");

  // Pull everything we need from the socket hook
  const { connect, isConnected, users, joinRoom } = useSocket();

  // When user logs in: connect AND join the global room
  const handleLogin = () => {
    if (username.trim()) {
      connect(username);
      joinRoom(username, "global");
      setIsLoggedIn(true);
    }
  };

  // Handle switching between global and private chat
  const handleRoomJoin = (room) => {
    joinRoom(username, room);
    setCurrentRoom(room);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      {!isLoggedIn ? (
        <div>
          <h2>Enter Username</h2>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={handleLogin}>Join</button>
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
                  users.find((u) => u.id === currentRoom)?.username || "Private"
                }`}
          </h3>

          <div style={{ marginBottom: 10 }}>
            <button onClick={() => handleRoomJoin("global")}>
              🌐 Global Chat
            </button>
            {users
              .filter((u) => u.username !== username)
              .map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleRoomJoin(user.id)}
                  style={{ marginLeft: 5 }}
                >
                  💬 Chat with {user.username}
                </button>
              ))}
          </div>

          {/* Chat room UI */}
          <ChatRoom username={username} room={currentRoom} />
        </div>
      )}
    </div>
  );
};

export default App;
