# 📚 NMITD Library Management System

A smart and efficient Library Entry Management System designed to track student, staff, and guest visits with real-time analytics and automated entry/exit handling.

---

## 🚀 Features

- 🔁 **Smart IN/OUT Detection**
  - Automatically detects whether a user is entering or exiting
  - Prevents duplicate active sessions

- 👤 **Role-Based Access**
  - Student, Staff, Guest, Admin workflows

- 📊 **Admin Dashboard**
  - Real-time analytics
  - Currently inside users
  - Peak hours tracking
  - Leaderboard (top visitors)

- 📄 **Advanced Logs**
  - Pagination
  - Filtering (date, department, user type, etc.)
  - Status-based filtering (inside/exited)

- 📤 **Export Functionality**
  - Download logs as CSV
  - Clean formatting with "Still Inside" handling

- 📥 **Excel Upload**
  - Bulk student data upload

- 🎨 **UI Features**
  - Light/Dark mode
  - Clean operational interface

---

## 🧠 System Architecture

Frontend → React.js
Backend → Node.js (Express)
Database → MySQL

---

## ⚙️ Key Technical Highlights

- Centralized `/api/visit` endpoint for unified entry/exit logic
- Backend-driven validation (prevents data mismatch)
- Session-based tracking using `entry_time` and `exit_time`
- Pagination using `LIMIT` and `OFFSET`
- CSV export with dynamic filtering
- Real-time active user tracking

---

## 📸 Screenshots

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Logs

![Logs](screenshots/logs.png)

### Entry Screen

![Entry](screenshots/entry.png)

---

## 🛠️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/nmitd-library-system.git
cd nmitd-library-system
```

### 2. Install dependencies

Frontend:

```bash
cd frontend
npm install
npm start
```

Backend:

```bash
cd backend
npm install
npm start
```

---

### 3. Database Setup

- Create MySQL database
- Import provided SQL file
