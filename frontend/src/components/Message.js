import { useEffect } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import OperationalLayout from "./OperationalLayout";

export default function Message({ message, user, setScreen, mode, onToggleMode }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen("home");
    }, 3000);

    return () => clearTimeout(timer);
  }, [setScreen]);

  return (
    <OperationalLayout
      title="Visit status"
      subtitle="The request has been processed. This screen will return to the home page automatically."
      sectionLabel="Confirmation"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Paper sx={paperSx}>
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ color: "#17314d", fontWeight: 700 }}>
            {message}
          </Typography>
          {user.name && <InfoRow label="Name" value={user.name} />}
          {user.rollNo && <InfoRow label="Roll Number" value={user.rollNo} />}
          {user.department && <InfoRow label="Department" value={user.department} />}
          {user.type && <InfoRow label="Visitor Type" value={user.type} />}
          <Box sx={{ pt: 1 }}>
            <Typography sx={{ color: "#60758d" }}>
              Returning to the home page in 3 seconds.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </OperationalLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <Typography sx={{ color: "#435a74" }}>
      <strong>{label}:</strong> {value}
    </Typography>
  );
}

const paperSx = {
  p: { xs: 3, md: 4 },
  borderRadius: 4,
  border: "1px solid",
  borderColor: "divider",
  background: (theme) => (theme.palette.mode === "dark" ? "#16243a" : "#ffffff")
};
