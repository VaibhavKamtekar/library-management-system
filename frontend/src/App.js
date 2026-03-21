import React, { useEffect, useMemo, useState } from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Public screens
import Home from "./components/Home";
import StudentEntry from "./components/StudentEntry";
import StaffEntry from "./components/StaffEntry";
import GuestEntry from "./components/GuestEntry";
import InOut from "./components/InOut";
import Message from "./components/Message";

// Admin screens
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem("library-theme") || "light");

  // controls which screen is shown
  const [screen, setScreen] = useState("home");

  // stores current user info (student/staff/guest)
  const [user, setUser] = useState({});

  // message after IN / OUT
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("library-theme", mode);
  }, [mode]);

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
      {/* HOME */}
      {screen === "home" && <Home {...commonScreenProps} />}

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
          setMessage={setMessage}
        />
      )}

      {/* MESSAGE */}
      {screen === "message" && (
        <Message {...commonScreenProps} message={message} user={user} />
      )}


      {/* ADMIN LOGIN */}
      {screen === "adminLogin" && (
        <AdminLogin {...commonScreenProps} />
      )}

      {/* ADMIN DASHBOARD */}
      {screen === "adminDashboard" && (
        <AdminDashboard {...commonScreenProps} />
      )}
    </ThemeProvider>
  );
}

export default App;
