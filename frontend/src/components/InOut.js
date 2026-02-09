import { useState } from "react";
import axios from "axios";
import {
  Button,
  Container,
  Paper,
  Typography,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from "@mui/material";

export default function InOut({ user, setMessage, setScreen }) {
  // NEW: computer usage (only for students)
  const [useComputer, setUseComputer] = useState("NO");

  const handleIn = async () => {
    try {
      let url = "";
      let data = {};

      if (user.type === "student") {
        url = "http://localhost:5000/api/student/in";
        data = {
          name: user.name,
          roll_no: user.rollNo,
          use_computer: useComputer   // ✅ NEW FIELD
        };
      }

      if (user.type === "staff") {
        url = "http://localhost:5000/api/staff/in";
        data = { name: user.name };
      }

      if (user.type === "guest") {
        url = "http://localhost:5000/api/guest/in";
        data = { name: user.name };
      }

      const res = await axios.post(url, data);
      setMessage(res.data.message);
      setScreen("message");
    } catch (err) {
      setMessage("Error recording IN");
      setScreen("message");
    }
  };

  const handleOut = async () => {
    try {
      let url = "";
      let data = {};

      if (user.type === "student") {
        url = "http://localhost:5000/api/student/out";
        data = { roll_no: user.rollNo };
      }

      if (user.type === "staff") {
        url = "http://localhost:5000/api/staff/out";
        data = { name: user.name };
      }

      if (user.type === "guest") {
        url = "http://localhost:5000/api/guest/out";
        data = { name: user.name };
      }

      const res = await axios.post(url, data);
      setMessage(res.data.message);
      setScreen("message");
    } catch (err) {
      setMessage("Error recording OUT");
      setScreen("message");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={6} sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          🚪 Library Entry / Exit
        </Typography>

        {/* ===== COMPUTER USAGE (STUDENT ONLY) ===== */}
        {user.type === "student" && (
          <FormControl sx={{ mt: 2 }}>
            <FormLabel>Are you using computer?</FormLabel>
            <RadioGroup
              row
              value={useComputer}
              onChange={(e) => setUseComputer(e.target.value)}
            >
              <FormControlLabel
                value="YES"
                control={<Radio />}
                label="Yes"
              />
              <FormControlLabel
                value="NO"
                control={<Radio />}
                label="No"
              />
            </RadioGroup>
          </FormControl>
        )}

        {/* ===== IN / OUT BUTTONS ===== */}
        <Stack spacing={2} mt={3}>
          <Button
            variant="contained"
            color="success"
            onClick={handleIn}
          >
            IN
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleOut}
          >
            OUT
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
