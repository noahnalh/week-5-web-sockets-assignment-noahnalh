import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../socket/socket";

const ChatRoom = ({ username, room, darkMode }) => {
  const {
    messages,
    sendMessage,
    sendPrivateMessage,
    typingUsers,
    setTyping,
    markMessageAsRead,
    addReaction,
  } = useSocket();

  const [newMessage, setNewMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef();
  const bottomRef = useRef(null);

  const isPrivate = room.includes("_");

  // Filter messages for current room
  const roomMessages = messages.filter((msg) => msg.room === room);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // Mark all messages in room as read when room changes or messages update
    roomMessages.forEach((msg) => {
      if (!msg.readBy?.includes(username)) markMessageAsRead(msg.id);
    });
  }, [roomMessages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    if (isPrivate) {
      const recipient = room.split("_").find((name) => name !== username);
      sendPrivateMessage(recipient, newMessage);
    } else {
      sendMessage(newMessage, room);
    }

    setNewMessage("");
    setTyping(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(0);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        const { fileUrl } = JSON.parse(xhr.responseText);
        const link = `${window.location.origin}${fileUrl}`;
        setNewMessage(link);
        setUploadProgress(0);
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const formatTime = (iso) => {
    const date = new Date(iso);
    return `${date.getHours()}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleReaction = (id, emoji) => {
    addReaction(id, emoji);
  };

  // Typing users excluding self
  const otherTypingUsers = typingUsers.filter((u) => u !== username);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 10,
          backgroundColor: darkMode ? "#222" : "#fff",
          borderRadius: 5,
          border: "1px solid #ccc",
        }}
      >
        {roomMessages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: 8,
              padding: 6,
              backgroundColor: msg.system
                ? "transparent"
                : msg.sender === username
                ? darkMode
                  ? "#4a4a4a"
                  : "#d7fdd7"
                : darkMode
                ? "#2e2e2e"
                : "#f0f0f0",
              borderRadius: 6,
              wordBreak: "break-word",
            }}
          >
            {msg.system ? (
              <i>{msg.message}</i>
            ) : (
              <>
                <b>{msg.sender}</b>:{" "}
                {msg.message.startsWith("http") ? (
                  <a href={msg.message} target="_blank" rel="noreferrer">
                    {msg.message}
                  </a>
                ) : (
                  msg.message
                )}
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    marginTop: 4,
                  }}
                >
                  {formatTime(msg.timestamp)} | Read by:{" "}
                  {msg.readBy?.length || 0}
                </div>
                <div style={{ marginTop: 5 }}>
                  {["👍", "❤️", "😂", "🔥"].map((emoji) => {
                    const count = msg.reactions?.[emoji]?.length || 0;
                    const reacted = msg.reactions?.[emoji]?.includes(username);
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        style={{
                          marginRight: 5,
                          background: reacted ? "#ccc" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1rem",
                        }}
                      >
                        {emoji} {count > 0 ? count : ""}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <input
          value={newMessage}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message"
          style={{
            flex: 1,
            padding: 6,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: "6px 12px",
            backgroundColor: darkMode ? "#0d6efd" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Send
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} />
      </div>

      {uploadProgress > 0 && (
        <div style={{ marginTop: 5 }}>Uploading: {uploadProgress}%...</div>
      )}

      {otherTypingUsers.length > 0 && (
        <div
          style={{
            marginTop: 10,
            fontStyle: "italic",
            color: "#888",
          }}
        >
          {otherTypingUsers.join(", ")}{" "}
          {otherTypingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
