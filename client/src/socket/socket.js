import { io } from "socket.io-client";
import { useEffect, useState, useRef } from "react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState("global");
  const [unreadCounts, setUnreadCounts] = useState({});
  const audioRef = useRef(null);

  const usernameRef = useRef("");
  const roomRef = useRef("global");

  useEffect(() => {
    audioRef.current = new Audio("/notify.mp3");
  }, []);

  const connect = (username) => {
    usernameRef.current = username;
    socket.connect();
  };

  const joinRoom = (username, room = "global") => {
    usernameRef.current = username;
    roomRef.current = room;
    setCurrentRoom(room);
    setMessages([]);
    setUnreadCounts((prev) => ({ ...prev, [room]: 0 }));

    if (room === "global") {
      socket.emit("user_join", username);
    } else {
      socket.emit("join_room", { username, room });
    }
  };

  const sendMessage = (message, room) => {
    if (typeof message === "string") {
      socket.emit("send_message", { message, room });
    }
  };

  const sendPrivateMessage = (to, message) => {
    const from = usernameRef.current;
    const privateRoom = [from, to].sort().join("_");

    setCurrentRoom(privateRoom);
    roomRef.current = privateRoom;
    setUnreadCounts((prev) => ({ ...prev, [privateRoom]: 0 }));

    socket.emit("private_message", { to, message });
  };

  const setTyping = (isTyping) => {
    socket.emit("typing", { isTyping, room: roomRef.current });
  };

  const markMessageAsRead = (messageId) => {
    socket.emit("message_read", { messageId, room: roomRef.current });
  };

  const addReaction = (messageId, emoji) => {
    socket.emit("add_reaction", {
      messageId,
      emoji,
      room: roomRef.current,
      username: usernameRef.current,
    });
  };

  const showNotification = ({ from, message, room }) => {
    if (Notification.permission === "granted") {
      new Notification(`New message from ${from}`, {
        body: message.length > 100 ? message.slice(0, 100) + "..." : message,
      });
    }
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleIncomingMessage = (message) => {
    setLastMessage(message);

    setMessages((prev) => {
      const exists = prev.find((m) => m.id === message.id);
      return exists
        ? prev.map((m) => (m.id === message.id ? message : m))
        : [...prev, message];
    });

    if (message.room !== roomRef.current) {
      setUnreadCounts((prev) => ({
        ...prev,
        [message.room]: (prev[message.room] || 0) + 1,
      }));
    }
  };

  const fetchMessages = async (room, page = 1, limit = 20) => {
    try {
      const res = await fetch(
        `/api/messages/${encodeURIComponent(room)}?offset=${
          (page - 1) * limit
        }&limit=${limit}`
      );
      if (!res.ok) return false;

      const data = await res.json();
      const sorted = data.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = sorted.filter((m) => !existingIds.has(m.id));
        return [...newMessages, ...prev];
      });

      return sorted.length > 0;
    } catch (err) {
      console.error("Failed to fetch messages", err);
      return false;
    }
  };

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setReconnecting(false);

      // Handle reconnect status
      setConnectionStatus((prev) =>
        prev === "disconnected" ? "reconnected" : "connected"
      );

      const username = usernameRef.current;
      const room = roomRef.current;

      if (username) {
        if (room === "global") {
          socket.emit("user_join", username);
        } else {
          socket.emit("join_room", { username, room });
        }
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus("disconnected");
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

    const handleMessageUpdated = (updatedMsg) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
      );
    };

    const handleUserList = (list) => setUsers(list);

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

    const handleNotifyMessage = ({ from, message, room }) => {
      if (room !== roomRef.current) {
        showNotification({ from, message, room });
        setUnreadCounts((prev) => ({
          ...prev,
          [room]: (prev[room] || 0) + 1,
        }));
      }
    };

    const handleMessageDelivered = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, delivered: true } : msg
        )
      );
    };

    // ✅ Socket.io low-level reconnection events
    socket.io.on("reconnect_attempt", () => {
      setReconnecting(true);
    });

    socket.io.on("reconnect", () => {
      setReconnecting(false);
      setConnectionStatus("reconnected");
    });

    socket.io.on("reconnect_failed", () => {
      setReconnecting(false);
      setConnectionStatus("disconnected");
    });

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("receive_message", handleIncomingMessage);
    socket.on("private_message", handleIncomingMessage);
    socket.on("message_read", handleMessageRead);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("user_list", handleUserList);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("typing_users", handleTypingUsers);
    socket.on("notify_message", handleNotifyMessage);
    socket.on("message_delivered", handleMessageDelivered);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("receive_message", handleIncomingMessage);
      socket.off("private_message", handleIncomingMessage);
      socket.off("message_read", handleMessageRead);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("user_list", handleUserList);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("typing_users", handleTypingUsers);
      socket.off("notify_message", handleNotifyMessage);
      socket.off("message_delivered", handleMessageDelivered);

      socket.io.off("reconnect_attempt");
      socket.io.off("reconnect");
      socket.io.off("reconnect_failed");
    };
  }, []);

  return {
    socket,
    isConnected,
    reconnecting,
    connectionStatus, // 👈 Exposed for ChatRoom banner
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
    addReaction,
    unreadCounts,
    fetchMessages,
  };
};

export default socket;
