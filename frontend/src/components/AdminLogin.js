import { useState } from "react";
import axios from "axios";
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField
} from "@mui/material";
import OperationalLayout from "./OperationalLayout";

export default function AdminLogin({ setScreen, mode, onToggleMode }) {
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const username = e.target.username.value.trim();
    const password = e.target.password.value.trim();

    try {
      const res = await axios.post("http://localhost:5000/api/admin/login", {
        username,
        password
      });

      if (res.data.success) {
        setScreen("adminDashboard");
        return;
      }

      setError("Invalid username or password.");
    } catch (err) {
      setError("Unable to sign in right now.");
    }
  };

  return (
    <OperationalLayout
      title="Admin login"
      subtitle="Sign in to view analytics, logs, timestamps, and student data upload."
      sectionLabel="Administrative Access"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Paper sx={paperSx} component="form" onSubmit={handleLogin}>
        <Stack spacing={2.5}>
          <TextField label="Username" name="username" required fullWidth />
          <TextField label="Password" name="password" type="password" required fullWidth />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" sx={primaryButtonSx}>
            Sign In
          </Button>
          <Button variant="outlined" sx={secondaryButtonSx} onClick={() => setScreen("home")}>
            Back
          </Button>
        </Stack>
      </Paper>
    </OperationalLayout>
  );
}

const paperSx = {
  p: { xs: 3, md: 4 },
  borderRadius: 4,
  border: "1px solid",
  borderColor: "divider",
  background: (theme) => (theme.palette.mode === "dark" ? "#16243a" : "#ffffff")
};

const primaryButtonSx = {
  py: 1.35,
  borderRadius: 3,
  fontWeight: 700,
  background: "#b45309"
};

const secondaryButtonSx = {
  py: 1.35,
  borderRadius: 3,
  fontWeight: 700,
  borderColor: "divider",
  color: "text.primary",
  "&:hover": {
    borderColor: "primary.main",
    background: "action.hover"
  }
};
