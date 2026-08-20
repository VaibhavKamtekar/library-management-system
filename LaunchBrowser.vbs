' ============================================================
' NMITD Library System — Production Browser Launcher
'
' Dynamically resolves installation directory.
' Polls http://localhost:5000 until backend is responsive.
' Opens Microsoft Edge in kiosk mode with Chrome and default browser fallbacks.
' Contains ZERO hardcoded paths.
' ============================================================

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' 1. Dynamically resolve application root directory
scriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)

targetUrl = "http://localhost:5000"
isReady = False
maxAttempts = 30

' 2. Poll http://localhost:5000 until backend HTTP service responds (up to 30 seconds)
For attempt = 1 To maxAttempts
    On Error Resume Next
    Set http = CreateObject("WinHttp.WinHttpRequest.5.5")
    If http Is Nothing Then
        Set http = CreateObject("MSXML2.ServerXMLHTTP")
    End If
    
    http.Open "GET", targetUrl, False
    http.setTimeouts 1000, 1000, 1000, 1000
    http.Send
    
    If Err.Number = 0 Then
        If http.Status >= 200 And http.Status < 500 Then
            isReady = True
            On Error GoTo 0
            Exit For
        End If
    End If
    Err.Clear
    On Error GoTo 0
    
    WScript.Sleep 1000
Next

' 3. Launch Application in Browser
' Preference 1: Microsoft Edge Kiosk Mode
On Error Resume Next
WshShell.Run "cmd /c start msedge --kiosk " & targetUrl & " --edge-kiosk-type=fullscreen", 0, False

If Err.Number <> 0 Then
    Err.Clear
    ' Preference 2: Google Chrome Kiosk / App Mode
    WshShell.Run "cmd /c start chrome --app=" & targetUrl, 0, False
    If Err.Number <> 0 Then
        Err.Clear
        ' Preference 3: Default System Web Browser
        WshShell.Run targetUrl, 1, False
    End If
End If
On Error GoTo 0
