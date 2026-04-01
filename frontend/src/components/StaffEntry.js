import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField
} from "@mui/material";
import OperationalLayout from "./OperationalLayout";

export default function StaffEntry({ setScreen, setUser, mode, onToggleMode }) {
  const [error, setError] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/staff");
        setStaffList(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError("Failed to load staff list.");
      }
    };

    loadStaff();
  }, []);

  const handleAuthorize = async (e) => {
    e.preventDefault();
    setError("");

    const password = e.target.password.value.trim();
    const selectedStaff = staffList.find(
      (staff) => String(staff.staff_id) === String(selectedStaffId)
    );

    if (!selectedStaffId || !password) {
      setError("Select staff and enter password.");
      return;
    }

    if (!selectedStaff) {
      setError("Selected staff record was not found. Please try again.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/staff/login", {
        staffId: selectedStaffId,
        password
      });

      if (!res.data?.success) {
        setError("Invalid staff credentials.");
        return;
      }

      setUser({
        type: "staff",
        name: res.data.staff?.name || selectedStaff.name,
        staffId: String(selectedStaff.staff_id)
      });
      setScreen("inout");
    } catch (err) {
      setError("Unable to verify staff credentials right now.");
    }
  };

  return (
    <OperationalLayout
      title="Staff login"
      subtitle="Select your name and enter password to continue."
      sectionLabel="Staff Workflow"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Paper sx={paperSx} component="form" onSubmit={handleAuthorize}>
        <Stack spacing={2.5}>
          <TextField
            select
            label="Select Staff"
            value={selectedStaffId}
            onChange={(e) => {
              setSelectedStaffId(e.target.value);
              setError("");
            }}
            required
            fullWidth
          >
            <MenuItem value="">Select Staff</MenuItem>
            {staffList.map((staff) => (
              <MenuItem
                key={staff.staff_id}
                value={String(staff.staff_id)}
              >
                {staff.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Password"
            name="password"
            type="password"
            required
            fullWidth
          />

          {error && <Alert severity="error">{error}</Alert>}

          <Button type="submit" variant="contained" sx={primaryButtonSx}>
            Continue
          </Button>

          <Button
            variant="outlined"
            sx={secondaryButtonSx}
            onClick={() => setScreen("home")}
          >
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
  background: (theme) =>
    theme.palette.mode === "dark" ? "#16243a" : "#ffffff"
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
