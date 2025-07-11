// src/components/Sidebar.jsx
import React from "react";
import { useSocket } from "../socket/socket";

const Sidebar = ({ currentRoom, onSelectRoom, rooms }) => {
  const { unreadCounts } = useSocket();

  return (
    <div
      style={{
        width: "200px",
        borderRight: "1px solid #ccc",
        padding: "10px",
        background: "#f8f9fa",
        height: "100vh",
      }}
    >
      <h3>Chat Rooms</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {rooms.map((room) => (
          <li key={room} style={{ marginBottom: 10 }}>
            <button
              onClick={() => onSelectRoom(room)}
              style={{
                background: room === currentRoom ? "#007bff" : "#e0e0e0",
                color: room === currentRoom ? "#fff" : "#000",
                padding: "8px 12px",
                border: "none",
                borderRadius: 4,
                width: "100%",
                textAlign: "left",
                position: "relative",
              }}
            >
              {room}
              {unreadCounts[room] > 0 && (
                <span
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 8,
                    background: "red",
                    color: "#fff",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "0.75rem",
                  }}
                >
                  {unreadCounts[room]}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
