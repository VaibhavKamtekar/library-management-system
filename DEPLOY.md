# NMITD Library System — Local Desktop Deployment Guide

This guide walks you through deploying the library system on a **single, standalone Windows PC** in the library. After setup, the system auto-starts on every reboot and backs up daily — no manual intervention needed.

---

## Prerequisites — Install on the Library PC

Install these in order before doing anything else:

| Software | Download | Notes |
|---|---|---|
| **Node.js v20 LTS** | https://nodejs.org | Choose LTS version |
| **MySQL 8.x Community** | https://dev.mysql.com/downloads/mysql/ | Note the root password you set during install |
| **PM2** | Run: `npm install -g pm2` | After Node.js is installed |

---

## Step 1 — Copy the Project to the PC

Copy the entire project folder to a stable location, e.g.:
```
C:\LibraryApp\NmitdLibraraySystem-main\
```

> ⚠️ Do **not** put it on the Desktop or inside a user folder. Use `C:\LibraryApp\` so the path doesn't change when the Windows user account changes.

---

## Step 2 — Set Up the Database

1. Open **MySQL Workbench** or **MySQL Command Line Client**
2. Create the database:
   ```sql
   CREATE DATABASE nmitd_library;
   ```
3. Import the schema:
   ```bash
   mysql -u root -p nmitd_library < nmitdlibrarysqlcode.sql
   ```
   Or in Workbench: `File → Open SQL Script → nmitdlibrarysqlcode.sql → Run`

4. **Change the default admin password** (important!):
   ```sql
   USE nmitd_library;
   UPDATE admin SET password = 'YourStrongPassword' WHERE admin_id = 1;
   ```

---

## Step 3 — Update DB Credentials (if not using root/root)

If you set a different MySQL password during install, update `Backend/db.js`:
```js
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "YOUR_MYSQL_PASSWORD",   // ← update this
    database: "nmitd_library"
});
```

---

## Step 4 — Install Backend Dependencies

Open **Command Prompt** and run:
```bash
cd C:\LibraryApp\NmitdLibraraySystem-main\Backend
npm install
```

---

## Step 5 — Build the Frontend

```bash
cd C:\LibraryApp\NmitdLibraraySystem-main\frontend
npm install
npm run build
```

This creates `frontend/build/` — the production-ready static files that the backend will serve.

> ✅ You only need to run `npm run build` again if you make changes to the frontend code.

---

## Step 6 — Start the App with PM2

```bash
cd C:\LibraryApp\NmitdLibraraySystem-main
pm2 start pm2.config.js
```

Verify it's running:
```bash
pm2 status
```

You should see `library-backend` with status **online**.

---

## Step 7 — Set PM2 to Auto-Start on Windows Boot

```bash
pm2 save
pm2 startup
```

PM2 will print a command you need to run. Copy and run it. This registers PM2 as a Windows Service so the backend starts automatically on every reboot.

---

## Step 8 — Set Up Daily Database Backups

1. Right-click `scripts\setup-backup-task.bat` → **Run as Administrator**
2. This registers a Windows Task Scheduler job that backs up the database every day at **8:00 PM**
3. Backups are saved to `backups\` folder (next to the project) as `backup_YYYY-MM-DD.sql`
4. Backups older than 30 days are deleted automatically

To restore from a backup:
```bash
scripts\restore.bat backups\backup_2026-05-06.sql
```

---

## Step 9 — Set the Browser to Open the App on Login

1. Open **Chrome** or **Edge**
2. Set the homepage to: `http://localhost:5000`
3. Or set the browser to open on startup via Windows Task Scheduler (optional)

---

## Day-to-Day Operations

### Starting the app (if it ever stops):
```bash
cd C:\LibraryApp\NmitdLibraraySystem-main
pm2 start pm2.config.js
```

### Checking if the backend is running:
```bash
pm2 status
```

### Viewing live logs:
```bash
pm2 logs library-backend
```

### Restarting after a code change:
```bash
pm2 restart library-backend
```

### After updating frontend code:
```bash
cd frontend
npm run build
pm2 restart library-backend
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `http://localhost:5000` won't load | Run `pm2 status` — if backend is stopped, run `pm2 restart library-backend` |
| "MySQL connection failed" error | Check MySQL service is running via `services.msc` |
| Backup script fails | Verify MySQL path in `scripts/backup.bat` matches your MySQL installation |
| PM2 doesn't auto-start after reboot | Re-run `pm2 startup` and follow the printed instructions |

---

## File Structure After Deployment

```
C:\LibraryApp\NmitdLibraraySystem-main\
├── Backend\              ← Node.js API server
├── frontend\             
│   └── build\            ← Served by backend in production
├── scripts\
│   ├── backup.bat        ← Run manually or via Task Scheduler
│   ├── restore.bat       ← Disaster recovery
│   └── setup-backup-task.bat
├── logs\
│   ├── out.log           ← PM2 stdout logs
│   └── error.log         ← PM2 error logs
├── backups\              ← Created automatically by backup.bat
│   └── backup_YYYY-MM-DD.sql
├── pm2.config.js         ← PM2 process config
└── DEPLOY.md             ← This file
```
