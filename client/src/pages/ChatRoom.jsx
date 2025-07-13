import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../socket/socket";

const ChatRoom = ({ username, room, darkMode }) => {
  const {
    messages,
    fetchMessages,
    sendMessage,
    sendPrivateMessage,
    typingUsers,
    setTyping,
    markMessageAsRead,
    addReaction,
    connectionStatus,
  } = useSocket();

  const isMobile = window.innerWidth <= 768;
  const isPrivate = room.includes("_");

  const [newMessage, setNewMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);

  const fileInputRef = useRef();
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const readMessagesRef = useRef(new Set());

  const roomMessages = messages.filter((msg) => msg.room === room);
  const otherTypingUsers = typingUsers.filter((u) => u !== username);

  // Fetch first page of messages on room change
  useEffect(() => {
    if (!room || typeof fetchMessages !== "function") return;
    setPage(1);
    setHasMore(true);
    fetchMessages(room, 1);
  }, [room]);

  // ✅ FIXED: Mark messages as read safely without triggering loop
  useEffect(() => {
    const unreadMessages = messages.filter(
      (msg) =>
        msg.room === room &&
        !msg.readBy?.includes(username) &&
        !readMessagesRef.current.has(msg.id)
    );

    if (unreadMessages.length === 0) return;

    Promise.resolve().then(() => {
      unreadMessages.forEach((msg) => {
        markMessageAsRead(msg.id);
        readMessagesRef.current.add(msg.id);
      });
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages, room, username]);

  // Search messages
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
    } else {
      const filtered = roomMessages.filter(
        (msg) =>
          typeof msg.message === "string" &&
          msg.message.toLowerCase().includes(search.toLowerCase())
      );
      setSearchResults(filtered);
    }
  }, [search, roomMessages]);

  // Reconnection banner
  useEffect(() => {
    if (connectionStatus === "reconnected") {
      setShowReconnectedBanner(true);
      const timer = setTimeout(() => setShowReconnectedBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus]);

  const handleScroll = async (e) => {
    const el = e.target;
    const top = el.scrollTop;

    if (top === 0 && hasMore) {
      const prevScrollHeight = el.scrollHeight;
      const nextPage = page + 1;
      const success = await fetchMessages(room, nextPage);
      if (success) {
        setPage(nextPage);
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - prevScrollHeight;
        });
      } else {
        setHasMore(false);
      }
    }

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollToBottom(!nearBottom);
  };

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
    setSearch("");
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

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleReaction = (id, emoji) => {
    addReaction(id, emoji);
  };

  const formatTime = (iso) => {
    const date = new Date(iso);
    return `${date.getHours()}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const getDeliveryStatus = (msg) => {
    if (!msg.readBy) return "🕓 Sent";
    const readers = msg.readBy.filter((id) => id !== msg.senderId);
    if (readers.length > 0) return "👁 Read";
    if (msg.readBy.length === 1 && msg.readBy.includes(msg.senderId))
      return "✅ Delivered";
    return "🕓 Sent";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: isMobile ? "10px 8px" : "20px",
        boxSizing: "border-box",
      }}
    >
      {connectionStatus === "disconnected" && (
        <div
          style={{
            backgroundColor: "#dc3545",
            color: "#fff",
            textAlign: "center",
            padding: 6,
          }}
        >
          ⚠️ Disconnected from server. Attempting to reconnect...
        </div>
      )}
      {showReconnectedBanner && (
        <div
          style={{
            backgroundColor: "#28a745",
            color: "#fff",
            textAlign: "center",
            padding: 6,
          }}
        >
          ✅ Reconnected!
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="🔍 Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: 6,
            borderRadius: 4,
            border: "1px solid #ccc",
            background: darkMode ? "#222" : "#fff",
            color: darkMode ? "#f0f0f0" : "#000",
            fontSize: isMobile ? "0.9rem" : "1rem",
          }}
        />
      </div>

      {/* Messages */}
      <div
        onScroll={handleScroll}
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: isMobile ? 6 : 10,
          backgroundColor: darkMode ? "#222" : "#fff",
          borderRadius: 5,
          border: "1px solid #ccc",
          fontSize: isMobile ? "0.9rem" : "1rem",
        }}
      >
        {(searchResults.length > 0 ? searchResults : roomMessages).map(
          (msg) => (
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
                    style={{ fontSize: "0.75rem", color: "#888", marginTop: 4 }}
                  >
                    {formatTime(msg.timestamp)}{" "}
                    {msg.sender === username && <>| {getDeliveryStatus(msg)}</>}
                  </div>
                  <div style={{ marginTop: 5 }}>
                    {["👍", "❤️", "😂", "🔥"].map((emoji) => {
                      const count = msg.reactions?.[emoji]?.length || 0;
                      const reacted =
                        msg.reactions?.[emoji]?.includes(username);
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
          )
        )}
        <div ref={bottomRef} />
      </div>

      {showScrollToBottom && (
        <button
          onClick={() =>
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          style={{
            position: "fixed",
            bottom: isMobile ? 60 : 80,
            right: isMobile ? 10 : 20,
            zIndex: 10,
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            fontSize: 20,
            cursor: "pointer",
            boxShadow: "0 0 5px rgba(0,0,0,0.3)",
          }}
          title="Scroll to bottom"
        >
          ↓
        </button>
      )}

      {/* Input & Upload */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
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
            fontSize: isMobile ? "0.9rem" : "1rem",
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
            fontSize: isMobile ? "0.9rem" : "1rem",
          }}
        >
          Send
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ fontSize: "0.85rem", maxWidth: isMobile ? "100%" : "150px" }}
        />
      </div>

      {uploadProgress > 0 && (
        <div style={{ marginTop: 5 }}>Uploading: {uploadProgress}%...</div>
      )}

      {otherTypingUsers.length > 0 && (
        <div style={{ marginTop: 10, fontStyle: "italic", color: "#888" }}>
          {otherTypingUsers.join(", ")}{" "}
          {otherTypingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
