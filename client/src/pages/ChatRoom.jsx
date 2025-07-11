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
    currentRoom,
  } = useSocket();

  const [message, setMessage] = useState("");
  const messagesEndRef = useRef();

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Join room on change
  useEffect(() => {
    if (username && room) {
      joinRoom(username, room);
    }
  }, [room, username]);

  // Mark messages as read when rendered
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.room === room && !msg.readBy?.includes(username)) {
        markMessageAsRead(msg.id);
      }
    });
  }, [messages, room]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message, room);
      setMessage("");
    }
  };

  return (
    <div>
      <div
        style={{
          border: "1px solid #ccc",
          padding: 10,
          height: 300,
          overflowY: "auto",
        }}
      >
        {messages
          .filter((msg) => msg.room === room || msg.isPrivate)
          .map((msg, i) => (
            <div key={i}>
              {msg.system ? (
                <em>{msg.message}</em>
              ) : (
                <p>
                  <strong>{msg.sender}:</strong> {msg.message}
                  {" · "}
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
        <p>
          <em>{typingUsers.join(", ")} is typing...</em>
        </p>
      )}

      <input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setTyping(true);
        }}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
};

export default ChatRoom;
