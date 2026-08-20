import { useState } from "react";
import axios from "axios";
import API_BASE from "../api";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  Avatar,
  Divider,
  Fade
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import {
  Person as PersonIcon,
  Badge as BadgeIcon,
  Class as ClassIcon,
  LocalLibrary as LibraryIcon,
  DesktopMac as ComputerIcon,
  Gamepad as GamepadIcon,
  SportsTennis as TennisIcon,
  Casino as ChessIcon,
  EmojiEvents as MonopolyIcon,
  HowToReg as LoginIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import OperationalLayout from "./OperationalLayout";

// Custom styled components for premium feel
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 24,
  border: "1px solid",
  borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
  background: theme.palette.mode === "dark" 
    ? "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)" 
    : "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow: theme.palette.mode === "dark" 
    ? "0 20px 40px -10px rgba(0,0,0,0.5)" 
    : "0 20px 40px -10px rgba(0,0,0,0.05)",
  position: "relative",
  overflow: "hidden"
}));

const ActivityCard = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(1.5),
  borderRadius: 16,
  border: "2px solid",
  borderColor: selected 
    ? theme.palette.primary.main 
    : theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
  background: selected
    ? theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.05)"
    : theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "#ffffff",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  "&:hover": {
    transform: "translateY(-4px)",
    borderColor: selected ? theme.palette.primary.main : theme.palette.primary.light,
    boxShadow: theme.palette.mode === "dark" ? "0 10px 20px -10px rgba(0,0,0,0.5)" : "0 10px 20px -10px rgba(0,0,0,0.1)"
  }
}));

export default function InOut({ user, setConfirmation, setScreen, mode, onToggleMode }) {
  const theme = useTheme();
  const [useComputer, setUseComputer] = useState("NO");
  const [sport, setSport] = useState("");
  const [error, setError] = useState("");

  // Computed activity state
  let currentActivity = "library";
  if (useComputer === "YES") currentActivity = "computer";
  if (sport === "Carrom") currentActivity = "carrom";
  if (sport === "Table Tennis") currentActivity = "tennis";
  if (sport === "Chess") currentActivity = "chess";
  if (sport === "Monopoly") currentActivity = "monopoly";

  const handleActivitySelect = (activity) => {
    if (activity === "library") {
      setUseComputer("NO");
      setSport("");
    } else if (activity === "computer") {
      setUseComputer("YES");
      setSport("");
    } else if (activity === "carrom") {
      setUseComputer("NO");
      setSport("Carrom");
    } else if (activity === "tennis") {
      setUseComputer("NO");
      setSport("Table Tennis");
    } else if (activity === "chess") {
      setUseComputer("NO");
      setSport("Chess");
    } else if (activity === "monopoly") {
      setUseComputer("NO");
      setSport("Monopoly");
    }
  };

  const handleSubmitVisit = async () => {
    setError("");

    try {
      let data = {};

      if (user.type === "student") {
        if (sport) {
          data = {
            type: "sport",
            roll_no: user.rollNo,
            sport
          };
        } else {
          data = {
            type: "student",
            roll_no: user.rollNo,
            use_computer: useComputer
          };
        }
      }

      if (user.type === "staff") {
        data = {
          type: "staff",
          visitor_type: "staff",
          name: user.name,
          staff_id: Number(user.staffId)
        };
      }

      if (user.type === "guest") {
        data = {
          type: "guest",
          guest_name: user.name
        };
      }

      const res = await axios.post(`${API_BASE}/api/visit`, data);
      setConfirmation({
        status: res.data.status,
        message: res.data.status === "ENTRY" ? "Entry recorded" : "Exit recorded",
        details: res.data.data || {}
      });
      if (res.data.status === "ENTRY") {
        setScreen("reminder");
      } else {
        setScreen("message");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError(err.response.data?.message || "Visitor not found.");
        return;
      }

      if (err.response?.status === 400) {
        setError(err.response.data?.message || "Invalid visit request.");
        return;
      }

      if (err.response?.data?.message) {
        setError(err.response.data.message);
        return;
      }

      setError("Unable to record visit right now. Please try again.");
    }
  };

  return (
    <OperationalLayout
      title="Visit Check-In/Out"
      subtitle="Verify details below to process the entry or exit."
      sectionLabel="Gateway"
      mode={mode}
      onToggleMode={onToggleMode}
    >
      <Fade in timeout={500}>
        <StyledPaper>
          {/* Top accent line */}
          <Box 
            sx={{ 
              position: 'absolute', top: 0, left: 0, right: 0, height: 4, 
              background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)' 
            }} 
          />

          <Box sx={{ mb: 4 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Avatar 
                sx={{ 
                  width: 88, 
                  height: 88, 
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  boxShadow: "0 8px 16px -4px rgba(99, 102, 241, 0.4)",
                  border: "4px solid",
                  borderColor: theme.palette.background.paper
                }}
              >
                <PersonIcon sx={{ fontSize: 44 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a', mb: 1, letterSpacing: -0.5 }}>
                  {user.name || "Unknown Visitor"}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                  <Chip 
                    size="small" 
                    icon={<BadgeIcon sx={{ fontSize: "1rem !important" }} />} 
                    label={user.type?.toUpperCase() || "N/A"} 
                    sx={{ 
                      fontWeight: 700, 
                      borderRadius: 1.5,
                      background: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe',
                      color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0369a1',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd'
                    }} 
                  />
                  {user.rollNo && (
                    <Chip size="small" label={`Roll No: ${user.rollNo}`} sx={{ borderRadius: 1.5, fontWeight: 600, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
                  )}
                  {user.staffId && (
                    <Chip size="small" label={`Staff ID: ${user.staffId}`} sx={{ borderRadius: 1.5, fontWeight: 600, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
                  )}
                  {user.department && (
                    <Chip size="small" icon={<ClassIcon sx={{ fontSize: "1rem !important" }} />} label={user.department} sx={{ borderRadius: 1.5, fontWeight: 600, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
                  )}
                  {user.designation && (
                    <Chip size="small" icon={<PersonIcon sx={{ fontSize: "1rem !important" }} />} label={user.designation} sx={{ borderRadius: 1.5, fontWeight: 600, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>

          {user.type === "student" && !user.is_inside && (
            <Fade in timeout={800}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "text.secondary", textTransform: "uppercase", letterSpacing: 1.2 }}>
                  Purpose of Visit
                </Typography>
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, 
                    gap: 2 
                  }}
                >
                  <ActivityCard selected={currentActivity === "library"} onClick={() => handleActivitySelect("library")}>
                    <Stack alignItems="center" spacing={1.5}>
                      <Avatar sx={{ 
                        bgcolor: currentActivity === "library" ? "primary.main" : theme.palette.mode === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                        color: currentActivity === "library" ? "#fff" : "text.secondary",
                        transition: "all 0.3s"
                      }}>
                        <LibraryIcon />
                      </Avatar>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, textAlign: "center", width: "100%", fontSize: { xs: '0.8rem', sm: '0.75rem', md: '0.875rem' }, color: currentActivity === "library" ? "primary.main" : "text.primary" }}>
                        Library Study
                      </Typography>
                    </Stack>
                  </ActivityCard>
                  
                  <ActivityCard selected={currentActivity === "computer"} onClick={() => handleActivitySelect("computer")}>
                    <Stack alignItems="center" spacing={1.5}>
                      <Avatar sx={{ 
                        bgcolor: currentActivity === "computer" ? "primary.main" : theme.palette.mode === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                        color: currentActivity === "computer" ? "#fff" : "text.secondary",
                        transition: "all 0.3s"
                      }}>
                        <ComputerIcon />
                      </Avatar>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, textAlign: "center", width: "100%", fontSize: { xs: '0.8rem', sm: '0.75rem', md: '0.875rem' }, color: currentActivity === "computer" ? "primary.main" : "text.primary" }}>
                        Computer Lab
                      </Typography>
                    </Stack>
                  </ActivityCard>

                  <ActivityCard selected={currentActivity === "carrom"} onClick={() => handleActivitySelect("carrom")}>
                    <Stack alignItems="center" spacing={1.5}>
                      <Avatar sx={{ 
                        bgcolor: currentActivity === "carrom" ? "primary.main" : theme.palette.mode === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                        color: currentActivity === "carrom" ? "#fff" : "text.secondary",
                        transition: "all 0.3s"
                      }}>
                        <GamepadIcon />
                      </Avatar>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, textAlign: "center", width: "100%", fontSize: { xs: '0.8rem', sm: '0.75rem', md: '0.875rem' }, color: currentActivity === "carrom" ? "primary.main" : "text.primary" }}>
                        Carrom
                      </Typography>
                    </Stack>
                  </ActivityCard>

                  <ActivityCard selected={currentActivity === "tennis"} onClick={() => handleActivitySelect("tennis")}>
                    <Stack alignItems="center" spacing={1.5}>
                      <Avatar sx={{ 
                        bgcolor: currentActivity === "tennis" ? "primary.main" : theme.palette.mode === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                        color: currentActivity === "tennis" ? "#fff" : "text.secondary",
                        transition: "all 0.3s"
                      }}>
                        <TennisIcon />
                      </Avatar>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, textAlign: "center", width: "100%", fontSize: { xs: '0.8rem', sm: '0.75rem', md: '0.875rem' }, color: currentActivity === "tennis" ? "primary.main" : "text.primary" }}>
                        Table Tennis
                      </Typography>
                    </Stack>
                  </ActivityCard>

                  <ActivityCard selected={currentActivity === "chess"} onClick={() => handleActivitySelect("chess")}>
                    <Stack alignItems="center" spacing={1.5}>
                      <Avatar sx={{ 
                        bgcolor: currentActivity === "chess" ? "primary.main" : theme.palette.mode === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                        color: currentActivity === "chess" ? "#fff" : "text.secondary",
                        transition: "all 0.3s"
                      }}>
                        <ChessIcon />
                      </Avatar>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, textAlign: "center", width: "100%", fontSize: { xs: '0.8rem', sm: '0.75rem', md: '0.875rem' }, color: currentActivity === "chess" ? "primary.main" : "text.primary" }}>
                        Chess
                      </Typography>
                    </Stack>
                  </ActivityCard>

                  <ActivityCard selected={currentActivity === "monopoly"} onClick={() => handleActivitySelect("monopoly")}>
                    <Stack alignItems="center" spacing={1.5}>
                      <Avatar sx={{ 
                        bgcolor: currentActivity === "monopoly" ? "primary.main" : theme.palette.mode === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                        color: currentActivity === "monopoly" ? "#fff" : "text.secondary",
                        transition: "all 0.3s"
                      }}>
                        <MonopolyIcon />
                      </Avatar>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, textAlign: "center", width: "100%", fontSize: { xs: '0.8rem', sm: '0.75rem', md: '0.875rem' }, color: currentActivity === "monopoly" ? "primary.main" : "text.primary" }}>
                        Monopoly
                      </Typography>
                    </Stack>
                  </ActivityCard>
                </Box>
              </Box>
            </Fade>
          )}

          {error && (
            <Fade in timeout={400}>
              <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>
            </Fade>
          )}

          <Divider sx={{ mb: 3, borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button 
              variant="contained" 
              size="large"
              startIcon={<LoginIcon />}
              onClick={handleSubmitVisit}
              sx={{ 
                flex: 1, 
                py: 1.5, 
                borderRadius: 3, 
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                background: user.is_inside 
                  ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" 
                  : "linear-gradient(135deg, #0f766e 0%, #064e3b 100%)",
                boxShadow: user.is_inside 
                  ? "0 8px 16px -4px rgba(239, 68, 68, 0.4)" 
                  : "0 8px 16px -4px rgba(15, 118, 110, 0.4)",
                "&:hover": {
                  background: user.is_inside 
                    ? "linear-gradient(135deg, #f87171 0%, #ef4444 100%)" 
                    : "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                  boxShadow: user.is_inside 
                    ? "0 12px 20px -4px rgba(239, 68, 68, 0.6)" 
                    : "0 12px 20px -4px rgba(15, 118, 110, 0.6)",
                  transform: "translateY(-1px)"
                },
                transition: "all 0.2s"
              }}
            >
              {user.is_inside ? "Confirm Exit" : "Confirm Entry"}
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              startIcon={<CancelIcon />}
              onClick={() => setScreen("home")}
              sx={{ 
                py: 1.5, 
                px: 4,
                borderRadius: 3, 
                fontWeight: 700,
                textTransform: 'none',
                borderWidth: 2,
                color: theme.palette.text.secondary,
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                "&:hover": { 
                  borderWidth: 2,
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                }
              }}
            >
              Cancel
            </Button>
          </Stack>
        </StyledPaper>
      </Fade>
    </OperationalLayout>
  );
}
