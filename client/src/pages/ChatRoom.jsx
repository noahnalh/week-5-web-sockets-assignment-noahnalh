// src/pages/ChatRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../socket/socket";

const ChatRoom = ({ username, room }) => {
  const {
    messages,
    sendMessage,
    typingUsers,
    users,
    joinRoom,
    setTyping,
    markMessageAsRead,
  } = useSocket();

  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef();

  // ✅ Background colors per room
  const getRoomBackground = (roomName) => {
    const themes = {
      global: "#f0f8ff", // light blue
      room1: "#fff8dc", // cornsilk
      room2: "#f5f5f5", // light gray
      room3: "#e6ffe6", // mint green
    };
    if (themes[roomName]) return themes[roomName];
    if (roomName.includes("-")) return "#f9f0ff"; // private room
    return "#ffffff"; // fallback
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (username && room) {
      joinRoom(username, room);
    }
  }, [room, username]);

  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.room === room && !msg.readBy?.includes(username)) {
        markMessageAsRead(msg.id);
      }
    });
  }, [messages, room]);

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) return;

    let finalMessage = message;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        setUploading(true);
        const res = await fetch("http://localhost:5000/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data?.fileUrl) {
          finalMessage = `http://localhost:5000${data.fileUrl}`;
        }
      } catch (err) {
        console.error("Upload failed", err);
        return;
      } finally {
        setUploading(false);
        setSelectedFile(null);
      }
    }

    sendMessage(finalMessage, room);
    setMessage("");
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const renderMessage = (msg) => {
    if (typeof msg.message === "string") {
      const isFileLink = msg.message.startsWith(
        "http://localhost:5000/uploads/"
      );
      return isFileLink ? (
        <a
          href={msg.message}
          target="_blank"
          rel="noreferrer"
          style={{ wordBreak: "break-all", color: "#007bff" }}
        >
          {msg.message.split("/").pop()}
        </a>
      ) : (
        <span style={{ wordBreak: "break-word" }}>{msg.message}</span>
      );
    } else {
      return JSON.stringify(msg.message);
    }
  };

  return (
    <div
      style={{
        backgroundColor: getRoomBackground(room),
        minHeight: "100vh",
        padding: 20,
      }}
    >
      {/* Chat box */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 5,
          padding: 10,
          height: 300,
          overflowY: "auto",
          backgroundColor: "#fff",
        }}
      >
        {messages
          .filter((msg) => msg.room === room || msg.isPrivate)
          .map((msg, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              {msg.system ? (
                <em>{msg.message}</em>
              ) : (
                <p style={{ margin: 0 }}>
                  <strong>{msg.sender}:</strong> {renderMessage(msg)} <br />
                  <small>
                    {msg.readBy?.length}/{users.length} read
                  </small>
                </p>
              )}
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing status */}
      {typingUsers.length > 0 && (
        <p style={{ fontStyle: "italic", marginTop: 8 }}>
          {typingUsers.join(", ")} is typing...
        </p>
      )}

      {/* Message input */}
      <div style={{ marginTop: 10, display: "flex", gap: 5 }}>
        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setTyping(true);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message"
          style={{ flex: 1, padding: 8 }}
        />
        <input type="file" onChange={handleFileChange} style={{ flex: 1 }} />
        <button
          onClick={handleSend}
          disabled={uploading}
          style={{
            padding: "0 12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            cursor: uploading ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
