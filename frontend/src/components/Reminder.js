import { useEffect, useState } from "react";
import {
  Box,
  Fade,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { WarningAmber as WarningAmberIcon } from "@mui/icons-material";
import OperationalLayout from "./OperationalLayout";

const REMINDER_DELAY_SECONDS = 3;

export default function Reminder({ setScreen, mode, onToggleMode }) {
  const theme = useTheme();
  const [secondsRemaining, setSecondsRemaining] = useState(REMINDER_DELAY_SECONDS);

  useEffect(() => {
    setSecondsRemaining(REMINDER_DELAY_SECONDS);

    const countdownTimer = setInterval(() => {
      setSecondsRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    const redirectTimer = setTimeout(() => {
      setScreen("message");
    }, REMINDER_DELAY_SECONDS * 1000);

    return () => {
      clearInterval(countdownTimer);
      clearTimeout(redirectTimer);
    };
  }, [setScreen]);

  const accent = "#d97706"; // amber — matches WarningAmberIcon tone

  return (
    <OperationalLayout
      title="Action required"
      subtitle="Please read this important reminder before proceeding."
      sectionLabel="Reminder"
      maxWidth="sm"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Fade in timeout={400}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.05)",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)"
                : "linear-gradient(145deg, #ffffff 0%, #fffbeb 100%)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 20px 40px -10px rgba(0,0,0,0.5)"
                : "0 20px 40px -10px rgba(0,0,0,0.08)",
            overflow: "hidden",
            position: "relative"
          }}
        >
          {/* Top accent bar */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background:
                "linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
            }}
          />

          {/* Hero section */}
          <Box
            sx={{
              px: { xs: 2.5, md: 3.5 },
              py: { xs: 3, md: 3.5 },
              borderBottom: `1px solid ${theme.palette.divider}`,
              background:
                theme.palette.mode === "dark"
                  ? `radial-gradient(circle at top right, ${alpha(accent, 0.28)}, transparent 40%), linear-gradient(135deg, ${alpha(accent, 0.18)} 0%, ${theme.palette.background.paper} 72%)`
                  : `linear-gradient(135deg, ${alpha(accent, 0.18)} 0%, ${alpha(accent, 0.06)} 40%, #ffffff 100%)`
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              {/* Icon + text */}
              <Stack direction="row" spacing={2.5} alignItems="flex-start">
                <Box
                  sx={{
                    mt: 0.25,
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: alpha(accent, 0.15),
                    border: `1px solid ${alpha(accent, 0.3)}`
                  }}
                >
                  <WarningAmberIcon sx={{ fontSize: 30, color: accent }} />
                </Box>

                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: "text.primary",
                      lineHeight: 1.2,
                      mb: 0.75
                    }}
                  >
                    Remember to Record Your Exit
                  </Typography>
                  <Typography
                    sx={{
                      color: "text.secondary",
                      lineHeight: 1.75,
                      maxWidth: 420
                    }}
                  >
                    Before leaving the library, you must complete the entry
                    process again so your <strong>EXIT</strong> is recorded.
                  </Typography>
                </Box>
              </Stack>

              {/* Countdown card */}
              <Box
                sx={{
                  minWidth: { xs: "100%", md: 164 },
                  px: 2.25,
                  py: 2,
                  borderRadius: 3.5,
                  border: `1px solid ${alpha(accent, 0.24)}`,
                  background:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.common.black, 0.18)
                      : alpha(theme.palette.common.white, 0.82),
                  boxShadow: `inset 0 0 0 1px ${alpha(accent, 0.08)}`,
                  textAlign: "center"
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: alpha(theme.palette.text.primary, 0.72)
                  }}
                >
                  Continuing in
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    fontSize: { xs: 30, md: 34 },
                    fontWeight: 800,
                    color: accent,
                    lineHeight: 1
                  }}
                >
                  {secondsRemaining}s
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Footer note */}
          <Box sx={{ px: { xs: 2.5, md: 3.5 }, py: { xs: 2, md: 2.5 } }}>
            <Typography
              sx={{
                fontSize: 13,
                color: "text.secondary",
                lineHeight: 1.7,
                textAlign: "center"
              }}
            >
              This screen will advance automatically. No action required.
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </OperationalLayout>
  );
}
