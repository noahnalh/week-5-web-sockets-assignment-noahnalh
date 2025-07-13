# 💬 Real-Time Chat App (Socket.IO + React + Node.js)

A full-stack real-time chat application that supports:

- Global and private rooms
- File sharing and uploads
- Typing indicators and read receipts
- Emoji reactions
- Browser and sound notifications
- Responsive design with dark mode

---

## 🧠 Project Overview

This project is a modern real-time chat application built using:

- **React (Vite)** for the frontend  
- **Socket.IO** for real-time messaging  
- **Express.js** backend with **Multer** for file uploads  
- Features like emoji reactions, typing indicators, file upload progress, read receipts, room switching, and mobile responsiveness make this a feature-rich app.

---

## 🚀 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/PLP-MERN-Stack-Development/week-5-web-sockets-assignment-noahnalh.git
cd week-5-web-sockets-assignment-noahnalh
```

---

### 2. Server Setup

```bash
cd server
npm install
```

Create `.env` file inside `server/`:

```env
PORT=3000
```

Then run the server:

```bash
node server.js
```


---

### 3. Client Setup

```bash
cd ../client
pnpm install
pnpm run dev
```


---

## ✨ Features Implemented

### ✅ Core Chat Features

- Real-time messaging using Socket.IO
- Global room and private 1:1 chat support
- Typing indicators per room
- Read receipts for each message
- Pagination for older messages

### ✅ File Sharing

- Upload and send any file
- Upload progress indicator
- Shareable download links

### ✅ Reactions

- Emoji reaction toggling (👍 ❤️ 😂 🔥)
- Real-time sync between all clients

### ✅ User Experience

- Dark/light mode
- Scroll to bottom button
- Search messages in current room
- Mobile-friendly responsive UI
- Reconnection notifications

### ✅ Notifications

- Sound notifications for new private messages
- Browser push notifications for private messages (when tab is inactive)

---

## 📁 Project Folder Structure

```
root/
├── README.md
├── client/
│   ├── public/
│   │   ├── uploads/
│   │   └── notify.mp3
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.jsx
│   │   ├── socket/
│   │   │   └── socket.js
│   │   ├── App.jsx
│   │   ├── Main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── public/
│   │   └── uploads/
│   ├── server.js
│   ├── .env
│   └── package.json
```

---

## 🧾 .env Configuration

Create a `.env` file in the `server/` folder:

```
PORT=3000
```

---

## 🧑‍💻 Author

Created by **Your Name**  
This project is open-source and free to use.

---