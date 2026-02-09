import { Button, Container, Paper, TextField, Typography, Stack } from "@mui/material";

export default function GuestEntry({ setScreen, setUser }) {
  const handleProceed = (e) => {
    e.preventDefault();

    const name = e.target.name.value;

    if (!name) {
      alert("Please enter guest name");
      return;
    }

    // Save guest data
    setUser({
      type: "guest",
      name: name,
    });

    setScreen("inout");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={6} sx={{ p: 4 }}>
        <Typography variant="h6" align="center" gutterBottom>
          📜 Guest Entry
        </Typography>

        <form onSubmit={handleProceed}>
          <Stack spacing={2}>
            <TextField
              label="Guest Name"
              name="name"
              fullWidth
              required
            />

            <Button type="submit" variant="contained" color="success">
              Proceed
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
