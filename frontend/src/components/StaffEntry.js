import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../api";
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Autocomplete,
  CircularProgress
} from "@mui/material";
import OperationalLayout from "./OperationalLayout";

export default function StaffEntry({ setScreen, setUser, mode, onToggleMode }) {
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmedInput = inputValue.trim();
    console.log("Typing:", trimmedInput);
    
    // Do not search if less than 2 characters
    if (trimmedInput.length < 2) {
      setOptions([]);
      return;
    }

    // If the input value matches the currently selected staff name, skip API call
    if (selectedStaff && selectedStaff.name === trimmedInput) {
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/staff?query=${encodeURIComponent(trimmedInput)}`
        );
        console.log("Typing:", trimmedInput);
        setOptions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError("Failed to fetch staff search results.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue, selectedStaff]);

  const handleAuthorize = async (e) => {
    e.preventDefault();
    setError("");

    const password = e.target.password.value.trim();

    if (!selectedStaff || !password) {
      setError("Select staff and enter password.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/api/staff/login`, {
        staffId: selectedStaff.staff_id,
        password
      });

      if (!res.data?.success) {
        setError("Invalid staff credentials.");
        return;
      }

      setUser({
        type: "staff",
        name: res.data.staff?.name || selectedStaff.name,
        staffId: String(selectedStaff.staff_id),
        department: selectedStaff.department || null,
        designation: selectedStaff.designation || null,
        is_inside: res.data.staff?.is_inside || false
      });
      setScreen("inout");
    } catch (err) {
      setError("Unable to verify staff credentials right now.");
    }
  };

  return (
    <OperationalLayout
      title="Staff login"
      subtitle="Type your name (minimum 2 characters) and enter password."
      sectionLabel="Staff Workflow"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Paper sx={paperSx} component="form" onSubmit={handleAuthorize}>
        <Stack spacing={2.5}>
          <Autocomplete
            id="staff-autocomplete"
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            isOptionEqualToValue={(option, value) => option.staff_id === value.staff_id}
            getOptionLabel={(option) => option.name || ""}
            options={options}
            loading={loading}
            value={selectedStaff}
            onChange={(event, newValue) => {
              setSelectedStaff(newValue);
              setError("");
            }}
            inputValue={inputValue}
           onInputChange={(event, newInputValue, reason) => {
  setInputValue(newInputValue);

  if (reason === "clear") {
    setSelectedStaff(null);
    setOptions([]);
  }
}}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Staff"
                required
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
            noOptionsText="No staff found"
          />

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
