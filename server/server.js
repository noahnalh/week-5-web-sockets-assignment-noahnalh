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
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// In-memory stores
const users = {}; // socket.id => { username, id }
const userRooms = {}; // socket.id => current room
const messages = {}; // room => [message]
const typingUsers = {}; // room => { socketId: username }

// Helpers
const getUsersInRoom = (room) => {
  return Object.entries(users)
    .filter(([id]) => userRooms[id] === room)
    .map(([, user]) => user);
};

const getTypingUsersInRoom = (room) =>
  typingUsers[room] ? Object.values(typingUsers[room]) : [];

// Socket.io
io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on("user_join", (username) => {
    users[socket.id] = { username, id: socket.id };
    const room = "global";
    userRooms[socket.id] = room;
    socket.join(room);

    messages[room] ||= [];
    typingUsers[room] ||= {};

    io.to(room).emit("user_joined", { username, id: socket.id });
    io.to(room).emit("user_list", getUsersInRoom(room));
    console.log(`${username} joined GLOBAL`);
  });

  socket.on("join_room", ({ username, room }) => {
    users[socket.id] = { username, id: socket.id };
    const oldRoom = userRooms[socket.id];
    if (oldRoom) socket.leave(oldRoom);

    userRooms[socket.id] = room;
    socket.join(room);

    messages[room] ||= [];
    typingUsers[room] ||= {};

    io.to(room).emit("user_joined", { username, id: socket.id });
    io.to(room).emit("user_list", getUsersInRoom(room));
    console.log(`${username} joined room ${room}`);
  });

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

  socket.on("add_reaction", ({ messageId, emoji, room }) => {
    const roomMessages = messages[room];
    if (!roomMessages) return;

    const msg = roomMessages.find((m) => m.id === messageId);
    if (!msg) return;

    msg.reactions ||= {};
    msg.reactions[emoji] ||= [];

    const userId = socket.id;
    const userIndex = msg.reactions[emoji].indexOf(userId);

    if (userIndex === -1) {
      msg.reactions[emoji].push(userId);
    } else {
      msg.reactions[emoji].splice(userIndex, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    }

    io.to(room).emit("receive_message", msg);
  });

  socket.on("typing", ({ isTyping, room }) => {
    const username = users[socket.id]?.username;
    if (!username) return;

    typingUsers[room] ||= {};

    if (isTyping) {
      typingUsers[room][socket.id] = username;
    } else {
      delete typingUsers[room][socket.id];
    }

    io.to(room).emit("typing_users", getTypingUsersInRoom(room));
  });

  socket.on("message_read", ({ messageId, room }) => {
    const msg = messages[room]?.find((m) => m.id === messageId);
    if (msg && !msg.readBy.includes(socket.id)) {
      msg.readBy.push(socket.id);
      io.to(room).emit("message_read", { messageId, readerId: socket.id });
    }
  });

  // Fixed private messaging logic here:
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
      reactions: {},
    };

    messages[room] ||= [];
    messages[room].push(privateMsg);

    // Ensure sender leaves old room and joins private room
    const oldRoom = userRooms[socket.id];
    if (oldRoom && oldRoom !== room) socket.leave(oldRoom);

    // Join private room for sender and recipient
    socket.join(room);
    userRooms[socket.id] = room;

    const recipientSocket = io.sockets.sockets.get(toSocketId);
    if (recipientSocket) {
      // Recipient joins private room too
      const recipientOldRoom = userRooms[toSocketId];
      if (recipientOldRoom && recipientOldRoom !== room)
        recipientSocket.leave(recipientOldRoom);

      recipientSocket.join(room);
      userRooms[toSocketId] = room;

      // Emit private message to entire private room
      io.to(room).emit("private_message", privateMsg);

      // Notify recipient if they're not currently in private room
      if (recipientOldRoom !== room) {
        recipientSocket.emit("notify_message", {
          from: fromUser.username,
          message,
          room,
        });
      }
    } else {
      // Just emit to sender if recipient offline
      socket.emit("private_message", privateMsg);
    }
  });

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

// REST endpoints
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

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, server, io };
