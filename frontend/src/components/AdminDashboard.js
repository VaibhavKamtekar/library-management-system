import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE from "../api";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ThemeToggleButton from "./ThemeToggleButton";

const DASHBOARD_TABS = [
  { id: "overview", label: "Overview" },
  { id: "logs", label: "Visit Logs" },
  { id: "students", label: "Students" },
  { id: "reports", label: "Reports" }
];

const SUMMARY_CARD_STYLES = [
  {
    key: "total",
    label: "Total Today",
    hint: "All recorded visits for today",
    accent: "linear-gradient(135deg, #4f6ef7, #6366f1)"
  },
  {
    key: "students",
    label: "Students",
    hint: "Regular entries",
    accent: "linear-gradient(135deg, #22c55e, #16a34a)"
  },
  {
    key: "sport",
    label: "Sport",
    hint: "Sport-item usage",
    accent: "linear-gradient(135deg, #ec4899, #db2777)"
  },
  {
    key: "computer",
    label: "Computer Usage",
    hint: "Students on computers",
    accent: "linear-gradient(135deg, #f59e0b, #d97706)"
  },
  {
    key: "staff",
    label: "Staff",
    hint: "Staff member visits",
    accent: "linear-gradient(135deg, #9b5de5, #7c3aed)"
  },
  {
    key: "guests",
    label: "Guests",
    hint: "Guest entries logged",
    accent: "linear-gradient(135deg, #14b8a6, #0f766e)"
  }
];

function normalizeWeeklyFootfall(weeklyFootfall) {
  if (!Array.isArray(weeklyFootfall) || weeklyFootfall.length === 0) {
    return buildEmptyWeeklyFootfall();
  }

  return weeklyFootfall.map((item) => ({
    label: item.label || formatWeekdayLabel(item.date),
    value: Number(item.value || item.total_visits || 0)
  }));
}

function buildEmptyWeeklyFootfall() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    return {
      label: formatWeekdayLabel(date),
      value: 0
    };
  });
}

function formatWeekdayLabel(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}
function ExportDialog({ open, status, fileName }) {
  const iconSx = { fontSize: 48, mb: 1.5 };
  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          px: 1,
          py: 2,
          textAlign: "center"
        }
      }}
    >
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1
        }}
      >
        {status === "loading" && (
          <>
            <CircularProgress size={48} sx={{ mb: 1.5 }} />
            <Typography variant="h6" fontWeight={600}>
              Preparing Report…
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while the report is being generated.
            </Typography>
          </>
        )}
        {status === "success" && (
          <>
            <Typography sx={{ ...iconSx, color: "success.main" }}>✓</Typography>
            <Typography variant="h6" fontWeight={600}>
              Report Downloaded Successfully
            </Typography>
            {fileName && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  File Name
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    wordBreak: "break-all",
                    px: 1,
                    py: 0.75,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    fontFamily: "monospace",
                    fontSize: "0.8rem"
                  }}
                >
                  {fileName}
                </Typography>
              </>
            )}
          </>
        )}
        {status === "error" && (
          <>
            <Typography sx={{ ...iconSx, color: "error.main" }}>✕</Typography>
            <Typography variant="h6" fontWeight={600}>
              Export Failed
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Report generation failed. Please try again.
            </Typography>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


export default function AdminDashboard({ setScreen, mode, onToggleMode }) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("overview");
  const [summary, setSummary] = useState({
    total: 0,
    students: 0,
    sport: 0,
    computer: 0,
    staff: 0,
    guests: 0
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [footfall, setFootfall] = useState({
    total_students: 0,
    computer_users: 0,
    non_computer_users: 0
  });
  const [weeklyFootfall, setWeeklyFootfall] = useState([]);
  const [monthlyFootfall, setMonthlyFootfall] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [peakHour, setPeakHour] = useState(null);
  const [currentlyInside, setCurrentlyInside] = useState(0);
  const [studentTimeToday, setStudentTimeToday] = useState([]);
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [pageLimit] = useState(10);
  const [uploadMsg, setUploadMsg] = useState("");
  const [exportDialog, setExportDialog] = useState({ open: false, status: "loading", fileName: "" });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState("");
  const [logError, setLogError] = useState("");
  const [filters, setFilters] = useState(getDefaultLogFilters);

  useEffect(() => {
    const loadDashboard = async () => {
      setDashboardLoading(true);
      setError("");

      try {
        const [
          summaryRes,
          leaderboardRes,
          footfallRes,
          weeklyRes,
          monthlyRes,
          totalTimeRes,
          peakHourRes,
          currentlyInsideRes,
          studentTimeRes
        ] = await Promise.all([
          axios.get(`${API_BASE}/api/admin/dashboard`),
          axios.get(`${API_BASE}/api/admin/leaderboard`),
          axios.get(`${API_BASE}/api/admin/footfall`),
          axios.get(`${API_BASE}/api/admin/weekly-footfall`),
          axios.get(`${API_BASE}/api/admin/monthly-footfall`),
          axios.get(`${API_BASE}/api/admin/total-time-today`),
          axios.get(`${API_BASE}/api/admin/peak-hour`),
          axios.get(`${API_BASE}/api/admin/currently-inside`),
          axios.get(`${API_BASE}/api/admin/student-time-today`)
        ]);

        setSummary(summaryRes.data);
        setLeaderboard(leaderboardRes.data || []);
        setFootfall(footfallRes.data);
        setWeeklyFootfall(weeklyRes.data || []);
        setMonthlyFootfall(monthlyRes.data || []);
        setTotalTime(totalTimeRes.data?.total_minutes || 0);
        setPeakHour(peakHourRes.data);
        setCurrentlyInside(currentlyInsideRes.data?.count || 0);
        setStudentTimeToday(studentTimeRes.data || []);
      } catch (loadError) {
        setError("Dashboard analytics could not be loaded.");
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    const loadLogs = async () => {
      setLogsLoading(true);
      setLogError("");

      try {
        const params = buildLogQueryParams(filters);
        params.page = currentPage;
        params.limit = pageLimit;

        const res = await axios.get(`${API_BASE}/api/admin/visit-logs`, { params });
        setLogs(res.data.data || []);
        setCurrentPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
        setTotalLogs(res.data.total || 0);
      } catch (loadError) {
        setLogError(loadError.response?.data?.message || "Visit logs could not be loaded.");
      } finally {
        setLogsLoading(false);
      }
    };

    loadLogs();
  }, [filters, currentPage, pageLimit]);

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(
          logs
            .map((item) => item.department)
            .filter(Boolean)
        )
      ).sort(),
    [logs]
  );

  const maxMonthly = Math.max(...monthlyFootfall.map((item) => item.total_students || 0), 1);
  const weeklyData = useMemo(() => normalizeWeeklyFootfall(weeklyFootfall), [weeklyFootfall]);
  const hourlyData = useMemo(() => buildHourlyDataFromLogs(logs), [logs]);
  const visitorMix = useMemo(
    () => [
      { label: "Students", value: summary.students, color: "#4f6ef7" },
      { label: "Staff", value: summary.staff, color: "#22c55e" },
      { label: "Guests", value: summary.guests, color: "#f59e0b" },
      { label: "Sport", value: summary.sport, color: "#ec4899" }
    ],
    [summary]
  );

  const summaryCards = [
    ...SUMMARY_CARD_STYLES.map((item) => ({
      ...item,
      value: summary[item.key] || 0
    })),
    {
      key: "currentlyInside",
      label: "Currently Inside",
      value: currentlyInside,
      hint: "Open sessions right now",
      accent: "linear-gradient(135deg, #ef4444, #dc2626)",
      wide: true,
      interactive: true
    }
  ];

  const handleExportLogs = async () => {

    setExportDialog({ open: true, status: "loading", fileName: "" });
    try {
      const params = buildLogQueryParams(filters);

      const response = await axios.get(`${API_BASE}/api/admin/export-logs`, {
        params,
        responseType: "blob"
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = getDownloadFileName(
        response.headers["content-disposition"],
        "VisitLogs_AllData.xlsx"
      );
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportDialog({ open: true, status: "success", fileName });
      setTimeout(() => setExportDialog((prev) => ({ ...prev, open: false })), 2500);
    } catch (exportError) {
      setExportDialog({ open: true, status: "error", fileName: "" });
    }
  };

  const handleDownloadMonthlyReport = async () => {
    setExportDialog({ open: true, status: "loading", fileName: "" });
    try {
      const response = await axios.get(`${API_BASE}/api/admin/monthly-footfall-report`, {
        responseType: "blob"
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      const fileName = getDownloadFileName(
        response.headers["content-disposition"],
        "Monthly_Footfall_Report.xlsx"
      );
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportDialog({ open: true, status: "success", fileName });
      setTimeout(() => setExportDialog((prev) => ({ ...prev, open: false })), 2500);
    } catch (downloadError) {
      setExportDialog({ open: true, status: "error", fileName: "" });
    }
  };

  const handleCurrentlyInsideClick = () => {
    setFilters((prev) => ({
      ...prev,
      fromDate: "",
      toDate: "",
      status: "inside"
    }));
    setActiveTab("logs");
  };

  const handleTabChange = (tabId) => {
    if (tabId === "students") {
      setScreen("adminStudentManagement");
      return;
    }

    setActiveTab(tabId);
  };

  const surfaceSx = getSurfaceSx(theme);
  const panelSx = getPanelSx(theme);
  const mutedTextColor = theme.palette.mode === "dark" ? "#dbe5f7" : "#374151";
  const primaryTextColor = theme.palette.mode === "dark" ? "#f8fbff" : "#1e1b4b";

  return (
    <Box sx={pageShellSx(theme)}>
      <Box sx={topNavSx(theme)}>
        <Box
          // disableGutters
          sx={{ width: "100%", px: { xs: 2, sm: 3 } }}
        >
          <Stack spacing={1.25}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
              spacing={1.5}
              sx={{ pt: 1.5 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={brandBadgeSx}>
                  <Typography sx={brandBadgeTextSx}>N</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: primaryTextColor }}>
                    NMITD Library
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: mutedTextColor }}>
                    Administrative Dashboard
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
                <Button variant="outlined" sx={navGhostButtonSx(theme)} onClick={() => setScreen("home")}>
                  Home
                </Button>
                <ThemeToggleButton mode={mode} onToggle={onToggleMode} />
                <Button variant="contained" sx={navLogoutButtonSx} onClick={() => setScreen("home")}>
                  Logout
                </Button>
              </Stack>
            </Stack>

            <Stack
              direction="row"
              spacing={0}
              sx={{
                width: "100%",
                borderTop: "1px solid",
                borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                mt: 1,
                pt: 1,
                // overflowX: "auto",
                // pb: 0.5,
                // "&::-webkit-scrollbar": { display: "none" },
                // scrollbarWidth: "none"
              }}
            >
              {DASHBOARD_TABS.map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  sx={{
                    ...navTabSx(theme, activeTab === tab.id),
                    flex: 1,
                    textAlign: "center",
                    width: "100%"
                  }}
                >
                  {tab.label}
                  {tab.id === "logs" && (
                    <Box component="span" sx={tabBadgeSx(theme)}>
                      {totalLogs}
                    </Box>
                  )}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Container
        maxWidth={false}
        disableGutters
        sx={{ width: "100%", px: { xs: 2, sm: 3 }, py: { xs: 2.5, md: 3.5 } }}
      >
        <Stack spacing={2}>
          {dashboardLoading && <LinearProgress sx={{ borderRadius: 999, height: 6 }} />}
          {error && <Alert severity="error">{error}</Alert>}
          {uploadMsg && <Alert severity={uploadMsg.includes("failed") ? "error" : "success"}>{uploadMsg}</Alert>}
          <ExportDialog
            open={exportDialog.open}
            status={exportDialog.status}
            fileName={exportDialog.fileName}
          />

          {activeTab === "overview" && (
            <Stack spacing={2}>
              <PageHeader
                title="Library Operations"
                subtitle="Monitor daily traffic, review timestamps, filter visit logs, and manage student records."
              />

              <Box sx={statGridSx}>
                {summaryCards.map((item) => (
                  <Paper
                    key={item.key}
                    onClick={item.interactive ? handleCurrentlyInsideClick : undefined}
                    sx={statCardSx(item.accent, item.wide, item.interactive)}
                  >
                    <Box>
                      <Typography sx={statLabelSx}>{item.label}</Typography>
                      <Typography sx={statValueSx}>{item.value}</Typography>
                    </Box>
                    <Typography sx={statHintSx}>{item.hint}</Typography>
                  </Paper>
                ))}
              </Box>

              <Box sx={dualPanelGridSx}>
                <Paper sx={panelSx}>
                  <SectionHeading
                    title="Visits this week"
                    subtitle="Daily footfall across all visit records"
                  />
                  <WeeklyBars data={weeklyData} themeMode={theme.palette.mode} />
                </Paper>

                <Paper sx={panelSx}>
                  <SectionHeading title="Visitor mix today" subtitle="Breakdown by visitor type" />
                  <VisitorMix mix={visitorMix} total={summary.total} />
                </Paper>
              </Box>

              <Box sx={dualPanelGridSx}>
                <Paper sx={panelSx}>
                  <SectionHeading title="Hourly footfall" subtitle="Entries grouped by hour" />
                  <HourlyBars data={hourlyData} themeMode={theme.palette.mode} />
                </Paper>

                <Paper sx={panelSx}>
                  <SectionHeading title="Computer usage" subtitle="Students using computers today" />
                  <Stack spacing={1.25} sx={{ mt: 2 }}>
                    <ProgressRow
                      label="Using Computer"
                      value={footfall.computer_users || 0}
                      total={Math.max(footfall.total_students || 0, 1)}
                      fill="linear-gradient(90deg, #4f6ef7, #6366f1)"
                    />
                    <ProgressRow
                      label="Not Using"
                      value={footfall.non_computer_users || 0}
                      total={Math.max(footfall.total_students || 0, 1)}
                      fill="linear-gradient(90deg, #9b5de5, #7c3aed)"
                    />
                    <ProgressRow
                      label="Sport Sessions"
                      value={summary.sport || 0}
                      total={Math.max(summary.total || 0, 1)}
                      fill="linear-gradient(90deg, #ec4899, #db2777)"
                    />
                  </Stack>
                </Paper>
              </Box>

              <Paper sx={panelSx}>
                <SectionHeading title="Top visitors today" subtitle="Time spent in the library today" />
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {studentTimeToday.length === 0 ? (
                    <Typography sx={emptyStateSx}>No student time data available for today.</Typography>
                  ) : (
                    studentTimeToday.slice(0, 5).map((item, index) => (
                      <Box key={`${item.roll_no}-${index}`} sx={timeItemSx(surfaceSx)}>
                        <Box sx={timeRankSx(index)}>{index + 1}</Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 800, color: primaryTextColor }}>
                            {item.visitor_name || item.roll_no || "Unknown"}
                          </Typography>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: mutedTextColor }}>
                            {item.roll_no || "-"}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#4f6ef7" }}>
                          {formatMinutes(item.minutes_spent || 0)}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Stack>
              </Paper>
            </Stack>
          )}

          {activeTab === "logs" && (
            <Stack spacing={2}>
              <PageHeader
                title="Visit Logs"
                subtitle="Filter by date, visitor type, status, department, and more."
              />

              <Paper sx={panelSx}>
                <SectionHeading title="Filters" subtitle="Refine visit records for desk operations and exports." />

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                  <QuickActionButton
                    active={filters.fromDate === getTodayValue() && filters.toDate === getTodayValue()}
                    onClick={() => setDateRangeFilters(setFilters, getTodayValue(), getTodayValue())}
                  >
                    Today
                  </QuickActionButton>
                  <QuickActionButton
                    active={
                      filters.fromDate === getRelativeDateValue(-1) &&
                      filters.toDate === getRelativeDateValue(-1)
                    }
                    onClick={() =>
                      setDateRangeFilters(
                        setFilters,
                        getRelativeDateValue(-1),
                        getRelativeDateValue(-1)
                      )
                    }
                  >
                    Yesterday
                  </QuickActionButton>
                  <QuickActionButton
                    active={filters.fromDate === "" && filters.toDate === ""}
                    onClick={() => setDateRangeFilters(setFilters, "", "")}
                  >
                    All Dates
                  </QuickActionButton>
                </Stack>

                <Box sx={filterGridSx}>
                  <FilterBlock
                    label="From Date"
                    control={
                      <TextField
                        type="date"
                        fullWidth
                        value={filters.fromDate}
                        onChange={(event) => updateFilter(setFilters, "fromDate", event.target.value)}
                        sx={textFieldSx(theme)}
                        InputLabelProps={{ shrink: true }}
                      />
                    }
                  />
                  <FilterBlock
                    label="To Date"
                    control={
                      <TextField
                        type="date"
                        fullWidth
                        value={filters.toDate}
                        onChange={(event) => updateFilter(setFilters, "toDate", event.target.value)}
                        sx={textFieldSx(theme)}
                        InputLabelProps={{ shrink: true }}
                      />
                    }
                  />
                  <FilterBlock
                    label="Visitor Type"
                    control={
                      <TextField
                        select
                        fullWidth
                        value={filters.visitor_type}
                        onChange={(event) => updateFilter(setFilters, "visitor_type", event.target.value)}
                        sx={textFieldSx(theme)}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="sport">Sport</MenuItem>
                        <MenuItem value="staff">Staff</MenuItem>
                        <MenuItem value="guest">Guest</MenuItem>
                      </TextField>
                    }
                  />
                  <FilterBlock
                    label="Status"
                    control={
                      <TextField
                        select
                        fullWidth
                        value={filters.status}
                        onChange={(event) => updateFilter(setFilters, "status", event.target.value)}
                        sx={textFieldSx(theme)}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="inside">Currently Inside</MenuItem>
                        <MenuItem value="exited">Exited</MenuItem>
                      </TextField>
                    }
                  />
                  <FilterBlock
                    label="Computer Usage"
                    control={
                      <TextField
                        select
                        fullWidth
                        value={filters.use_computer}
                        onChange={(event) => updateFilter(setFilters, "use_computer", event.target.value)}
                        sx={textFieldSx(theme)}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="YES">Yes</MenuItem>
                        <MenuItem value="NO">No</MenuItem>
                      </TextField>
                    }
                  />
                  <FilterBlock
                    label="Department"
                    control={
                      <TextField
                        select
                        fullWidth
                        value={filters.department}
                        onChange={(event) => updateFilter(setFilters, "department", event.target.value)}
                        sx={textFieldSx(theme)}
                      >
                        <MenuItem value="">All Departments</MenuItem>
                        {departmentOptions.map((department) => (
                          <MenuItem key={department} value={department}>
                            {department}
                          </MenuItem>
                        ))}
                      </TextField>
                    }
                  />
                </Box>

                <Box sx={{ mt: 1.5 }}>
                  <FilterBlock
                    label="Search by Name or Roll Number"
                    control={
                      <TextField
                        fullWidth
                        value={filters.search}
                        onChange={(event) => updateFilter(setFilters, "search", event.target.value)}
                        placeholder="Search visitor records"
                        sx={textFieldSx(theme)}
                      />
                    }
                  />
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    sx={filterResetButtonSx(theme)}
                    onClick={() => setFilters(getDefaultLogFilters())}
                  >
                    Reset Filters
                  </Button>
                  <Button variant="contained" sx={filterExportButtonSx} onClick={handleExportLogs}>
                    Export Logs
                  </Button>
                </Stack>
              </Paper>

              <Paper sx={panelSx}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <Box>
                    <Typography sx={panelTitleSx}>Visit Records</Typography>
                    <Typography sx={panelSubtitleSx}>Showing {logs.length} of {totalLogs} records</Typography>
                  </Box>
                </Stack>

                {logsLoading && <LinearProgress sx={{ mb: 2, borderRadius: 999, height: 5 }} />}
                {logError && <Alert severity="error" sx={{ mb: 2 }}>{logError}</Alert>}

                <TableContainer sx={tableWrapSx(theme)}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={tableHeadRowSx(theme)}>
                        <TableCell sx={headerCellSx}>Type</TableCell>
                        <TableCell sx={headerCellSx}>Name</TableCell>
                        <TableCell sx={headerCellSx}>Roll No</TableCell>
                        <TableCell sx={headerCellSx}>Sport</TableCell>
                        <TableCell sx={headerCellSx}>Dept</TableCell>
                        <TableCell sx={headerCellSx}>Date</TableCell>
                        <TableCell sx={headerCellSx}>Entry</TableCell>
                        <TableCell sx={headerCellSx}>Exit</TableCell>
                        <TableCell sx={headerCellSx}>PC</TableCell>
                        <TableCell sx={headerCellSx}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} align="center" sx={emptyTableCellSx}>
                            No visit logs found for the selected filters.
                          </TableCell>
                        </TableRow>
                      )}
                      {logs.map((log) => (
                        <TableRow key={log.log_id} hover sx={tableBodyRowSx(theme)}>
                          <TableCell sx={bodyCellSx}>
                            <TypeChip value={log.visitor_type} />
                          </TableCell>
                          <TableCell sx={bodyCellStrongSx}>{log.visitor_name || "-"}</TableCell>
                          <TableCell sx={bodyCellSx}>{log.roll_no || "-"}</TableCell>
                          <TableCell sx={bodyCellSx}>{log.sport_name || "-"}</TableCell>
                          <TableCell sx={bodyCellSx}>{log.department || "-"}</TableCell>
                          <TableCell sx={bodyCellSx}>{formatDate(log.visit_date)}</TableCell>
                          <TableCell sx={bodyCellSx}>{formatDateTime(log.entry_time)}</TableCell>
                          <TableCell sx={bodyCellSx}>{formatDateTime(log.exit_time)}</TableCell>
                          <TableCell sx={bodyCellSx}>{log.use_computer || "-"}</TableCell>
                          <TableCell sx={bodyCellSx}>
                            <StatusBadge status={log.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2, flexWrap: "wrap" }}>
                  <Button
                    variant="outlined"
                    sx={paginationButtonSx(theme)}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    Prev
                  </Button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === currentPage ? "contained" : "outlined"}
                      sx={pageNumber === currentPage ? activePaginationButtonSx : paginationButtonSx(theme)}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                  <Button
                    variant="outlined"
                    sx={paginationButtonSx(theme)}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          )}

          {activeTab === "reports" && (
            <Stack spacing={2}>
              <PageHeader
                title="Reports & Analytics"
                subtitle="Monthly footfall overview, today’s usage stats, and time spent leaderboard."
              />

              <Paper sx={panelSx}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={1.5}
                  alignItems={{ xs: "stretch", md: "flex-start" }}
                >
                  <Box>
                    <SectionHeading
                      title="Monthly footfall overview"
                      subtitle="Month-wise visitor count with downloadable Excel report"
                    />
                  </Box>
                  <Button variant="contained" sx={reportButtonSx} onClick={handleDownloadMonthlyReport}>
                    Download Monthly Report
                  </Button>
                </Stack>

                <Stack spacing={1.25} sx={{ mt: 2 }}>
                  {monthlyFootfall.length === 0 ? (
                    <Typography sx={emptyStateSx}>No monthly footfall data available.</Typography>
                  ) : (
                    monthlyFootfall.map((item) => (
                      <Box key={`${item.year || "year"}-${item.month}`}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: mutedTextColor }}>
                            {item.month_label || monthLabel(item.month)}
                          </Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 800, color: primaryTextColor }}>
                            {item.total_students}
                          </Typography>
                        </Stack>
                        <Box sx={progressTrackSx}>
                          <Box
                            sx={{
                              ...progressFillBaseSx,
                              width: `${(item.total_students / maxMonthly) * 100}%`,
                              background: "linear-gradient(90deg, #4f6ef7, #6366f1)"
                            }}
                          />
                        </Box>
                      </Box>
                    ))
                  )}
                </Stack>
              </Paper>

              <Box sx={dualPanelGridSx}>
                <Paper sx={panelSx}>
                  <SectionHeading title="Today's usage" subtitle="Live metrics pulled from today’s library activity." />
                  <Box sx={usageGridSx}>
                    <UsageMetricCard label="Students Logged" value={footfall.total_students} accent="#4f6ef7" />
                    <UsageMetricCard label="Sport Entries" value={summary.sport} accent="#ec4899" />
                    <UsageMetricCard label="Using Computer" value={footfall.computer_users} accent="#22c55e" />
                    <UsageMetricCard
                      label="Not Using Computer"
                      value={footfall.non_computer_users}
                      accent="#9b5de5"
                    />
                    <UsageMetricCard
                      label="Peak Hour"
                      value={peakHour?.hour !== undefined ? `${peakHour.hour}:00` : "No data"}
                      accent="#f59e0b"
                    />
                    <UsageMetricCard label="Total Time" value={`${totalTime} min`} accent="#14b8a6" />
                  </Box>
                </Paper>

                <Paper sx={panelSx}>
                  <SectionHeading title="Time spent today" subtitle="Top ranked entries by total duration today." />
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {studentTimeToday.length === 0 ? (
                      <Typography sx={emptyStateSx}>No student time data available for today.</Typography>
                    ) : (
                      studentTimeToday.slice(0, 6).map((item, index) => (
                        <Box key={`${item.roll_no}-${index}-report`} sx={timeItemSx(surfaceSx)}>
                          <Box sx={timeRankSx(index)}>{index + 1}</Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 800, color: primaryTextColor }}>
                              {item.visitor_name || item.roll_no || "Unknown"}
                            </Typography>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: mutedTextColor }}>
                              {item.roll_no || "-"}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#4f6ef7" }}>
                            {formatMinutes(item.minutes_spent || 0)}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Stack>
                </Paper>
              </Box>

              <Paper sx={panelSx}>
                <SectionHeading title="Leaderboard" subtitle="Highest overall visit counts based on dashboard analytics." />
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {leaderboard.length === 0 ? (
                    <Typography sx={emptyStateSx}>No leaderboard data available.</Typography>
                  ) : (
                    leaderboard.slice(0, 6).map((item, index) => (
                      <Box key={`${item.roll_no || item.name}-${index}`} sx={timeItemSx(surfaceSx)}>
                        <Box sx={timeRankSx(index)}>{index + 1}</Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 800, color: primaryTextColor }}>
                            {item.name || "Unknown"}
                          </Typography>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: mutedTextColor }}>
                            {item.roll_no || "-"}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#4f6ef7" }}>
                          {item.visits || item.visit_count || item.total_visits || 0} visits
                        </Typography>
                      </Box>
                    ))
                  )}
                </Stack>
              </Paper>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 0.5 }}>
      <Typography sx={pageTitleSx}>{title}</Typography>
      <Typography sx={pageSubtitleSx}>{subtitle}</Typography>
    </Box>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <Box>
      <Typography sx={panelTitleSx}>{title}</Typography>
      <Typography sx={panelSubtitleSx}>{subtitle}</Typography>
    </Box>
  );
}

function FilterBlock({ label, control }) {
  return (
    <Box>
      <Typography sx={filterLabelSx}>{label}</Typography>
      {control}
    </Box>
  );
}

function QuickActionButton({ children, active, onClick }) {
  return (
    <Button onClick={onClick} sx={quickActionButtonSx(active)}>
      {children}
    </Button>
  );
}

function ProgressRow({ label, value, total, fill }) {
  const progress = Math.max(Math.min((value / total) * 100, 100), 0);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary" }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: "text.primary" }}>{value}</Typography>
      </Stack>
      <Box sx={progressTrackSx}>
        <Box sx={{ ...progressFillBaseSx, width: `${progress}%`, background: fill }} />
      </Box>
    </Box>
  );
}

function WeeklyBars({ data, themeMode }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <Box sx={weeklyBarsWrapSx}>
      {data.map((item, index) => {
        const isToday = index === data.length - 1;
        return (
          <Box key={item.label} sx={weeklyBarColumnSx}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 800,
                color: isToday ? "#4f6ef7" : themeMode === "dark" ? "#dbe5f7" : "#1e1b4b"
              }}
            >
              {item.value}
            </Typography>
            <Box
              sx={{
                width: "100%",
                borderRadius: "8px 8px 0 0",
                minHeight: 10,
                height: `${Math.max((item.value / maxValue) * 100, 12)}%`,
                background: isToday
                  ? "linear-gradient(180deg, #4f6ef7, #6366f1)"
                  : "linear-gradient(180deg, #c7d2fe, #ddd6fe)"
              }}
            />
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: isToday ? 800 : 700,
                color: isToday ? "#4f6ef7" : "text.secondary"
              }}
            >
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function HourlyBars({ data, themeMode }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <Box sx={hourlyBarsWrapSx}>
      {data.map((item) => (
        <Box key={item.label} sx={hourlyBarColumnSx}>
          <Box
            sx={{
              width: "100%",
              minHeight: 6,
              borderRadius: "6px 6px 0 0",
              height: `${Math.max((item.value / maxValue) * 100, 10)}%`,
              background: item.value >= maxValue * 0.7 ? "#4f6ef7" : "#c7d2fe"
            }}
          />
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: themeMode === "dark" ? "#dbe5f7" : "#374151"
            }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function VisitorMix({ mix, total }) {
  const safeTotal = Math.max(total || 0, 1);
  const segments = buildMixSegments(mix, safeTotal);

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mt: 2 }}>
      <Box sx={mixRingWrapSx}>
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `conic-gradient(${segments.join(", ")})`,
            display: "grid",
            placeItems: "center",
            position: "relative"
          }}
        >
          <Box sx={mixInnerRingSx}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: "text.primary", lineHeight: 1 }}>
              {total}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>total</Typography>
          </Box>
        </Box>
      </Box>

      <Stack spacing={1} sx={{ flex: 1, width: "100%" }}>
        {mix.map((item) => {
          const pct = Math.round((item.value / safeTotal) * 100);
          return (
            <Stack key={item.label} direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 700, color: "text.secondary" }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: "text.primary" }}>{item.value}</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", minWidth: 38, textAlign: "right" }}>
                {pct}%
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}

function UsageMetricCard({ label, value, accent }) {
  return (
    <Box sx={usageMetricCardSx}>
      <Typography sx={usageMetricLabelSx}>{label}</Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 800, color: accent, mt: 0.75 }}>
        {value}
      </Typography>
    </Box>
  );
}

function TypeChip({ value }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const config = {
    student: {
      label: "Student",
      background: isDark ? "rgba(99,102,241,0.18)" : "#eef2ff",
      color: isDark ? "#a5b4fc" : "#4338ca"
    },
    staff: {
      label: "Staff",
      background: isDark ? "rgba(34,197,94,0.15)" : "#f0fdf4",
      color: isDark ? "#4ade80" : "#15803d"
    },
    guest: {
      label: "Guest",
      background: isDark ? "rgba(245,158,11,0.15)" : "#fffbeb",
      color: isDark ? "#fbbf24" : "#b45309"
    },
    sport: {
      label: "Sport",
      background: isDark ? "rgba(236,72,153,0.15)" : "#fdf2f8",
      color: isDark ? "#f472b6" : "#9d174d"
    }
  };

  const chip = config[value] || {
    label: value || "-",
    background: isDark ? "rgba(148,163,184,0.12)" : "#f3f4f6",
    color: isDark ? "#94a3b8" : "#374151"
  };

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        px: 1,
        py: 0.45,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: chip.background,
        color: chip.color
      }}
    >
      {chip.label}
    </Box>
  );
}

function StatusBadge({ status }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isInside = status === "Inside";

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        px: 1.1,
        py: 0.45,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: isInside
          ? isDark ? "rgba(34,197,94,0.18)" : "#dcfce7"
          : isDark ? "rgba(239,68,68,0.18)" : "#fee2e2",
        color: isInside
          ? isDark ? "#4ade80" : "#15803d"
          : isDark ? "#f87171" : "#dc2626"
      }}
    >
      {status || "-"}
    </Box>
  );
}

function updateFilter(setFilters, key, value) {
  setFilters((prev) => ({
    ...prev,
    [key]: value
  }));
}

function setDateRangeFilters(setFilters, fromDate, toDate) {
  setFilters((prev) => ({
    ...prev,
    fromDate,
    toDate
  }));
}

function getDefaultLogFilters() {
  const today = getTodayValue();

  return {
    fromDate: today,
    toDate: today,
    visitor_type: "all",
    search: "",
    department: "",
    use_computer: "all",
    status: "all"
  };
}

function buildLogQueryParams(filters) {
  const normalizedFilters = normalizeDateRangeFilters(filters);
  const params = {};

  Object.entries(normalizedFilters).forEach(([key, value]) => {
    if (value && value !== "all") {
      params[key] = value;
    }
  });

  return params;
}

function normalizeDateRangeFilters(filters) {
  const fromDate = filters.fromDate || "";
  const toDate = filters.toDate || "";

  if (fromDate && toDate && fromDate > toDate) {
    return {
      ...filters,
      fromDate: toDate,
      toDate: fromDate
    };
  }

  return filters;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN");
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

function monthLabel(monthNumber) {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return labels[monthNumber - 1] || `Month ${monthNumber}`;
}

function getDownloadFileName(contentDisposition, fallbackName) {
  if (!contentDisposition) {
    return fallbackName;
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const standardMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (standardMatch?.[1]) {
    return standardMatch[1];
  }

  return fallbackName;
}

function getTodayValue() {
  return getRelativeDateValue(0);
}

function getRelativeDateValue(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMinutes(minutes) {
  const total = Number(minutes || 0);
  if (total <= 0) return "0m";

  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }

  return `${mins}m`;
}

function buildHourlyDataFromLogs(logs) {
  const hourlyCounts = Array.from({ length: 12 }, (_, index) => ({
    label: `${index + 8}`,
    value: 0
  }));

  logs.forEach((log) => {
    if (!log.entry_time) return;
    const hour = new Date(log.entry_time).getHours();
    if (hour >= 8 && hour < 20) {
      hourlyCounts[hour - 8].value += 1;
    }
  });

  return hourlyCounts;
}

function buildMixSegments(mix, total) {
  let currentDeg = 0;

  return mix.map((item) => {
    const share = (item.value / total) * 360;
    const start = currentDeg;
    const end = currentDeg + share;
    currentDeg = end;
    return `${item.color} ${start}deg ${end}deg`;
  });
}

function getSurfaceSx(theme) {
  return {
    background: theme.palette.mode === "dark" ? "#152033" : "#f9fafb",
    borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "#f1f5f9"
  };
}

function getPanelSx(theme) {
  return {
    p: { xs: 2, md: 2.25 },
    borderRadius: "16px",
    border: "1px solid",
    borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0",
    background: theme.palette.mode === "dark" ? "#121b2d" : "#ffffff",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 14px 40px rgba(2, 6, 23, 0.28)"
        : "0 14px 34px rgba(15, 23, 42, 0.05)"
  };
}

const pageShellSx = (theme) => ({
  minHeight: "100vh",
  background:
    theme.palette.mode === "dark"
      ? "linear-gradient(180deg, #0f172a 0%, #111b2f 100%)"
      : "linear-gradient(180deg, #f0f4ff 0%, #eef4ff 100%)"
});

const topNavSx = (theme) => ({
  // Old Code
  // position: "sticky",
  // top: 0,
  // zIndex: 20,
  // borderBottom: "1px solid",
  // borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "#e2e8f0",
  // background: theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.94)",
  // backdropFilter: "blur(12px)"

  position: "sticky",
  top: 0,
  zIndex: 20,
  width: "100%",

  // STRONGER SEPARATION
  borderBottom: "1px solid",
  borderColor: theme.palette.mode === "dark"
    ? "rgba(255,255,255,0.12)"
    : "#e2e8f0",

  // SOLID BACKGROUND (not faded)
  background: theme.palette.mode === "dark"
    ? "#0f172a"
    : "#ffffff",

  // ADD DEPTH
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 4px 20px rgba(0,0,0,0.4)"
      : "0 4px 20px rgba(0,0,0,0.08)",

  backdropFilter: "blur(10px)"
});

const brandBadgeSx = {
  width: 36,
  height: 36,
  borderRadius: "12px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg, #4f6ef7, #9b5de5)"
};

const brandBadgeTextSx = {
  fontSize: 16,
  fontWeight: 800,
  color: "#ffffff"
};

const navGhostButtonSx = (theme) => ({
  minHeight: 38,
  px: 1.8,
  borderRadius: 999,
  borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.14)" : "#dbe4f0",
  color: theme.palette.mode === "dark" ? "#f8fbff" : "#374151",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "none",
  whiteSpace: "nowrap"
});

const navLogoutButtonSx = {
  minHeight: 38,
  px: 1.8,
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  textTransform: "none",
  whiteSpace: "nowrap",
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "#ffffff"
};

const navTabSx = (theme, active) => ({
  minHeight: 42,
  px: 2,
  borderRadius: 0,
  borderBottom: "2.5px solid",
  borderBottomColor: active ? "#4f6ef7" : "transparent",
  color: active
    ? "#4f6ef7"
    : theme.palette.mode === "dark"
      ? "#dbe5f7"
      : "#374151",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "none",
  whiteSpace: "nowrap",
  gap: 0.75
});

const tabBadgeSx = (theme) => ({
  px: 0.8,
  py: 0.1,
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 800,
  background: theme.palette.mode === "dark" ? "rgba(79, 110, 247, 0.22)" : "#eef2ff",
  color: "#4f6ef7"
});

const pageTitleSx = {
  fontSize: 28,
  fontWeight: 800,
  color: "text.primary",
  lineHeight: 1.15
};

const pageSubtitleSx = {
  mt: 0.5,
  fontSize: 13,
  fontWeight: 600,
  color: "text.secondary",
  lineHeight: 1.6
};

const panelTitleSx = {
  fontSize: 14,
  fontWeight: 800,
  color: "text.primary"
};

const panelSubtitleSx = {
  mt: 0.4,
  fontSize: 12,
  fontWeight: 600,
  color: "text.secondary",
  lineHeight: 1.5
};

const statGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "repeat(2, minmax(0, 1fr))",
    md: "repeat(4, minmax(0, 1fr))"
  },
  gap: 1.25
};

const statCardSx = (accent, wide, interactive) => ({
  minHeight: 128,
  p: 1.75,
  borderRadius: "16px",
  background: accent,
  color: "#ffffff",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "relative",
  overflow: "hidden",
  cursor: interactive ? "pointer" : "default",
  gridColumn: {
    xs: wide ? "span 2" : "span 1",
    md: wide ? "span 2" : "span 1"
  },
  boxShadow: "0 10px 24px rgba(31, 41, 55, 0.16)",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))"
  },
  "& > *": {
    position: "relative",
    zIndex: 1
  }
});

const statLabelSx = {
  fontSize: 12,
  fontWeight: 800,
  color: "#ffffff",
  textTransform: "uppercase",
  letterSpacing: "0.04em"
};

const statValueSx = {
  mt: 0.75,
  fontSize: 28,
  fontWeight: 800,
  color: "#ffffff",
  lineHeight: 1
};

const statHintSx = {
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(255,255,255,0.88)",
  lineHeight: 1.5
};

const dualPanelGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  gap: 1.5
};

const weeklyBarsWrapSx = {
  mt: 2,
  height: 160,
  display: "flex",
  alignItems: "flex-end",
  gap: 1
};

const weeklyBarColumnSx = {
  flex: 1,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 0.6
};

const hourlyBarsWrapSx = {
  mt: 2,
  height: 112,
  display: "flex",
  alignItems: "flex-end",
  gap: 0.6
};

const hourlyBarColumnSx = {
  flex: 1,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 0.5
};

const mixRingWrapSx = {
  display: "grid",
  placeItems: "center",
  width: { xs: "100%", sm: 140 }
};

const mixInnerRingSx = {
  width: 76,
  height: 76,
  borderRadius: "50%",
  background: (theme) => theme.palette.mode === "dark" ? "#1a2640" : "#ffffff",
  display: "grid",
  placeItems: "center",
  textAlign: "center"
};

const progressTrackSx = {
  width: "100%",
  height: 9,
  borderRadius: 999,
  background: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "#edf2f7",
  overflow: "hidden"
};

const progressFillBaseSx = {
  height: "100%",
  borderRadius: 999
};

const timeItemSx = (surface) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.25,
  p: 1.25,
  borderRadius: "12px",
  border: "1px solid",
  borderColor: surface.borderColor,
  background: surface.background
});

const timeRankSx = (index) => ({
  width: 28,
  height: 28,
  display: "grid",
  placeItems: "center",
  borderRadius: "10px",
  fontSize: 12,
  fontWeight: 800,
  color: index === 0 ? "#4f6ef7" : index === 1 ? "#d97706" : index === 2 ? "#22c55e" : "text.secondary",
  background: (theme) =>
    theme.palette.mode === "dark"
      ? index === 0 ? "rgba(79,110,247,0.18)" : index === 1 ? "rgba(217,119,6,0.18)" : index === 2 ? "rgba(34,197,94,0.18)" : "rgba(148,163,184,0.1)"
      : index === 0 ? "#eef2ff" : index === 1 ? "#fff7ed" : index === 2 ? "#f0fdf4" : "#f3f4f6",
  flexShrink: 0
});

const emptyStateSx = {
  fontSize: 12,
  fontWeight: 700,
  color: "text.secondary",
  textAlign: "center",
  py: 2
};

const filterGridSx = {
  mt: 2,
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
  gap: 1.25
};

const filterLabelSx = {
  mb: 0.6,
  fontSize: 12,
  fontWeight: 800,
  color: "text.secondary",
  textTransform: "uppercase",
  letterSpacing: "0.04em"
};

const textFieldSx = (theme) => ({
  "& .MuiInputBase-root": {
    minHeight: 44,
    borderRadius: "10px",
    background: theme.palette.mode === "dark" ? "#0f172a" : "#ffffff",
    color: theme.palette.mode === "dark" ? "#f8fbff" : "#1e1b4b",
    fontSize: 12,
    fontWeight: 700
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.14)" : "#dbe4f0"
  },
  "& .MuiInputBase-input": {
    fontSize: 12,
    fontWeight: 700,
    color: theme.palette.mode === "dark" ? "#f8fbff" : "#1e1b4b"
  },
  "& .MuiSelect-select": {
    fontSize: 12,
    fontWeight: 700,
    color: theme.palette.mode === "dark" ? "#f8fbff" : "#1e1b4b"
  }
});

const quickActionButtonSx = (active) => ({
  minHeight: 32,
  px: 1.5,
  borderRadius: 999,
  border: "1px solid",
  borderColor: active ? "#4f6ef7" : (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.14)" : "#dbe4f0",
  background: active ? "#4f6ef7" : (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "#ffffff",
  color: active ? "#ffffff" : "text.secondary",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "none",
  "&:hover": {
    borderColor: "#4f6ef7",
    background: active ? "#4f6ef7" : (theme) => theme.palette.mode === "dark" ? "rgba(79,110,247,0.12)" : "#eef2ff"
  }
});

const filterResetButtonSx = (theme) => ({
  minHeight: 40,
  px: 2,
  borderRadius: "10px",
  borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.14)" : "#dbe4f0",
  color: theme.palette.mode === "dark" ? "#f8fbff" : "#374151",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "none"
});

const filterExportButtonSx = {
  minHeight: 40,
  px: 2,
  borderRadius: "10px",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "none",
  background: "linear-gradient(135deg, #4f6ef7, #6366f1)",
  color: "#ffffff"
};

const tableWrapSx = (theme) => ({
  border: "1px solid",
  borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0",
  borderRadius: "16px",
  overflowX: "auto"
});

const tableHeadRowSx = (theme) => ({
  background: theme.palette.mode === "dark" ? "#172033" : "#f8fafc"
});

const headerCellSx = {
  fontSize: 12,
  fontWeight: 800,
  color: "text.secondary",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap"
};

const bodyCellSx = {
  fontSize: 12,
  fontWeight: 700,
  color: "text.secondary",
  whiteSpace: "nowrap"
};

const bodyCellStrongSx = {
  fontSize: 12,
  fontWeight: 800,
  color: "text.primary",
  whiteSpace: "nowrap"
};

const emptyTableCellSx = {
  py: 4,
  fontSize: 12,
  fontWeight: 700,
  color: "text.secondary"
};

const tableBodyRowSx = (theme) => ({
  "&:hover": {
    background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "#f9fafb"
  }
});

const paginationButtonSx = (theme) => ({
  minWidth: 40,
  height: 36,
  borderRadius: "10px",
  borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.14)" : "#dbe4f0",
  color: theme.palette.mode === "dark" ? "#f8fbff" : "#374151",
  fontSize: 12,
  fontWeight: 800
});

const activePaginationButtonSx = {
  minWidth: 40,
  height: 36,
  borderRadius: "10px",
  fontSize: 12,
  fontWeight: 800,
  background: "#4f6ef7",
  color: "#ffffff"
};

const reportButtonSx = {
  minHeight: 40,
  px: 2,
  borderRadius: "10px",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "none",
  whiteSpace: "nowrap",
  background: "linear-gradient(135deg, #14b8a6, #0f766e)",
  color: "#ffffff"
};

const usageGridSx = {
  mt: 2,
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
  gap: 1
};

const usageMetricCardSx = {
  p: 1.5,
  borderRadius: "12px",
  border: "1px solid",
  borderColor: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "#f1f5f9",
  background: (theme) => theme.palette.mode === "dark" ? "#152033" : "#f9fafb"
};

const usageMetricLabelSx = {
  fontSize: 12,
  fontWeight: 800,
  color: "text.secondary",
  textTransform: "uppercase",
  letterSpacing: "0.04em"
};
