// src/pages/ChatRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../socket/socket";

const ChatRoom = ({ username, room, darkMode }) => {
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
          style={{ color: darkMode ? "#90cdf4" : "#0366d6" }}
        >
          {msg.message.split("/").pop()}
        </a>
      ) : (
        msg.message
      );
    } else {
      return JSON.stringify(msg.message);
    }
  };

  const containerStyle = {
    backgroundColor: darkMode ? "#121212" : "#f4f4f4",
    color: darkMode ? "#e0e0e0" : "#000",
    minHeight: "100vh",
    padding: 10,
    display: "flex",
    justifyContent: "center",
  };

  const chatBoxStyle = {
    backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: 10,
    width: "100%",
    maxWidth: 600,
    display: "flex",
    flexDirection: "column",
    height: "90vh",
  };

  const messageAreaStyle = {
    flex: 1,
    overflowY: "auto",
    marginBottom: 10,
    padding: 5,
  };

  const inputAreaStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
  };

  const buttonStyle = {
    padding: "8px 14px",
    borderRadius: 4,
    border: "none",
    cursor: "pointer",
    backgroundColor: uploading ? "#999" : "#007bff",
    color: "#fff",
    fontWeight: "bold",
    transition: "background-color 0.3s",
  };

  return (
    <div style={containerStyle}>
      <div style={chatBoxStyle}>
        <div style={messageAreaStyle}>
          {messages
            .filter((msg) => msg.room === room || msg.isPrivate)
            .map((msg, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                {msg.system ? (
                  <em>{msg.message}</em>
                ) : (
                  <p style={{ margin: 0 }}>
                    <strong>{msg.sender}:</strong> {renderMessage(msg)} ·{" "}
                    <small>
                      {msg.readBy?.length}/{users.length} read
                    </small>
                  </p>
                )}
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>

        {typingUsers.length > 0 && (
          <p style={{ fontStyle: "italic", marginBottom: 5 }}>
            {typingUsers.join(", ")} is typing...
          </p>
        )}

        <div style={inputAreaStyle}>
          <input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setTyping(true);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message"
            style={{
              flex: "1 1 60%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleSend} disabled={uploading} style={buttonStyle}>
            {uploading ? "Uploading..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
