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

export default function StaffEntry({ setScreen, setUser, mode, onToggleMode }) {
  const [error, setError] = useState("");

  const handleAuthorize = async (e) => {
    e.preventDefault();
    setError("");

    const staffId = e.target.staffId.value.trim();
    const name = e.target.name.value.trim();
    const password = e.target.password.value.trim();

    if (!staffId || !name || !password) {
      setError("Enter staff ID, staff name, and password.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/staff/login", {
        name,
        password
      });

      if (!res.data?.success) {
        setError("Invalid staff credentials.");
        return;
      }

      setUser({
        type: "staff",
        name,
        staffId
      });
      setScreen("inout");
    } catch (err) {
      setError("Unable to verify staff credentials right now.");
    }
  };

  return (
    <OperationalLayout
      title="Staff login"
      subtitle="Use the registered staff credentials to continue to the visit logging screen."
      sectionLabel="Staff Workflow"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Paper sx={paperSx} component="form" onSubmit={handleAuthorize}>
        <Stack spacing={2.5}>
          <TextField label="Staff ID" name="staffId" required fullWidth />
          <TextField label="Staff Name" name="name" required fullWidth />
          <TextField label="Password" name="password" type="password" required fullWidth />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" sx={primaryButtonSx}>
            Continue
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
  background: "#0f766e"
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
