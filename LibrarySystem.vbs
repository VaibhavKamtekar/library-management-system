Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Dynamically resolve script folder and Backend directory
scriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
backendDir = FSO.BuildPath(scriptDir, "Backend")

If FSO.FolderExists(backendDir) Then
    WshShell.CurrentDirectory = backendDir
    ' Start Node.js server hidden using environment PATH
    WshShell.Run "cmd /c node server.js", 0, False
End If

' Wait for server to initialize
WScript.Sleep 5000

' Open browser in kiosk mode dynamically
WshShell.Run "cmd /c start msedge --kiosk http://localhost:5000 --edge-kiosk-type=fullscreen", 0, False