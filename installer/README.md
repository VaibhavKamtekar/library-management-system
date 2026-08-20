# NMITD Library System — Production Windows Installer (Stage 3)

This directory contains the Inno Setup build configurations, bundled standalone runtimes, and helper scripts used to create the official standalone Windows installer (`NMITD-Library-Setup.exe`) for the NMITD Library System.

---

## 📁 Directory Structure

```
installer/
├── NMITD-Library-Setup.iss    # Inno Setup 6 compilation specification
├── build-installer.bat        # Automated batch build script
├── README.md                  # Detailed installer specification and testing documentation
├── node/
│   └── node.exe               # Standalone Node.js v24.18.0 64-bit runtime binary
├── resources/
│   ├── nssm.exe               # Tested 64-bit NSSM service manager executable
│   └── license.txt            # Production deployment license agreement
└── scripts/
    ├── detect-mysql.ps1       # Non-destructive MySQL service, binary, and port detector
    ├── init-database.ps1      # Safe database creator and schema importer
    ├── migrate-database.ps1   # Database migration and upgrade helper
    ├── pre-update-backup.bat  # Stage 1 backup gate before application updates
    ├── install-service.bat    # Windows Service registration via bundled NSSM
    ├── uninstall-service.bat  # Safe Windows Service stopper and remover
    └── post-install.bat       # Post-installation verification suite
```

---

## 🛠 Prerequisites for Building

1. **Inno Setup 6** (v6.0 or higher) installed on the build workstation.
2. **Bundled Node.js Runtime**: `installer/node/node.exe` (Node.js v24.18.0).
3. **Bundled NSSM Binary**: `installer/resources/nssm.exe` (64-bit).
4. **Frontend Production Build**: `frontend/build/index.html`.
5. **Backend Dependencies**: `Backend/node_modules/`.

---

## 🚀 How to Build the Installer

Run the automated build script from command line:

```cmd
cd C:\NmitdLibraraySystem-main\installer
build-installer.bat
```

The script will:
1. Locate the Inno Setup compiler (`ISCC.exe`).
2. Verify all required payload files (`node.exe`, `nssm.exe`, `frontend/build`).
3. Compile `NMITD-Library-Setup.iss`.
4. Generate the final output executable at `releases\NMITD-Library-Setup.exe`.

---

## 🔒 Key Security & Safety Rules

1. **MySQL Detection Only**:
   - The installer detects MySQL using `detect-mysql.ps1` (checking service, `mysql.exe`, `mysqldump.exe`, and port 3306).
   - The installer **NEVER** silently installs, downloads, or modifies MySQL configurations.

2. **Standalone Node.js Runtime**:
   - Bundles Node.js v24.18.0 at `{app}\node\node.exe`.
   - The registered service runs `{app}\node\node.exe {app}\Backend\server.js` with working directory `{app}\Backend`.
   - Does **NOT** require global Node.js or `npm` on the target computer.

3. **Bundled NSSM**:
   - Bundles tested 64-bit NSSM executable at `{app}\resources\nssm.exe`.
   - Registers Windows Service `NMITDLibraryService` with automatic startup and auto-restart on unexpected exit.

4. **Configuration Safety (`.env`)**:
   - On fresh installation, creates `{app}\.env` from `.env.example`.
   - On existing installation or upgrade, preserves existing `{app}\.env` intact.

5. **Database Safety**:
   - Checks if `nmitd_library` database exists.
   - Imports `database/nmitdlibrarysqlcode.sql` **ONLY IF** the database does not exist.
   - **NEVER** drops databases, recreates existing databases, or overwrites student records and visit logs.

6. **Uninstaller Safety**:
   - Stops and removes `NMITDLibraryService`.
   - Removes installed application binaries and components.
   - **PRESERVES** MySQL database, student records, visit logs, `.env`, `backups/`, and `logs/`.

7. **Browser Launcher**:
   - Desktop and Start Menu shortcuts invoke `wscript.exe "{app}\LaunchBrowser.vbs"`.
   - Polls `http://localhost:5000` until backend is ready, then opens browser (Edge kiosk mode / Chrome / Default browser).

---

## 🧪 Testing & Verification Workflow

### Test Classification Definitions
- **BUILD VERIFIED**: Setup.exe successfully compiled.
- **INSTALLER CONTENT VERIFIED**: Payload files and runtime components confirmed present in setup package.
- **ISOLATED INSTALL TESTED**: Installer executed in a separate, isolated test directory without affecting current dev setup.
- **CLEAN-PC TEST REQUIRED**: Final validation pending execution on a fresh Windows PC.
- **PRODUCTION DEPLOYMENT VERIFIED**: Deployment completed on the actual main library computer.
