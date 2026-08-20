import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../api";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import OperationalLayout from "./OperationalLayout";

const DASHBOARD_API_URL = `${API_BASE}/api/admin/footfall`;
const MONTHLY_FOOTFALL_API_URL = `${API_BASE}/api/admin/monthly-footfall`;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const VISITOR_COLORS = {
  Students: "#2563eb",
  Sport: "#dc2626",
  Computer: "#ea580c",
  Staff: "#0f766e",
  Guests: "#7c3aed"
};

export default function Home({ setScreen, mode: themeMode, onToggleMode, animateDashboard }) {
  const theme = useTheme();
  const [mode, setMode] = useState("entry");
  const [footfall, setFootfall] = useState({
    students_today: 0,
    sport_today: 0,
    computer_today: 0,
    staff_today: 0,
    guests_today: 0
  });
  const [monthlyFootfall, setMonthlyFootfall] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const chartData = [
    { name: "Students", count: footfall.students_today, fill: VISITOR_COLORS.Students },
    { name: "Sport", count: footfall.sport_today, fill: VISITOR_COLORS.Sport },
    { name: "Computer", count: footfall.computer_today, fill: VISITOR_COLORS.Computer },
    { name: "Staff", count: footfall.staff_today, fill: VISITOR_COLORS.Staff },
    { name: "Guests", count: footfall.guests_today, fill: VISITOR_COLORS.Guests }
  ];
  const pieData = [
    { name: "Students", value: Number(footfall.students_today) || 0 },
    { name: "Sport", value: Number(footfall.sport_today) || 0 },
    { name: "Computer", value: Number(footfall.computer_today) || 0 },
    { name: "Staff", value: Number(footfall.staff_today) || 0 },
    { name: "Guests", value: Number(footfall.guests_today) || 0 }
  ];

  //checking

  // console.log("pieData:", pieData);

  const chartAxisColor = theme.palette.text.secondary;
  const chartGridColor = theme.palette.divider;
  const todayCards = [
    { label: "Students Today", value: footfall.students_today, accent: VISITOR_COLORS.Students },
    { label: "Sport Today", value: footfall.sport_today, accent: VISITOR_COLORS.Sport },
    { label: "Computer Usage", value: footfall.computer_today, accent: VISITOR_COLORS.Computer },
    { label: "Staff Today", value: footfall.staff_today, accent: VISITOR_COLORS.Staff },
    { label: "Guests Today", value: footfall.guests_today, accent: VISITOR_COLORS.Guests }
  ];

  useEffect(() => {
    if (mode !== "dashboard") {
      return undefined;
    }

    let ignore = false;

    const loadDashboard = async () => {
      setLoadingDashboard(true);
      setDashboardError("");

      try {
        const [footfallResponse, monthlyResponse] = await Promise.all([
          axios.get(DASHBOARD_API_URL),
          axios.get(MONTHLY_FOOTFALL_API_URL)
        ]);

        if (!ignore) {
          setFootfall({
            students_today: footfallResponse.data?.students_today || 0,
            sport_today: footfallResponse.data?.sport_today || 0,
            computer_today:
              footfallResponse.data?.computer_today ||
              footfallResponse.data?.computer_users ||
              0,
            staff_today: footfallResponse.data?.staff_today || 0,
            guests_today: footfallResponse.data?.guests_today || 0
          });
          setMonthlyFootfall(
            (monthlyResponse.data || []).map((item) => ({
              month: MONTH_LABELS[(item.month || 1) - 1] || String(item.month || ""),
              count: item.count || item.total_students || 0,
              total_sport: item.total_sport || 0,
              total_computer: item.total_computer || 0
            }))
          );
        }
      } catch (error) {
        if (!ignore) {
          setDashboardError("Today's footfall could not be loaded.");
        }
      } finally {
        if (!ignore) {
          setLoadingDashboard(false);
        }
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [mode]);

  return (
    <>
      <style>
        {`
          @keyframes expandPortal {
            0% { transform: scale(0.3); opacity: 0; filter: blur(10px); }
            60% { transform: scale(1.03); opacity: 1; filter: blur(0px); }
            100% { transform: scale(1); opacity: 1; filter: blur(0px); }
          }
        `}
      </style>
      <Box
        sx={
          animateDashboard
            ? { animation: "expandPortal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards" }
            : {}
        }
      >
        <OperationalLayout
          sectionLabel="NMITD Library System"
          maxWidth={mode === "dashboard" ? false : "lg"}
          mode={themeMode}
          onToggleMode={onToggleMode}
          headerActions={
            <Button variant="outlined" sx={headerAdminButtonSx} onClick={() => setScreen("adminLogin")}>
              Admin Login
            </Button>
          }
        >
          <Stack spacing={{ xs: 2.5, md: 3 }}>
            <Stack spacing={1} sx={{ alignItems: { xs: "center", md: "flex-start" }, textAlign: { xs: "center", md: "left" } }}>
              <Typography sx={welcomeOverlineSx}>Library access portal</Typography>
              <Typography sx={welcomeTitleSx}>
                Welcome to{" "}
                <Box
                  component="span"
                  sx={{
                    background: "linear-gradient(90deg, #4f6ef7 0%, #8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}
                >
                  NMITD Library
                </Box>
              </Typography>
              <Typography sx={welcomeSubtitleSx}>
                Entry operations and dashboard access in a clean front-desk layout.
              </Typography>
            </Stack>

            <Stack
              spacing={{ xs: 2.25, md: 2.75 }}
              sx={{ alignItems: mode === "dashboard" ? "stretch" : "center" }}
            >
              <Box sx={toggleShellSx}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={toggleGroupSx}
                >
                  <Button
                    variant={mode === "entry" ? "contained" : "text"}
                    onClick={() => setMode("entry")}
                    sx={toggleButtonSx(mode === "entry")}
                  >
                    Entry Mode
                  </Button>
                  <Button
                    variant={mode === "dashboard" ? "contained" : "text"}
                    onClick={() => setMode("dashboard")}
                    sx={toggleButtonSx(mode === "dashboard")}
                  >
                    Dashboard Mode
                  </Button>
                </Stack>
              </Box>

              {mode === "entry" ? (
                <Stack spacing={1.6} sx={{ width: "100%", alignItems: "center" }}>
                  <Box sx={heroPillSx}>
                    <Box component="span" sx={heroPillDotSx} />
                    Front Desk Ready
                  </Box>
                  <Typography sx={entrySectionLabelSx}>Choose Entry Type</Typography>
                  <Grid container spacing={{ xs: 1.5, sm: 1.75 }} sx={entryGridSx}>
                    {ENTRY_ACTIONS.map((action) => (
                      <Grid key={action.label} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Button
                          fullWidth
                          variant="text"
                          onClick={action.onClick(setScreen)}
                          sx={entryCardButtonSx(action, theme.palette.mode === "dark")}
                        >
                          <Stack spacing={1.25} alignItems="flex-start" sx={{ width: "100%", textAlign: "left" }}>
                            <Box sx={entryCardIconSx(action.iconGradient)}>{action.icon}</Box>
                            <Box>
                              <Typography sx={entryCardTitleSx}>{action.label}</Typography>
                              <Typography sx={entryCardSubtitleSx}>{action.description}</Typography>
                            </Box>
                            <Box sx={entryCardArrowSx}></Box>
                          </Stack>
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              ) : (
                <Stack spacing={4} sx={{ width: "100%" }}>
                  <Typography sx={{ color: "text.secondary", lineHeight: 1.8, fontSize: 17 }}>
                    Today's footfall snapshot is loaded from the admin API and arranged for quick reading at the front
                    desk.
                  </Typography>

                  {dashboardError && <Alert severity="error">{dashboardError}</Alert>}

                  {loadingDashboard ? (
                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                      <Typography>Loading dashboard...</Typography>
                    </Stack>
                  ) : (
                    <>
                      <Stack spacing={2.25}>
                        <SectionHeading
                          title="Today's Footfall"
                          description="A quick summary of today's student, sport, computer, staff, and guest activity."
                        />
                        <Box sx={todayFootfallGridSx}>
                          {todayCards.map((card) => (
                            <Box key={card.label}>
                              <DashboardCard label={card.label} value={card.value} accent={card.accent} />
                            </Box>
                          ))}
                        </Box>
                      </Stack>

                      <ChartSection
                        title="Today's Footfall Comparison"
                        description="A horizontal comparison of today's visitors by category."
                      >
                        <Box sx={{ width: "100%", height: 320, minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={chartData}
                              layout="vertical"
                              margin={{ top: 8, right: 24, left: 16, bottom: 0 }}
                            >
                              <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" horizontal={false} />
                              <XAxis
                                type="number"
                                allowDecimals={false}
                                tick={{ fontSize: 20, fill: chartAxisColor, fontWeight: "bold" }}
                                axisLine={{ stroke: chartGridColor }}
                                tickLine={{ stroke: chartGridColor }}
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                width={132}
                                tick={{ fontSize: 20, fill: theme.palette.text.primary, fontWeight: "bold" }}
                                axisLine={{ stroke: chartGridColor }}
                                tickLine={{ stroke: chartGridColor }}
                              />
                              <Tooltip />
                              <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={30}>
                                {chartData.map((entry) => (
                                  <Cell key={entry.name} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </ChartSection>

                      <ChartSection
                        title="Monthly Trend"
                        description="A month-by-month view of library visits to help spot patterns over time."
                      >
                        <Box sx={{ width: "100%", height: 320, minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyFootfall} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                              <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" vertical={false} />
                              <XAxis
                                dataKey="month"
                                tick={{ fontSize: 14, fill: chartAxisColor }}
                                axisLine={{ stroke: chartGridColor }}
                                tickLine={{ stroke: chartGridColor }}
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 14, fill: chartAxisColor }}
                                axisLine={{ stroke: chartGridColor }}
                                tickLine={{ stroke: chartGridColor }}
                              />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#0f766e"
                                strokeWidth={3}
                                dot={{ r: 5, fill: "#0f766e" }}
                                activeDot={{ r: 7 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </ChartSection>

                      <ChartSection
                        title="Visitor Distribution"
                        description="A pie chart view of today's visitor activity across students, sport, computer, staff, and guests."
                      >
                        <Box style={{ width: "100%", height: 400 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={140}
                                innerRadius={60}
                                label={({ name, percent }) => `${name} ${Math.round((percent || 0) * 100)}%`}
                                labelLine={false}
                              >
                                {pieData.map((entry) => (
                                  <Cell key={entry.name} fill={VISITOR_COLORS[entry.name]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </ChartSection>
                    </>
                  )}

                  <Button variant="outlined" sx={headerAdminButtonSx} onClick={() => setScreen("adminLogin")}>
                    Open Admin Login
                  </Button>
                </Stack>
              )}
            </Stack>

            <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid", borderColor: "rgba(148, 163, 184, 0.28)" }}>
              <Typography sx={{ color: "text.secondary", textAlign: "center", lineHeight: 1.8, fontSize: 16 }}>
                Use Entry Mode for front-desk operations. Use Dashboard Mode for a quick summary, and Admin Login for full
                reports and uploads.
              </Typography>
            </Box>
          </Stack>
        </OperationalLayout>
      </Box>
    </>
  );
}

const ENTRY_ACTIONS = [
  {
    label: "Student Entry",
    icon: "🎓",
    description: "Enter roll number to continue to the entry or exit flow.",
    background: (isDark) =>
      isDark
        ? "linear-gradient(135deg, rgba(79,110,247,0.14) 0%, rgba(99,102,241,0.08) 100%)"
        : "linear-gradient(135deg, #e0e7ff 0%, #f3f6ff 100%)",
    borderColor: (isDark) => isDark ? "rgba(79,110,247,0.22)" : "#c7d2fe",
    iconGradient: "linear-gradient(135deg, #4f6ef7 0%, #6366f1 100%)",
    onClick: (setScreen) => () => setScreen("student")
  },
  {
    label: "Staff Entry",
    icon: "👨‍💼",
    description: "Continue with staff credentials while keeping the existing login behavior.",
    background: (isDark) =>
      isDark
        ? "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(22,163,74,0.07) 100%)"
        : "linear-gradient(135deg, #dcfce7 0%, #f2fdf5 100%)",
    borderColor: (isDark) => isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0",
    iconGradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    onClick: (setScreen) => () => setScreen("staff")
  },
  {
    label: "Guest Entry",
    icon: "🙋",
    description: "Use the current guest sign-in screen for visitor name entry.",
    background: (isDark) =>
      isDark
        ? "linear-gradient(135deg, rgba(155,93,229,0.14) 0%, rgba(124,58,237,0.08) 100%)"
        : "linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%)",
    borderColor: (isDark) => isDark ? "rgba(155,93,229,0.22)" : "#ddd6fe",
    iconGradient: "linear-gradient(135deg, #9b5de5 0%, #7c3aed 100%)",
    onClick: (setScreen) => () => setScreen("guest")
  }
];

const headerAdminButtonSx = {
  minWidth: { xs: "100%", sm: 148 },
  py: 1.1,
  px: 2.25,
  borderRadius: 999,
  fontWeight: 700,
  textTransform: "none",
  borderColor: "divider",
  color: "text.primary",
  backgroundColor: "rgba(255,255,255,0.26)",
  backdropFilter: "blur(6px)",
  "&:hover": {
    borderColor: "primary.main",
    background: "action.hover"
  }
};

function toggleButtonSx(active) {
  return {
    flex: 1,
    minWidth: { sm: 200 },
    py: 1.15,
    px: 2.5,
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 15,
    textTransform: "none",
    color: active ? "#ffffff" : "text.primary",
    background: active ? "linear-gradient(135deg, #4f6ef7 0%, #6366f1 100%)" : "transparent",
    boxShadow: active ? "0 10px 24px rgba(79,110,247,0.24)" : "none",
    "&:hover": {
      background: active ? "linear-gradient(135deg, #4f6ef7 0%, #6366f1 100%)" : "rgba(79,110,247,0.06)"
    }
  };
}

const toggleShellSx = {
  display: "flex",
  justifyContent: "center",
  width: "100%"
};

const toggleGroupSx = {
  p: 0.75,
  border: "1px solid",
  borderColor: "rgba(148, 163, 184, 0.32)",
  borderRadius: 999,
  background: (currentTheme) =>
    currentTheme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.22)" : "rgba(255, 255, 255, 0.22)",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)"
};

const welcomeOverlineSx = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "text.secondary"
};

const welcomeTitleSx = {
  fontSize: { xs: 30, md: 42 },
  fontWeight: 800,
  lineHeight: 1.08,
  color: "text.primary",
  maxWidth: 760
};

const welcomeSubtitleSx = {
  maxWidth: 700,
  fontSize: { xs: 14, md: 15 },
  lineHeight: 1.7,
  color: "text.secondary"
};

const heroPillSx = {
  display: "inline-flex",
  alignItems: "center",
  alignSelf: "center",
  width: "fit-content",
  maxWidth: "100%",
  gap: 1,
  px: 1.5,
  py: 0.75,
  borderRadius: 999,
  border: "1px solid",
  borderColor: "rgba(79, 110, 247, 0.22)",
  background: (theme) =>
    theme.palette.mode === "dark" ? "rgba(79,110,247,0.12)" : "rgba(255,255,255,0.22)",
  color: "#4f6ef7",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.2
};

const heroPillDotSx = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#22c55e",
  boxShadow: "0 0 0 4px rgba(34,197,94,0.14)"
};

const entrySectionLabelSx = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "text.secondary",
  textAlign: "center"
};

const entryGridSx = {
  width: "100%",
  maxWidth: 1080,
  justifyContent: "center"
};

const todayFootfallGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    md: "repeat(3, minmax(0, 1fr))",
    lg: "repeat(5, minmax(0, 1fr))"
  },
  gap: 2.5,
  width: "100%"
};

function entryCardButtonSx(action, isDark) {
  return {
    display: "block",
    height: "100%",
    minHeight: { xs: 170, md: 188 },
    p: { xs: 2, md: 2.25 },
    borderRadius: 4,
    border: `1.5px solid ${typeof action.borderColor === "function" ? action.borderColor(isDark) : action.borderColor}`,
    background: typeof action.background === "function" ? action.background(isDark) : action.background,
    textTransform: "none",
    color: "text.primary",
    boxShadow: isDark ? "0 1px 4px rgba(0, 0, 0, 0.3)" : "0 1px 4px rgba(15, 23, 42, 0.05)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      background: typeof action.background === "function" ? action.background(isDark) : action.background,
      transform: "translateY(-3px)",
      boxShadow: isDark ? "0 14px 28px rgba(0,0,0,0.35)" : "0 14px 28px rgba(15, 23, 42, 0.12)"
    },
    "&:active": {
      transform: "translateY(-1px) scale(0.985)"
    }
  };
}

function entryCardIconSx(iconGradient) {
  return {
    width: 46,
    height: 46,
    borderRadius: 3,
    display: "grid",
    placeItems: "center",
    background: iconGradient,
    color: "#ffffff",
    fontSize: 22,
    lineHeight: 1
  };
}

const entryCardTitleSx = {
  fontSize: 17,
  fontWeight: 800,
  color: "text.primary"
};

const entryCardSubtitleSx = {
  mt: 0.5,
  fontSize: 12.5,
  lineHeight: 1.55,
  color: "text.secondary"
};

const entryCardArrowSx = {
  ml: "auto",
  mt: 0.5,
  width: 28,
  height: 28,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: (theme) =>
    theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.72)",
  color: "text.primary",
  fontSize: 14,
  fontWeight: 800
};

function DashboardCard({ label, value, accent }) {
  return (
    <Box
      sx={{
        p: { xs: 2.75, md: 3.25 },
        height: 156,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        background: (theme) => (theme.palette.mode === "dark" ? "#122033" : "#f8fbff"),
        boxShadow: `inset 0 0 0 1px ${accent}1a`,
        overflow: "hidden"
      }}
    >
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: "text.secondary", letterSpacing: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 1.5, fontSize: { xs: 36, md: 42 }, fontWeight: 800, color: accent, lineHeight: 1.1 }}>
        {value}
      </Typography>
    </Box>
  );
}

function SectionHeading({ title, description }) {
  return (
    <Box>
      <Typography sx={{ fontSize: { xs: 22, md: 24 }, fontWeight: 800, color: "text.primary" }}>{title}</Typography>
      {description && (
        <Typography sx={{ mt: 0.75, fontSize: 16, color: "text.secondary", lineHeight: 1.7 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

function ChartSection({ title, description, children }) {
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        background: (theme) => (theme.palette.mode === "dark" ? "#122033" : "#f8fbff")
      }}
    >
      <SectionHeading title={title} description={description} />
      <Box sx={{ mt: 2.5 }}>{children}</Box>
    </Box>
  );
}
