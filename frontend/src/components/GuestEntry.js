import { useState } from "react";
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField
} from "@mui/material";
import OperationalLayout from "./OperationalLayout";

export default function GuestEntry({ setScreen, setUser, mode, onToggleMode }) {
  const [error, setError] = useState("");

  const handleProceed = (e) => {
    e.preventDefault();
    setError("");

    const name = e.target.name.value.trim();

    if (!name) {
      setError("Enter the guest name.");
      return;
    }

    setUser({
      type: "guest",
      name
    });
    setScreen("inout");
  };

  return (
    <OperationalLayout
      title="Guest entry"
      subtitle="Enter the guest name to continue to the visit logging screen."
      sectionLabel="Guest Workflow"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Paper sx={paperSx} component="form" onSubmit={handleProceed}>
        <Stack spacing={2.5}>
          <TextField label="Guest Name" name="name" required fullWidth />
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
  background: "#7c3aed"
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
