import React, { useState } from "react";

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
  // controls which screen is shown
  const [screen, setScreen] = useState("home");

  // stores current user info (student/staff/guest)
  const [user, setUser] = useState({});

  // message after IN / OUT
  const [message, setMessage] = useState("");

  return (
    <>
      {/* HOME */}
      {screen === "home" && <Home setScreen={setScreen} />}

      {/* STUDENT */}
      {screen === "student" && (
        <StudentEntry setScreen={setScreen} setUser={setUser} />
      )}

      {/* STAFF */}
      {screen === "staff" && (
        <StaffEntry setScreen={setScreen} setUser={setUser} />
      )}

      {/* GUEST */}
      {screen === "guest" && (
        <GuestEntry setScreen={setScreen} setUser={setUser} />
      )}

      {/* IN / OUT (COMMON) */}
      {screen === "inout" && (
        <InOut
          user={user}
          setMessage={setMessage}
          setScreen={setScreen}
        />
      )}

      {/* MESSAGE */}
    {screen === "message" && (
  <Message message={message} user={user} setScreen={setScreen} />
)}


      {/* ADMIN LOGIN */}
      {screen === "adminLogin" && (
        <AdminLogin setScreen={setScreen} />
      )}

      {/* ADMIN DASHBOARD */}
      {screen === "adminDashboard" && (
        <AdminDashboard setScreen={setScreen} />
      )}
    </>
  );
}

export default App;
