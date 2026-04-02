import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
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

const DASHBOARD_API_URL = "http://localhost:5000/api/admin/footfall";
const MONTHLY_FOOTFALL_API_URL = "http://localhost:5000/api/admin/monthly-footfall";
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const VISITOR_COLORS = {
  Students: "#2563eb",
  Sport: "#dc2626",
  Computer: "#ea580c",
  Staff: "#0f766e",
  Guests: "#7c3aed"
};

export default function Home({ setScreen, mode: themeMode, onToggleMode }) {
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
    { name: "Students", value: Number(footfall.students_today ) || 0 },
    { name: "Sport", value: Number(footfall.sport_today) || 0 },
    { name: "Computer", value: Number(footfall.computer_today) || 0 },
    { name: "Staff", value: Number(footfall.staff_today ) || 0 },
    { name: "Guests", value: Number(footfall.guests_today ) || 0 }
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
    <OperationalLayout
      title="Library access portal"
      subtitle="Switch between entry operations and a quick dashboard summary for today's visitor footfall."
      sectionLabel="NMITD Library System"
      maxWidth={mode === "dashboard" ? false : "sm"}
      mode={themeMode}
      onToggleMode={onToggleMode}
    >
      <Paper
        elevation={0}
        sx={(currentTheme) => ({
          width: "100%",
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          border: `1px solid ${currentTheme.palette.divider}`,
          background: currentTheme.palette.mode === "dark" ? "#16243a" : "#ffffff"
        })}
      >
        <Stack spacing={3.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            sx={{
              p: 0.75,
              borderRadius: 3,
              background: (currentTheme) =>
                currentTheme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.12)" : "#eef4fb"
            }}
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

          {mode === "entry" ? (
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
          ) : (
            <Stack spacing={4}>
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
                    <Grid container spacing={2.5}>
                      {todayCards.map((card) => (
                        <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4 }}>
                          <DashboardCard label={card.label} value={card.value} accent={card.accent} />
                        </Grid>
                      ))}
                    </Grid>
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
                            tick={{ fontSize: 20, fill: chartAxisColor , fontWeight: "bold"}}
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

              <Button variant="outlined" sx={adminButtonSx} onClick={() => setScreen("adminLogin")}>
                Open Admin Login
              </Button>
            </Stack>
          )}
        </Stack>

        <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid #e6edf5" }}>
          <Typography sx={{ color: "text.secondary", textAlign: "center", lineHeight: 1.8, fontSize: 16 }}>
            Use Entry Mode for front-desk operations. Use Dashboard Mode for a quick summary, and Admin Login for full
            reports and uploads.
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

function toggleButtonSx(active) {
  return {
    flex: 1,
    py: 1.35,
    borderRadius: 2.5,
    fontWeight: 700,
    fontSize: 16,
    color: active ? "#ffffff" : "text.primary"
  };
}

function DashboardCard({ label, value, accent }) {
  return (
    <Box
      sx={{
        p: { xs: 2.75, md: 3.25 },
        minHeight: 156,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        background: (theme) => (theme.palette.mode === "dark" ? "#122033" : "#f8fbff"),
        boxShadow: `inset 0 0 0 1px ${accent}1a`
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
