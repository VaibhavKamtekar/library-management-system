import { Button, Container, Paper, TextField, Typography, Stack } from "@mui/material";
import axios from "axios";
export default function StudentEntry({ setScreen, setUser }) {
  const handleValidate = async (e) => {
    e.preventDefault();

    const name = e.target.name.value;
    const rollNo = e.target.rollNo.value;

    if (!name || !rollNo) {
      alert("Please enter name and roll number");
      return;
    }
    try {
      const res = await axios.post(
        "http://localhost:5000/api/student/validate",
        { roll_no: rollNo }
      );

      // Save student data for next screen
      setUser({
        type: "student",
        name: name,
        rollNo: rollNo,
        department: res.data.department
      });

      setScreen("inout");
    } catch (err) {
      if (err.response && err.response.status === 404) {
        alert("Student not found. Please check roll number.");
      } else {
        alert("Server error. Please try again.");
      }
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={6} sx={{ p: 4 }}>
        <Typography variant="h6" align="center" gutterBottom>
          📖 Student Entry
        </Typography>

        <form onSubmit={handleValidate}>
          <Stack spacing={2}>
            <TextField
              label="Student Name"
              name="name"
              fullWidth
              required
            />

            <TextField
              label="Roll Number"
              name="rollNo"
              fullWidth
              required
            />

            <Button type="submit" variant="contained" color="success">
              Validate
            </Button>

            <Button
              variant="outlined"
              onClick={() => setScreen("home")}
            >
              Back
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
