import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import OperationalLayout from "./OperationalLayout";

const RETURN_DELAY_SECONDS = 3;

const ROLE_META = {
  student: {
    label: "Student",
    accent: "#2563eb"
  },
  staff: {
    label: "Staff",
    accent: "#0f766e"
  },
  guest: {
    label: "Guest",
    accent: "#7c3aed"
  },
  sport: {
    label: "Sport",
    accent: "#dc2626"
  }
};

export default function Message({ confirmation, user, setScreen, mode, onToggleMode }) {
  const theme = useTheme();
  const [secondsRemaining, setSecondsRemaining] = useState(RETURN_DELAY_SECONDS);

  useEffect(() => {
    setSecondsRemaining(RETURN_DELAY_SECONDS);

    const countdownTimer = setInterval(() => {
      setSecondsRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    const redirectTimer = setTimeout(() => {
      setScreen("home");
    }, RETURN_DELAY_SECONDS * 1000);

    return () => {
      clearInterval(countdownTimer);
      clearTimeout(redirectTimer);
    };
  }, [setScreen]);

  const details = confirmation?.details || {};
  const status = confirmation?.status === "EXIT" ? "EXIT" : "ENTRY";
  const isExit = status === "EXIT";
  const visitorType = String(details.type || user.type || "guest").toLowerCase();
  const roleMeta = ROLE_META[visitorType] || ROLE_META.guest;
  const visitorName = details.visitor_name || user.name || "Visitor";
  const identifier = visitorType === "staff" ? details.staff_id || user.staffId : details.roll_no || user.rollNo;
  const department = details.department || details.course || user.department || user.course;
  const headline = `${roleMeta.label} ${isExit ? "exit" : "entry"} recorded`;
  const summaryLine = isExit
    ? `${visitorName} has been checked out successfully.`
    : `${visitorName} has been checked in successfully.`;

  const detailItems = [
    { label: "Visitor name", value: visitorName },
    { label: "Role", value: roleMeta.label },
    identifier
      ? { label: visitorType === "staff" ? "Staff ID" : "Roll number", value: identifier }
      : null,
    department ? { label: "Department", value: department } : null,
    details.use_computer
      ? {
          label: "Computer usage",
          value: details.use_computer === "YES" ? "Using computer" : "Not using computer"
        }
      : null,
    details.sport ? { label: "Sport", value: details.sport } : null
  ].filter(Boolean);

  const exitItems = [
    { label: "Total time spent", value: details.duration || "-" },
    { label: "Entry time", value: formatDateTime(details.entry_time) },
    { label: "Exit time", value: formatDateTime(details.exit_time) }
  ];

  return (
    <OperationalLayout
      title="Visit confirmation"
      subtitle="The visit has been logged successfully and the desk will reset automatically for the next visitor."
      sectionLabel="Confirmation"
      maxWidth="md"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Box sx={shellSx(theme)}>
        <Box sx={heroSx(theme, roleMeta.accent)}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "stretch" }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <StatusPill label={roleMeta.label} accent={roleMeta.accent} tone="soft" />
                <StatusPill
                  label={isExit ? "EXIT RECORDED" : "ENTRY RECORDED"}
                  accent={roleMeta.accent}
                  tone="solid"
                />
              </Stack>

              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: "text.primary",
                    fontWeight: 800,
                    lineHeight: 1.15
                  }}
                >
                  {headline}
                </Typography>
                <Typography
                  sx={{
                    mt: 1.1,
                    fontSize: { xs: 18, md: 20 },
                    fontWeight: 700,
                    color: "text.primary"
                  }}
                >
                  {visitorName}
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    maxWidth: 580,
                    color: "text.secondary",
                    lineHeight: 1.75
                  }}
                >
                  {summaryLine}
                </Typography>
              </Box>
            </Stack>

            <Box sx={countdownCardSx(theme, roleMeta.accent)}>
              <Typography
                sx={{
                  fontSize: 12,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: alpha(theme.palette.text.primary, 0.72)
                }}
              >
                Auto return
              </Typography>
              <Typography
                sx={{
                  mt: 1.25,
                  fontSize: { xs: 30, md: 34 },
                  fontWeight: 800,
                  color: "text.primary",
                  lineHeight: 1
                }}
              >
                {secondsRemaining}s
              </Typography>
              <Typography sx={{ mt: 0.8, color: "text.secondary", lineHeight: 1.65 }}>
                Returning home in {secondsRemaining}s
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack spacing={3} sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <DetailSection title={isExit ? "Visitor details" : "Confirmation details"} items={detailItems} />

          {isExit && <DetailSection title="Visit summary" items={exitItems} />}

          {details.is_auto_exit && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              This visit was closed automatically after the timeout window.
            </Alert>
          )}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Button
              variant="contained"
              onClick={() => setScreen("home")}
              sx={backButtonSx(roleMeta.accent)}
            >
              Back to home
            </Button>
            <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
              Auto-return keeps the kiosk ready for the next entry.
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </OperationalLayout>
  );
}

function DetailSection({ title, items }) {
  if (!items.length) {
    return null;
  }

  return (
    <Box>
      <Typography
        sx={{
          mb: 1.5,
          fontSize: 17,
          fontWeight: 800,
          color: "text.primary"
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          gap: 1.5
        }}
      >
        {items.map((item) => (
          <Box key={item.label} sx={detailCardSx}>
            <Typography
              sx={{
                fontSize: 12,
                letterSpacing: 1.05,
                textTransform: "uppercase",
                fontWeight: 700,
                color: "text.secondary"
              }}
            >
              {item.label}
            </Typography>
            <Typography
              sx={{
                mt: 0.8,
                fontSize: 18,
                fontWeight: 700,
                color: "text.primary",
                lineHeight: 1.45
              }}
            >
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function StatusPill({ label, accent, tone }) {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.85,
        borderRadius: 999,
        border: "1px solid",
        borderColor: tone === "solid" ? "transparent" : alpha(accent, 0.24),
        background: tone === "solid" ? accent : alpha(accent, 0.1)
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.85,
          color: tone === "solid" ? "#ffffff" : accent
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function shellSx(theme) {
  return {
    background: theme.palette.background.paper
  };
}

function heroSx(theme, accent) {
  return {
    px: { xs: 2.5, md: 3.5 },
    py: { xs: 3, md: 3.5 },
    borderBottom: `1px solid ${theme.palette.divider}`,
    background:
      theme.palette.mode === "dark"
        ? `radial-gradient(circle at top right, ${alpha(accent, 0.28)}, transparent 35%), linear-gradient(135deg, ${alpha(
            accent,
            0.18
          )} 0%, ${theme.palette.background.paper} 72%)`
        : `linear-gradient(135deg, ${alpha(accent, 0.2)} 0%, ${alpha(accent, 0.08)} 38%, #ffffff 100%)`
  };
}

function countdownCardSx(theme, accent) {
  return {
    minWidth: { xs: "100%", md: 220 },
    px: 2.25,
    py: 2,
    borderRadius: 3.5,
    border: `1px solid ${alpha(accent, 0.24)}`,
    background:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.common.black, 0.18)
        : alpha(theme.palette.common.white, 0.72),
    boxShadow: `inset 0 0 0 1px ${alpha(accent, 0.08)}`
  };
}

const detailCardSx = {
  p: 2,
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  background: (theme) => (theme.palette.mode === "dark" ? "#16243a" : "#f8fbff")
};

function backButtonSx(accent) {
  return {
    minWidth: 170,
    py: 1.35,
    px: 2.6,
    borderRadius: 3,
    fontWeight: 700,
    background: accent,
    "&:hover": {
      background: accent
    }
  };
}
