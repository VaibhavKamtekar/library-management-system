; ============================================================
; NMITD Library System — Inno Setup Script
;
; Production Windows Installer Configuration for Stage 3
; Bundles Node.js v24.18.0, NSSM, React build, Backend, Database schema,
; and management scripts into a standalone executable.
; ============================================================

#define AppName "NMITD Library System"
#define AppVersion "1.0.0"
#define AppPublisher "NMITD"
#define AppURL "http://localhost:5000"

[Setup]
AppId={{B378907A-E5F2-4824-A376-78788D4D65F3}}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}
DefaultDirName=C:\LibraryApp\NMITDLibrary
DefaultGroupName={#AppName}
AllowNoIcons=yes
OutputDir=..\releases
OutputBaseFilename=NMITD-Library-Setup
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
Uninstallable=yes
UninstallDisplayName={#AppName}
UninstallDisplayIcon={app}\frontend\build\favicon.ico
DisableProgramGroupPage=yes

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Dirs]
Name: "{app}\backups"
Name: "{app}\logs"
Name: "{app}\resources"
Name: "{app}\node"
Name: "{app}\installer\scripts"
Name: "{app}\installer\resources"

[Files]
; Backend Payload (includes node_modules, server.js, package.json, src)
Source: "..\Backend\*"; DestDir: "{app}\Backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.log,*.tmp,.git*,node_modules\.cache\*"

; Frontend Production Build Payload
Source: "..\frontend\build\*"; DestDir: "{app}\frontend\build"; Flags: ignoreversion recursesubdirs createallsubdirs

; Database Initial Schema
Source: "..\database\nmitdlibrarysqlcode.sql"; DestDir: "{app}\database"; Flags: ignoreversion

; Stage 1 & Operational Helper Scripts
Source: "..\scripts\*"; DestDir: "{app}\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs

; Stage 2 Installer Helpers & Resources
Source: "..\installer\scripts\*"; DestDir: "{app}\installer\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\installer\resources\*"; DestDir: "{app}\installer\resources"; Flags: ignoreversion recursesubdirs createallsubdirs

; Standalone Node.js v24.18.0 Runtime
Source: "..\installer\node\node.exe"; DestDir: "{app}\node"; Flags: ignoreversion

; Bundled NSSM 64-bit Binary
Source: "..\installer\resources\nssm.exe"; DestDir: "{app}\resources"; Flags: ignoreversion

; License Document
Source: "..\installer\resources\license.txt"; DestDir: "{app}\resources"; Flags: ignoreversion

; Configuration Templates & Metadata
Source: "..\.env.example"; DestDir: "{app}"; DestName: ".env.example"; Flags: ignoreversion
Source: "..\VERSION.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\LaunchBrowser.vbs"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#AppName}"; Filename: "wscript.exe"; Parameters: """{app}\LaunchBrowser.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\frontend\build\favicon.ico"
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "wscript.exe"; Parameters: """{app}\LaunchBrowser.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\frontend\build\favicon.ico"; Tasks: desktopicon

[UninstallRun]
; Safely stop and remove Windows Service while preserving DB, backups, logs, and .env
Filename: "{app}\installer\scripts\uninstall-service.bat"; Parameters: """{app}"""; Flags: runhidden waituntilterminated

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
var
  AppDir, EnvFile, EnvExample: String;
  ResultCode: Integer;
  ScriptPath: String;
begin
  if CurStep = ssPostInstall then
  begin
    AppDir := ExpandConstant('{app}');
    EnvFile := ExpandConstant('{app}\.env');
    EnvExample := ExpandConstant('{app}\.env.example');

    // 1. Initialize .env if missing
    if not FileExists(EnvFile) then
    begin
      if FileExists(EnvExample) then
      begin
        FileCopy(EnvExample, EnvFile, False);
        Log('[INNO-CODE] Initialized .env from template .env.example');
      end;
    end
    else
    begin
      Log('[INNO-CODE] Existing .env preserved intact.');
    end;

    // 2. MySQL Detection Check
    ScriptPath := ExpandConstant('{app}\installer\scripts\detect-mysql.ps1');
    if FileExists(ScriptPath) then
    begin
      Exec('powershell.exe', Format('-NoProfile -ExecutionPolicy Bypass -File "%s"', [ScriptPath]), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      if ResultCode <> 0 then
      begin
        MsgBox('MySQL was not detected on this system.' + #13#10 + #13#10 +
               'PREREQUISITE NOTICE: The NMITD Library System requires a running MySQL Server (port 3306).' + #13#10 +
               'Please ensure MySQL is installed and running before starting the application.', mbInformation, MB_OK);
      end;
    end;

    // 3. Pre-update Backup (if updating an existing installation)
    ScriptPath := ExpandConstant('{app}\installer\scripts\pre-update-backup.bat');
    if FileExists(ScriptPath) then
    begin
      Exec(ScriptPath, Format('"%s"', [AppDir]), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    end;

    // 4. Safe Database Initialization (creates database and imports schema if absent)
    ScriptPath := ExpandConstant('{app}\installer\scripts\init-database.ps1');
    if FileExists(ScriptPath) then
    begin
      Exec('powershell.exe', Format('-NoProfile -ExecutionPolicy Bypass -File "%s" -InstallDir "%s"', [ScriptPath, AppDir]), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      if ResultCode <> 0 then
      begin
        MsgBox('DATABASE INITIALIZATION FAILED!' + #13#10 + #13#10 +
               'The installer could not create or initialize the database ''nmitd_library''.' + #13#10 +
               'Please ensure MySQL Server is running and credentials in .env are correct.' + #13#10 + #13#10 +
               'Service installation has been halted.', mbError, MB_OK);
        Exit;
      end;
    end;

    // 5. Windows Service Registration & Startup via NSSM
    ScriptPath := ExpandConstant('{app}\installer\scripts\install-service.bat');
    if FileExists(ScriptPath) then
    begin
      Exec(ScriptPath, Format('"%s"', [AppDir]), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      if ResultCode <> 0 then
      begin
        MsgBox('SERVICE STARTUP FAILED!' + #13#10 + #13#10 +
               'NMITDLibraryService could not be started cleanly.' + #13#10 +
               'Please check system logs in ' + AppDir + '\logs.', mbError, MB_OK);
        Exit;
      end;
    end;

    // 6. Post-installation Verification
    ScriptPath := ExpandConstant('{app}\installer\scripts\post-install.bat');
    if FileExists(ScriptPath) then
    begin
      Exec(ScriptPath, Format('"%s"', [AppDir]), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    end;
  end;
end;

