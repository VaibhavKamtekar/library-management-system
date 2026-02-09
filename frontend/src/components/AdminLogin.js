import { useState } from "react";
import axios from "axios";
import {
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Stack
} from "@mui/material";

export default function AdminLogin({ setScreen }) {
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const res = await axios.post(
        "http://localhost:5000/api/admin/login",
        { username, password }
      );

      if (res.data.success) {
        setScreen("adminDashboard");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={6} sx={{ p: 4 }}>
        <Typography variant="h6" align="center" gutterBottom>
          🔐 Admin Login
        </Typography>

        <form onSubmit={handleLogin}>
          <Stack spacing={2}>
            <TextField
              label="Username"
              name="username"
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

            {error && (
              <Typography color="error" align="center">
                {error}
              </Typography>
            )}

            <Button type="submit" variant="contained">
              Login
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
