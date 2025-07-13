# 💬 Real-Time Chat App (Socket.IO + React + Node.js)

A full-stack real-time chat application featuring:

- 🌍 Global and private chat rooms  
- 📁 File sharing with upload progress  
- ✍️ Typing indicators and ✅ read receipts  
- 🔥 Emoji reactions  
- 🔔 Browser and sound notifications  
- 🌙 Responsive dark/light mode design  

---

## 🧠 Project Overview

This is a modern real-time chat app built with:

- **Frontend**: React (Vite)  
- **Backend**: Express.js + Socket.IO  
- **File Uploads**: Multer (via Express)  
- **Realtime**: WebSocket-based messaging with typing indicators, read receipts, reactions, and reconnections  
- **UI/UX**: Fully responsive, mobile-friendly, dark mode, file uploads, sound alerts, and search

---

## 🌐 Live Demo

- 🔗 **Frontend**: [week-5-web-sockets-assignment-noahn.vercel.app](https://week-5-web-sockets-assignment-noahn.vercel.app)  
- 🛠 **Backend API**: [week-5-web-sockets-assignment-noahnalh.onrender.com](https://week-5-web-sockets-assignment-noahnalh.onrender.com)

---

## 🚀 Setup Instructions

### 🔧 1. Clone the Repository

```bash
git clone https://github.com/PLP-MERN-Stack-Development/week-5-web-sockets-assignment-noahnalh.git
cd week-5-web-sockets-assignment-noahnalh
```

---

### 🖥 2. Backend Setup

```bash
cd server
pnpm install
```

Create a `.env` file in `server/`:

```env
PORT=3000
```

Start the backend:

```bash
node server.js
```

---

### 💻 3. Frontend Setup

```bash
cd ../client
pnpm install
pnpm run dev
```

Visit `http://localhost:5173` in your browser.

---

## ✨ Features

### 💬 Core Chat

- Real-time messaging with Socket.IO  
- Global room + private 1-on-1 chats  
- Typing indicators per room  
- Read receipts (per recipient)  
- Infinite scroll / message pagination  

### 📁 File Sharing

- Upload any file type  
- Progress indicator + download links  

### 🔥 Reactions

- Emoji reaction toggling (👍 ❤️ 😂 🔥)  
- Real-time synced reactions  

### 🧑‍💻 User Experience

- Dark/light mode toggle  
- Mobile-first responsive UI  
- Scroll-to-bottom button  
- Message search within rooms  
- Auto-reconnect with user status  

### 🔔 Notifications

- Browser push notifications (for private messages)  
- Sound alerts for new messages  

---

## ⚙️ Health Check & Monitoring

- Health endpoint:  
  `GET /health` → Returns `200 OK`  
  Useful for uptime monitoring (e.g., UptimeRobot)

- [Optional] Monitoring tools:
  - UptimeRobot / Pingdom (server health)
  - Sentry (error logging)
  - PM2 (process monitoring)

---

## 🔁 CI/CD (GitHub Actions)

This project includes:

- ✅ Auto-install and build frontend/backend on push  
- ✅ Linting and error checks  
- ✅ Vite build check in client  
- ✅ Node.js boot check in server

> 📸 Add screenshots of the CI pipeline running in `.github/screenshots/` and embed below:

### 🖼 CI/CD Pipeline

![CI/CD Workflow](client/public/screenshots/ci-cd.png)

---

## 🧾 .env Configuration

Create this inside `server/.env`:

```
PORT=3000
```

If using deployed environments (e.g., Render/Vercel), configure `SOCKET_URL`, `API_URL`, etc., as needed.

---

## 📁 Folder Structure

```
root/
├── README.md
├── client/
│   ├── public/
│   │   ├── uploads/
│   │   ├── notify.mp3
│   │   └── screenshots/
│   │       └── ci-cd.png
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.jsx
│   │   ├── socket/
│   │   │   └── socket.js
│   │   ├── App.jsx
│   │   ├── Main.jsx
│   │   └── index.css
│   ├── vite.config.mjs
│   └── package.json
├── server/
│   ├── public/uploads/
│   ├── server.js
│   ├── .env
│   └── package.json
```

---

## 👨‍💻 Author

Built by **Noah**  
Real-time MERN Stack Developer 🚀  
This project is open-source and free to use.

---

