import {
  Button,
  Container,
  Paper,
  Typography,
  Stack,
  Box
} from "@mui/material";

export default function Home({ setScreen }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e3c72, #2a5298)"
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={20}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            animation: "fadeIn 0.8s ease-in-out",
            "@keyframes fadeIn": {
              from: { opacity: 0, transform: "translateY(20px)" },
              to: { opacity: 1, transform: "translateY(0)" }
            }
          }}
        >
          {/* HEADER */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "#0d47a1" }}
            >
              📚 NMITD Library
            </Typography>
            <Typography variant="body1" sx={{ color: "#444", mt: 1 }}>
              Library Entry Management System
            </Typography>
          </Box>

          {/* BUTTONS */}
          <Stack spacing={2.5}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              sx={{
                background: "linear-gradient(90deg, #1976d2, #42a5f5)",
                fontWeight: "bold",
                py: 1.3,
                borderRadius: 2,
                boxShadow: "0 6px 15px rgba(25,118,210,0.4)",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 10px 20px rgba(25,118,210,0.6)"
                }
              }}
              onClick={() => setScreen("student")}
            >
              Student Entry
            </Button>

            <Button
              fullWidth
              size="large"
              variant="contained"
              sx={{
                background: "linear-gradient(90deg, #2e7d32, #66bb6a)",
                fontWeight: "bold",
                py: 1.3,
                borderRadius: 2,
                boxShadow: "0 6px 15px rgba(46,125,50,0.4)",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 10px 20px rgba(46,125,50,0.6)"
                }
              }}
              onClick={() => setScreen("staff")}
            >
              Staff Entry
            </Button>

            <Button
              fullWidth
              size="large"
              variant="contained"
              sx={{
                background: "linear-gradient(90deg, #6a1b9a, #ab47bc)",
                fontWeight: "bold",
                py: 1.3,
                borderRadius: 2,
                boxShadow: "0 6px 15px rgba(106,27,154,0.4)",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 10px 20px rgba(106,27,154,0.6)"
                }
              }}
              onClick={() => setScreen("guest")}
            >
              Guest Entry
            </Button>

            <Button
              fullWidth
              size="large"
              variant="outlined"
              sx={{
                borderColor: "#d32f2f",
                color: "#d32f2f",
                fontWeight: "bold",
                py: 1.3,
                borderRadius: 2,
                transition: "all 0.3s",
                "&:hover": {
                  backgroundColor: "#d32f2f",
                  color: "#fff",
                  boxShadow: "0 6px 15px rgba(211,47,47,0.5)"
                }
              }}
              onClick={() => setScreen("adminLogin")}
            >
              Admin Login
            </Button>
          </Stack>

          {/* FOOTER */}
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 4, color: "#555" }}
          >
            © NMITD • Library Management System
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
