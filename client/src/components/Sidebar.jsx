// src/components/Sidebar.jsx
import React, { useState } from "react";

const Sidebar = ({ users, username, currentRoom, onRoomSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  const isActive = (roomId) => roomId === currentRoom;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          zIndex: 999,
          padding: "8px 12px",
          background: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: 4,
        }}
      >
        ☰
      </button>

      {/* Sidebar container */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: isOpen ? 0 : "-250px",
          width: 250,
          height: "100vh",
          backgroundColor: "#f0f0f0",
          padding: 20,
          boxShadow: "2px 0 6px rgba(0,0,0,0.2)",
          transition: "left 0.3s ease-in-out",
          zIndex: 998,
        }}
      >
        <h3>Rooms</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>
            <button
              onClick={() => {
                onRoomSelect("global");
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                background: isActive("global") ? "#007bff" : "transparent",
                color: isActive("global") ? "#fff" : "#000",
                border: "none",
                borderRadius: 4,
              }}
            >
              🌐 Global Chat
            </button>
          </li>
          {users
            .filter((u) => u.username !== username)
            .map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => {
                    onRoomSelect(user.id);
                    setIsOpen(false);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    background: isActive(user.id) ? "#007bff" : "transparent",
                    color: isActive(user.id) ? "#fff" : "#000",
                    border: "none",
                    borderRadius: 4,
                  }}
                >
                  💬 {user.username}
                </button>
              </li>
            ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
