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
  const messagesEndRef = useRef();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Join room on mount/change
  useEffect(() => {
    if (username && room) {
      joinRoom(username, room);
    }
  }, [room, username]);

  // Mark unread messages as read
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
        const res = await fetch("http://localhost:5000/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data?.fileUrl) {
          finalMessage = {
            type: "file",
            url: data.fileUrl.startsWith("/")
              ? `http://localhost:5000${data.fileUrl}`
              : data.fileUrl,
            name: selectedFile.name,
          };
        }
      } catch (err) {
        console.error("Upload failed", err);
        return;
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

  const renderMessageContent = (msg) => {
    const { message } = msg;

    // File message
    if (typeof message === "object" && message.type === "file") {
      const { url, name } = message;
      const isImage = /\.(png|jpe?g|gif|bmp|webp)$/i.test(name);
      return isImage ? (
        <div>
          <img
            src={url}
            alt={name}
            style={{ maxWidth: "200px", borderRadius: "6px", marginTop: "4px" }}
          />
          <div>
            <small>{name}</small>
          </div>
        </div>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer">
          📎 {name}
        </a>
      );
    }

    // Regular text message
    return <span>{message}</span>;
  };

  return (
    <div style={{ padding: "20px", maxWidth: 800, margin: "0 auto" }}>
      <div
        style={{
          border: "1px solid #ccc",
          padding: 10,
          height: 300,
          overflowY: "auto",
          borderRadius: 6,
          background: "#fafafa",
        }}
      >
        {messages
          .filter((msg) => msg.room === room || msg.isPrivate)
          .map((msg, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              {msg.system ? (
                <em>{msg.message}</em>
              ) : (
                <p style={{ margin: 0 }}>
                  <strong>{msg.sender}:</strong> {renderMessageContent(msg)}
                  <br />
                  <small style={{ color: "#888" }}>
                    {msg.readBy?.length}/{users.length} read
                  </small>
                </p>
              )}
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <p>
          <em>{typingUsers.join(", ")} is typing...</em>
        </p>
      )}

      <div style={{ marginTop: 10 }}>
        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setTyping(true);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message"
          style={{ width: "60%", marginRight: 5, padding: "4px 8px" }}
        />
        <input
          type="file"
          onChange={handleFileChange}
          style={{ marginRight: 5 }}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;
