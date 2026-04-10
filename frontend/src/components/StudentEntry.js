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

export default function StudentEntry({ setScreen, setUser, mode, onToggleMode }) {
  const [error, setError] = useState("");

  const handleValidate = async (e) => {
    e.preventDefault();
    setError("");

    const rollNo = e.target.rollNo.value.trim();

    if (!rollNo) {
      setError("Enter the student roll number.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/student/validate", {
        roll_no: rollNo
      });

      setUser({
        type: "student",
        name: res.data.name,
        rollNo,
        course: res.data.course,
        department: res.data.department || res.data.course
      });

      setScreen("inout");
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
        return;
      }

      if (err.response?.status === 404) {
        setError("Student not found. Check the roll number and try again.");
        return;
      }

      setError("Unable to validate student details right now.");
    }
  };

  return (
    <OperationalLayout
      title="Student entry"
      subtitle="Enter the student roll number to validate the record before marking entry or exit."
      sectionLabel="Student Workflow"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Paper sx={paperSx} component="form" onSubmit={handleValidate}>
        <Stack spacing={2.5}>
          <TextField
            label="Roll Number"
            name="rollNo"
            required
            fullWidth
            helperText="Student details will be loaded automatically from the database."
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" sx={primaryButtonSx}>
            Validate Student
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
  background: "#2563eb"
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
