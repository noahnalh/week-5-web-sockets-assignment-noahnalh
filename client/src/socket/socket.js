import { io } from "socket.io-client";
import { useEffect, useState, useRef } from "react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Socket.io instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Custom hook
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState("global");

  // Persist username and room across reloads
  const usernameRef = useRef("");
  const roomRef = useRef("global");

  // Connect socket and re-join previous room
  const connect = (username) => {
    usernameRef.current = username;
    socket.connect();
  };

  // Join room (global or private)
  const joinRoom = (username, room = "global") => {
    usernameRef.current = username;
    roomRef.current = room;
    setCurrentRoom(room);
    setMessages([]); // reset message history

    if (room === "global") {
      socket.emit("user_join", username);
    } else {
      socket.emit("join_room", { username, room });
    }
  };

  // Send message to a room
  const sendMessage = (message, room) => {
    if (typeof message === "string") {
      socket.emit("send_message", { message, room });
    }
  };

  // Typing indicator
  const setTyping = (isTyping) => {
    socket.emit("typing", { isTyping, room: roomRef.current });
  };

  // Read receipt
  const markMessageAsRead = (messageId) => {
    socket.emit("message_read", { messageId, room: roomRef.current });
  };

  // Private message
  const sendPrivateMessage = (to, message) => {
    socket.emit("private_message", { to, message });
  };

  // Event handlers
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);

      // Rejoin the last known room
      if (usernameRef.current) {
        if (roomRef.current === "global") {
          socket.emit("user_join", usernameRef.current);
        } else {
          socket.emit("join_room", {
            username: usernameRef.current,
            room: roomRef.current,
          });
        }
      }
    };

    const handleDisconnect = () => setIsConnected(false);

    const handleReceiveMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);
    };

    const handlePrivateMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);
    };

    const handleMessageRead = ({ messageId, readerId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                readBy: [...new Set([...(msg.readBy || []), readerId])],
              }
            : msg
        )
      );
    };

    const handleUserList = (list) => {
      setUsers(list);
    };

    const handleUserJoined = (user) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const handleUserLeft = (user) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const handleTypingUsers = (usersTyping) => {
      setTypingUsers(usersTyping);
    };

    // Register listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("private_message", handlePrivateMessage);
    socket.on("message_read", handleMessageRead);
    socket.on("user_list", handleUserList);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("typing_users", handleTypingUsers);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("private_message", handlePrivateMessage);
      socket.off("message_read", handleMessageRead);
      socket.off("user_list", handleUserList);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("typing_users", handleTypingUsers);
    };
  }, []);

  return {
    socket,
    isConnected,
    lastMessage,
    messages,
    users,
    typingUsers,
    currentRoom,
    connect,
    joinRoom,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    markMessageAsRead,
  };
};

export default socket;
