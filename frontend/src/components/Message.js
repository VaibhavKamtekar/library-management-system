import { Container, Paper, Typography, Box } from "@mui/material";
import { useEffect } from "react";

export default function Message({ message, user, setScreen }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen("home");
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [setScreen]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={10}
        sx={{
          p: 5,
          textAlign: "center",
          borderRadius: 4,
          background: "linear-gradient(135deg, #fdfbfb, #ebedee)"
        }}
      >
        {/* Welcome Heading */}
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", color: "#1a237e", mb: 2 }}
        >
          📚 Welcome to NMITD Library
        </Typography>

        {/* Common Message (IN / OUT response) */}
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message}
        </Typography>

        {/* USER DETAILS */}
        <Box sx={{ mt: 2 }}>
          {/* STUDENT */}
          {user.type === "student" && (
            <>
              <Typography>
                <strong>Name:</strong> {user.name}
              </Typography>
              <Typography>
                <strong>Roll No:</strong> {user.rollNo}
              </Typography>
              <Typography>
                <strong>Department:</strong> {user.department}
              </Typography>
            </>
          )}

          {/* STAFF */}
          {user.type === "staff" && (
            <>
              <Typography>
                <strong>Name:</strong> {user.name}
              </Typography>
              <Typography>
                {/* <strong>Department:</strong> {user.department} */}
              </Typography>
            </>
          )}

          {/* GUEST */}
          {user.type === "guest" && (
            <Typography>
              <strong>Name:</strong> {user.name}
            </Typography>
          )}
        </Box>

        {/* Redirect Info */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 3 }}
        >
          Redirecting to Home...
        </Typography>
      </Paper>
    </Container>
  );
}
