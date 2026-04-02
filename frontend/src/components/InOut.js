import { useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography
} from "@mui/material";
import OperationalLayout from "./OperationalLayout";

export default function InOut({ user, setMessage, setScreen, mode, onToggleMode }) {
  const [useComputer, setUseComputer] = useState("NO");
  const [sport, setSport] = useState("");
  const [error, setError] = useState("");

  const handleComputerChange = (value) => {
    setUseComputer(value);

    if (value === "YES") {
      setSport("");
    }
  };

  const handleSportChange = (value) => {
    setSport(value);

    if (value) {
      setUseComputer("NO");
    }
  };

  const handleSubmitVisit = async () => {
    setError("");

    try {
      let data = {};

      if (user.type === "student") {
        if (sport) {
          data = {
            type: "sport",
            roll_no: user.rollNo,
            sport
          };
        } else {
          data = {
            type: "student",
            roll_no: user.rollNo,
            use_computer: useComputer
          };
        }
      }

      if (user.type === "staff") {
        data = {
          type: "staff",
          staff_id: user.staffId
        };
      }

      if (user.type === "guest") {
        data = {
          type: "guest",
          guest_name: user.name
        };
      }

      const res = await axios.post("http://localhost:5000/api/visit", data);
      setMessage(res.data.status === "ENTRY" ? "Entry recorded" : "Exit recorded");
      setScreen("message");
    } catch (err) {
      if (err.response?.status === 404) {
        setError(err.response.data?.message || "Visitor not found.");
        return;
      }

      if (err.response?.status === 400) {
        setError(err.response.data?.message || "Invalid visit request.");
        return;
      }

      if (err.response?.data?.message) {
        setError(err.response.data.message);
        return;
      }

      setError("Unable to record visit right now. Please try again.");
    }
  };

  const displayType =
    user.type === "student" && sport ? "sport" : user.type;

  return (
    <OperationalLayout
      title="Visit logging"
      subtitle="Confirm the details below, then mark whether this is an entry or exit."
      sectionLabel="IN / OUT"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Paper sx={paperSx}>
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ color: "#17314d", fontWeight: 700 }}>
              Current visitor
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}>
              <Chip label={`Type: ${displayType || "N/A"}`} />
              {user.name && <Chip label={`Name: ${user.name}`} />}
              {user.staffId && <Chip label={`Staff ID: ${user.staffId}`} />}
              {user.rollNo && <Chip label={`Roll No: ${user.rollNo}`} />}
              {user.department && <Chip label={`Department: ${user.department}`} />}
              {sport && <Chip label={`Sport: ${sport}`} color="success" />}
            </Stack>
          </Box>

          {user.type === "student" && (
            <>
              <FormControl disabled={!!sport}>
                <FormLabel>
                  Computer usage {sport && "(Disabled when sport selected)"}
                </FormLabel>
                <RadioGroup
                  row
                  value={useComputer}
                  onChange={(e) => handleComputerChange(e.target.value)}
                >
                  <FormControlLabel value="YES" control={<Radio />} label="Using computer" />
                  <FormControlLabel value="NO" control={<Radio />} label="Not using computer" />
                </RadioGroup>
              </FormControl>

              <FormControl sx={{ mt: 2 }} disabled={useComputer === "YES"}>
                <FormLabel>
                  Select Sport (Optional) {useComputer === "YES" && "(Disabled while using computer)"}
                </FormLabel>
                <RadioGroup
                  row
                  value={sport}
                  onChange={(e) => handleSportChange(e.target.value)}
                >
                  <FormControlLabel value="Carrom" control={<Radio />} label="Carrom" />
                  <FormControlLabel value="Table Tennis" control={<Radio />} label="Table Tennis" />
                </RadioGroup>
              </FormControl>
            </>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button variant="contained" sx={submitButtonSx} onClick={handleSubmitVisit}>
              {sport ? "Submit Sport Entry" : "Submit Visit"}
            </Button>
            <Button variant="outlined" sx={secondaryButtonSx} onClick={() => setScreen("home")}>
              Cancel
            </Button>
          </Stack>
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

const submitButtonSx = {
  flex: 1,
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
