import {
  Box,
  Button,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import OperationalLayout from "./OperationalLayout";

export default function Home({ setScreen, mode, onToggleMode }) {
  return (
    <OperationalLayout
      title="Library access portal"
      subtitle="Choose the required workflow to record visitor movement or open the administrative dashboard."
      sectionLabel="NMITD Library System"
      maxWidth="sm"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === "dark" ? "#16243a" : "#ffffff"
        })}
      >
        <Stack spacing={2}>
          <Button variant="contained" sx={menuButtonSx("#2563eb")} onClick={() => setScreen("student")}>
            Student Entry
          </Button>
          <Button variant="contained" sx={menuButtonSx("#0f766e")} onClick={() => setScreen("staff")}>
            Staff Entry
          </Button>
          <Button variant="contained" sx={menuButtonSx("#7c3aed")} onClick={() => setScreen("guest")}>
            Guest Entry
          </Button>
          <Button variant="outlined" sx={adminButtonSx} onClick={() => setScreen("adminLogin")}>
            Admin Login
          </Button>
        </Stack>

        <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid #e6edf5" }}>
          <Typography sx={(theme) => ({ color: theme.palette.text.secondary, textAlign: "center", lineHeight: 1.7 })}>
            Use the entry workflows for front-desk operations. Use admin only for reports, logs, and student data upload.
          </Typography>
        </Box>
      </Paper>
    </OperationalLayout>
  );
}

function menuButtonSx(color) {
  return {
    py: 1.45,
    borderRadius: 3,
    fontWeight: 700,
    background: color,
    "&:hover": {
      background: color
    }
  };
}

const adminButtonSx = {
  py: 1.45,
  borderRadius: 3,
  fontWeight: 700,
  borderColor: "divider",
  color: "text.primary",
  "&:hover": {
    borderColor: "primary.main",
    background: "action.hover"
  }
};
