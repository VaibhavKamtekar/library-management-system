import React, { useEffect, useMemo, useRef, useState } from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Public screens
import Home from "./components/Home";
import StudentEntry from "./components/StudentEntry";
import StaffEntry from "./components/StaffEntry";
import GuestEntry from "./components/GuestEntry";
import InOut from "./components/InOut";
import Message from "./components/Message";
import Reminder from "./components/Reminder";
import IntroScreen from "./components/IntroScreen";

// Admin screens
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminStudentManagement from "./components/AdminStudentManagement";

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem("library-theme") || "light");

  // controls which screen is shown
  const [screen, setScreen] = useState("intro");
  
  // controls if dashboard should animate in
  const [animateDashboard, setAnimateDashboard] = useState(false);

  // stores current user info (student/staff/guest)
  const [user, setUser] = useState({});

  // confirmation details after IN / OUT
  const [confirmation, setConfirmation] = useState({
    status: "",
    message: "",
    details: {}
  });

  useEffect(() => {
    localStorage.setItem("library-theme", mode);
  }, [mode]);

  // ── Kiosk inactivity timeout ──────────────────────────────────────────
  const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes
  const inactivityTimer = useRef(null);

  useEffect(() => {
    // Already on intro — no need to time out
    if (screen === "intro") return;

    const resetTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        setScreen("intro");
      }, INACTIVITY_MS);
    };

    const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    EVENTS.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    resetTimer(); // start the timer as soon as a non-intro screen is active

    return () => {
      clearTimeout(inactivityTimer.current);
      EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [screen]); // re-evaluate whenever the active screen changes
  // ── End inactivity timeout ────────────────────────────────────────────

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "dark" ? "#7dd3fc" : "#2563eb"
          },
          secondary: {
            main: mode === "dark" ? "#34d399" : "#0f766e"
          },
          background: {
            default: mode === "dark" ? "#0f172a" : "#edf4fb",
            paper: mode === "dark" ? "#111c2f" : "#ffffff"
          },
          text: {
            primary: mode === "dark" ? "#e7eef8" : "#12263f",
            secondary: mode === "dark" ? "#9fb2cb" : "#4f647c"
          },
          divider: mode === "dark" ? "rgba(255,255,255,0.12)" : "#d6e1ef"
        },
        typography: {
          fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
          h4: {
            fontFamily: 'Cambria, Georgia, serif'
          },
          h6: {
            fontFamily: 'Cambria, Georgia, serif'
          }
        },
        shape: {
          borderRadius: 14
        }
      }),
    [mode]
  );

  const commonScreenProps = {
    setScreen,
    mode,
    onToggleMode: () => setMode((prev) => (prev === "dark" ? "light" : "dark"))
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* INTRO SPLASH SCREEN */}
      {screen === "intro" && <IntroScreen setScreen={setScreen} setAnimateDashboard={setAnimateDashboard} />}

      {/* HOME */}
      {screen === "home" && <Home {...commonScreenProps} animateDashboard={animateDashboard} />}

      {/* STUDENT */}
      {screen === "student" && (
        <StudentEntry {...commonScreenProps} setUser={setUser} />
      )}

      {/* STAFF */}
      {screen === "staff" && (
        <StaffEntry {...commonScreenProps} setUser={setUser} />
      )}

      {/* GUEST */}
      {screen === "guest" && (
        <GuestEntry {...commonScreenProps} setUser={setUser} />
      )}

      {/* IN / OUT (COMMON) */}
      {screen === "inout" && (
        <InOut
          {...commonScreenProps}
          user={user}
          setConfirmation={setConfirmation}
        />
      )}

      {/* REMINDER */}
      {screen === "reminder" && (
        <Reminder {...commonScreenProps} />
      )}

      {/* MESSAGE */}
      {screen === "message" && (
        <Message {...commonScreenProps} confirmation={confirmation} user={user} />
      )}


      {/* ADMIN LOGIN */}
      {screen === "adminLogin" && (
        <AdminLogin {...commonScreenProps} />
      )}

      {/* ADMIN DASHBOARD */}
      {screen === "adminDashboard" && (
        <AdminDashboard {...commonScreenProps} />
      )}

      {/* ADMIN STUDENT MANAGEMENT */}
      {screen === "adminStudentManagement" && (
        <AdminStudentManagement {...commonScreenProps} />
      )}
    </ThemeProvider>
  );
}

export default App;
