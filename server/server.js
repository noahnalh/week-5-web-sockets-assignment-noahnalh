const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Ensure upload folder exists
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads"))); // ✅ Serve uploaded files

// In-memory stores
const users = {}; // socket.id => { username, id }
const userRooms = {}; // socket.id => room
const messages = {}; // room => [message]
const typingUsers = {}; // room => { socketId: username }

// Helpers
const getUsersInRoom = (room) => {
  return Object.entries(users)
    .filter(([id]) => userRooms[id] === room)
    .map(([, user]) => user);
};

const getTypingUsersInRoom = (room) => {
  return typingUsers[room] ? Object.values(typingUsers[room]) : [];
};

// Socket.io
io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Join global room
  socket.on("user_join", (username) => {
    users[socket.id] = { username, id: socket.id };
    const room = "global";
    userRooms[socket.id] = room;
    socket.join(room);

    if (!messages[room]) messages[room] = [];
    if (!typingUsers[room]) typingUsers[room] = {};

    io.to(room).emit("user_joined", { username, id: socket.id });
    io.to(room).emit("user_list", getUsersInRoom(room));
    console.log(`${username} joined GLOBAL`);
  });

  // Join private room
  socket.on("join_room", ({ username, room }) => {
    users[socket.id] = { username, id: socket.id };
    userRooms[socket.id] = room;
    socket.join(room);

    if (!messages[room]) messages[room] = [];
    if (!typingUsers[room]) typingUsers[room] = {};

    io.to(room).emit("user_joined", { username, id: socket.id });
    io.to(room).emit("user_list", getUsersInRoom(room));
    console.log(`${username} joined room ${room}`);
  });

  // Send message
  socket.on("send_message", ({ message, room }) => {
    const msg = {
      id: Date.now(),
      sender: users[socket.id]?.username || "Anonymous",
      senderId: socket.id,
      message,
      room,
      readBy: [socket.id],
      timestamp: new Date().toISOString(),
      reactions: {},
    };

    messages[room].push(msg);
    if (messages[room].length > 100) messages[room].shift();

    io.to(room).emit("receive_message", msg);
  });

  // Emoji Reaction Handler
  socket.on("add_reaction", ({ messageId, emoji, room }) => {
    const roomMessages = messages[room];
    if (!roomMessages) return;

    const msg = roomMessages.find((m) => m.id === messageId);
    if (!msg) return;

    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const userId = socket.id;
    const userIndex = msg.reactions[emoji].indexOf(userId);

    if (userIndex === -1) {
      msg.reactions[emoji].push(userId);
    } else {
      msg.reactions[emoji].splice(userIndex, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    }

    io.to(room).emit("receive_message", msg);
  });

  // Typing indicator
  socket.on("typing", ({ isTyping, room }) => {
    const username = users[socket.id]?.username;
    if (!username) return;

    if (!typingUsers[room]) typingUsers[room] = {};

    if (isTyping) {
      typingUsers[room][socket.id] = username;
    } else {
      delete typingUsers[room][socket.id];
    }

    io.to(room).emit("typing_users", getTypingUsersInRoom(room));
  });

  // Read receipts
  socket.on("message_read", ({ messageId, room }) => {
    const msg = messages[room]?.find((m) => m.id === messageId);
    if (msg && !msg.readBy.includes(socket.id)) {
      msg.readBy.push(socket.id);
      io.to(room).emit("message_read", { messageId, readerId: socket.id });
    }
  });

  // ✅ Enhanced Private messaging with notification
  socket.on("private_message", ({ to, message }) => {
    const fromUser = users[socket.id];
    const toSocketId = Object.keys(users).find(
      (id) => users[id].username === to
    );

    if (!fromUser || !toSocketId) return;

    const room = [fromUser.username, to].sort().join("_");

    const privateMsg = {
      id: Date.now(),
      sender: fromUser.username,
      senderId: socket.id,
      message,
      room,
      isPrivate: true,
      timestamp: new Date().toISOString(),
      readBy: [socket.id],
    };

    if (!messages[room]) messages[room] = [];
    messages[room].push(privateMsg);

    // Join the private room
    socket.join(room);
    const recipientSocket = io.sockets.sockets.get(toSocketId);
    if (recipientSocket) {
      recipientSocket.join(room);
    }

    // ✅ 1. Emit to room (if both are inside)
    io.to(room).emit("private_message", privateMsg);

    // ✅ 2. Direct notification to recipient even if not in the room
    if (recipientSocket && toSocketId !== socket.id) {
      recipientSocket.emit("receive_message", privateMsg);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    const username = users[socket.id]?.username;
    const room = userRooms[socket.id];

    if (room) {
      socket.leave(room);
      delete typingUsers[room]?.[socket.id];

      io.to(room).emit("user_left", { username, id: socket.id });
      io.to(room).emit("user_list", getUsersInRoom(room));
      io.to(room).emit("typing_users", getTypingUsersInRoom(room));
    }

    delete users[socket.id];
    delete userRooms[socket.id];

    console.log(`❌ ${username || "User"} disconnected`);
  });
});

// File upload endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

// REST API endpoints
app.get("/api/messages/:room", (req, res) => {
  const room = req.params.room || "global";
  res.json(messages[room] || []);
});

app.get("/api/users/:room", (req, res) => {
  const room = req.params.room || "global";
  res.json(getUsersInRoom(room));
});

app.get("/", (req, res) => {
  res.send("Socket.io Chat Server is running");
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, server, io };
