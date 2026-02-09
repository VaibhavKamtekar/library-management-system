import { Button, Container, Paper, TextField, Typography, Stack } from "@mui/material";
import axios from "axios";

export default function StaffEntry({ setScreen, setUser }) {
  const handleAuthorize = async (e) => {
    e.preventDefault();

    const name = e.target.name.value;
    const password = e.target.password.value;

    if (!name) {
      alert("Please enter teacher name");
      return;
    }
    if (!password) {
      alert("Please enter password");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/staff/login", {
        name,
        password
      });

      if (!res.data?.success) {
        alert("Invalid staff credentials");
        return;
      }
    } catch (err) {
      alert("Login failed. Please try again.");
      return;
    }

    // Save staff data
    setUser({
      type: "staff",
      name: name,
    });

    setScreen("inout");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={6} sx={{ p: 4 }}>
        <Typography variant="h6" align="center" gutterBottom>
          🎓 Staff Entry
        </Typography>

        <form onSubmit={handleAuthorize}>
          <Stack spacing={2}>
            <TextField
              label="Teacher Name"
              name="name"
              fullWidth
              required
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              fullWidth
              required
            />

            <Button type="submit" variant="contained" color="success">
              Authorize
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
