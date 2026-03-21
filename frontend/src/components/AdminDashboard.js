import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
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

export default function AdminDashboard({ setScreen, mode, onToggleMode }) {
  const theme = useTheme();
  const [summary, setSummary] = useState({
    total: 0,
    students: 0,
    staff: 0,
    guests: 0
  });
  const [currentlyInside, setCurrentlyInside] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [footfall, setFootfall] = useState({
    total_students: 0,
    computer_users: 0,
    non_computer_users: 0
  });
  const [monthlyFootfall, setMonthlyFootfall] = useState([]);
  const [studentTime, setStudentTime] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [peakHour, setPeakHour] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [pageLimit] = useState(10);
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState("");
  const [logError, setLogError] = useState("");
  const [filters, setFilters] = useState({
    visit_date: getTodayValue(),
    visitor_type: "all",
    search: "",
    department: "",
    use_computer: "all",
    status: "all"
  });

  useEffect(() => {
    const loadDashboard = async () => {
      setDashboardLoading(true);
      setError("");

      try {
        const [
          summaryRes,
          leaderboardRes,
          footfallRes,
          monthlyRes,
          studentTimeRes,
          totalTimeRes,
          peakHourRes,
          currentlyInsideRes
        ] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/dashboard"),
          axios.get("http://localhost:5000/api/admin/leaderboard"),
          axios.get("http://localhost:5000/api/admin/footfall"),
          axios.get("http://localhost:5000/api/admin/monthly-footfall"),
          axios.get("http://localhost:5000/api/admin/student-time-today"),
          axios.get("http://localhost:5000/api/admin/total-time-today"),
          axios.get("http://localhost:5000/api/admin/peak-hour"),
          axios.get("http://localhost:5000/api/admin/currently-inside")
        ]);

        setSummary(summaryRes.data);
        setLeaderboard(leaderboardRes.data);
        setFootfall(footfallRes.data);
        setMonthlyFootfall(monthlyRes.data);
        setStudentTime(studentTimeRes.data);
        setTotalTime(totalTimeRes.data?.total_minutes || 0);
        setPeakHour(peakHourRes.data);
        setCurrentlyInside(currentlyInsideRes.data?.count || 0);
      } catch (err) {
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
        const params = {};

        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "all") {
            params[key] = value;
          }
        });

        params.page = currentPage;
        params.limit = pageLimit;

        const res = await axios.get("http://localhost:5000/api/admin/visit-logs", { params });
        setLogs(res.data.data || []);
        setCurrentPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
        setTotalLogs(res.data.total || 0);
      } catch (err) {
        setLogError("Visit logs could not be loaded.");
      } finally {
        setLogsLoading(false);
      }
    };

    loadLogs();
  }, [filters, currentPage, pageLimit]);

  const handleUpload = async () => {
    if (!file) {
      setUploadMsg("Select an Excel file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/admin/upload-students",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setUploadMsg(`${res.data.inserted} students uploaded successfully.`);
    } catch (err) {
      setUploadMsg("Excel upload failed.");
    }
  };

  const handleExportLogs = async () => {
    try {
      const params = {};

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params[key] = value;
        }
      });

      const response = await axios.get("http://localhost:5000/api/admin/export-logs", {
        params,
        responseType: "blob"
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "library_logs.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setUploadMsg("Log export failed.");
    }
  };

  const departmentOptions = useMemo(() => {
    return Array.from(
      new Set(
        logs
          .map((item) => item.department)
          .filter(Boolean)
      )
    ).sort();
  }, [logs]);

  const maxMonthly = Math.max(...monthlyFootfall.map((item) => item.total_students || 0), 1);
  const computerUsageTotal = Math.max(
    (footfall.computer_users || 0) + (footfall.non_computer_users || 0),
    1
  );
  const insideFilterActive = filters.status === "inside";

  const handleCurrentlyInsideClick = () => {
    setFilters((prev) => ({
      ...prev,
      visit_date: "",
      status: "inside"
    }));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top right, rgba(125,211,252,0.12), transparent 24%), radial-gradient(circle at top left, rgba(52,211,153,0.1), transparent 26%), linear-gradient(180deg, #0f172a 0%, #111c2f 100%)"
            : "radial-gradient(circle at top right, rgba(37,99,235,0.16), transparent 24%), radial-gradient(circle at top left, rgba(15,118,110,0.14), transparent 26%), linear-gradient(180deg, #edf4fb 0%, #e5edf8 100%)",
        py: { xs: 3, md: 5 },
        px: 2
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Paper sx={heroSx}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", lg: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="overline" sx={heroEyebrowSx}>
                  Administrative Dashboard
                </Typography>
                <Typography variant="h4" sx={heroTitleSx}>
                  Library operations
                </Typography>
                <Typography sx={heroBodySx}>
                  Monitor daily traffic, review timestamps, filter visit logs, and manage student data upload from one place.
                </Typography>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <ThemeToggleButton mode={mode} onToggle={onToggleMode} />
                <Button variant="outlined" sx={refreshButtonSx} onClick={() => setFilters((prev) => ({ ...prev }))}>
                  Refresh Logs
                </Button>
                <Button variant="contained" sx={logoutButtonSx} onClick={() => setScreen("home")}>
                  Logout
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {dashboardLoading && <LinearProgress sx={{ borderRadius: 999 }} />}
          {error && <Alert severity="error">{error}</Alert>}
          {uploadMsg && <Alert severity={uploadMsg.includes("failed") ? "error" : "success"}>{uploadMsg}</Alert>}

          <Grid container spacing={2}>
            {[
              { label: "Total Entries Today", value: summary.total, accent: "linear-gradient(135deg, #1d4ed8, #60a5fa)" },
              { label: "Students", value: summary.students, accent: "linear-gradient(135deg, #0f766e, #34d399)" },
              { label: "Staff", value: summary.staff, accent: "linear-gradient(135deg, #b45309, #f59e0b)" },
              { label: "Guests", value: summary.guests, accent: "linear-gradient(135deg, #7c3aed, #c084fc)" },
              { label: "Currently Inside", value: currentlyInside, accent: "linear-gradient(135deg, #be123c, #fb7185)" }
            ].map((item) => (
              <Grid item xs={12} sm={6} lg={item.label === "Currently Inside" ? 12 : 3} xl={item.label === "Currently Inside" ? 3 : undefined} key={item.label}>
                <Paper
                  onClick={item.label === "Currently Inside" ? handleCurrentlyInsideClick : undefined}
                  sx={{
                    ...cardSx,
                    background: item.accent,
                    cursor: item.label === "Currently Inside" ? "pointer" : "default",
                    transform: item.label === "Currently Inside" && insideFilterActive ? "translateY(-2px)" : "none",
                    boxShadow:
                      item.label === "Currently Inside" && insideFilterActive
                        ? "0 0 0 3px rgba(255,255,255,0.35), 0 18px 40px rgba(15, 23, 42, 0.18)"
                        : cardSx.boxShadow,
                    transition: "transform 160ms ease, box-shadow 160ms ease",
                    "&:hover":
                      item.label === "Currently Inside"
                        ? {
                            transform: "translateY(-2px)",
                            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)"
                          }
                        : undefined
                  }}
                >
                  <Typography sx={metricLabelSx}>{item.label}</Typography>
                  <Typography variant="h4" sx={metricValueSx}>
                    {item.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={8}>
              <Paper sx={panelSx}>
                <Typography variant="h6" sx={panelTitleSx}>
                  Visit log filters
                </Typography>
                <Typography sx={panelTextSx}>
                  Narrow down logs by date, visitor type, status, and visitor details. Quick date actions are provided for common desk workflows.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
                  <Chip label="Today" onClick={() => updateFilter(setFilters, "visit_date", getTodayValue())} sx={actionChipSx} />
                  <Chip label="Yesterday" onClick={() => updateFilter(setFilters, "visit_date", getRelativeDateValue(-1))} sx={actionChipSx} />
                  <Chip label="All Dates" onClick={() => updateFilter(setFilters, "visit_date", "")} sx={actionChipSx} />
                </Stack>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FilterField
                      title="Log Date"
                      helper="Choose a specific visit date"
                      field={
                        <TextField
                          label="Visit Date"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={filters.visit_date}
                          onChange={(e) => updateFilter(setFilters, "visit_date", e.target.value)}
                          sx={filterInputSx}
                        />
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FilterField
                      title="Visitor Type"
                      helper="Switch between student, staff, and guest"
                      field={
                        <TextField
                          select
                          label="Visitor Type"
                          fullWidth
                          value={filters.visitor_type}
                          onChange={(e) => updateFilter(setFilters, "visitor_type", e.target.value)}
                          sx={filterInputSx}
                        >
                          <MenuItem value="all">All</MenuItem>
                          <MenuItem value="student">Student</MenuItem>
                          <MenuItem value="staff">Staff</MenuItem>
                          <MenuItem value="guest">Guest</MenuItem>
                        </TextField>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FilterField
                      title="Status"
                      helper="Filter people currently inside or already exited"
                      field={
                        <TextField
                          select
                          label="Status"
                          fullWidth
                          value={filters.status}
                          onChange={(e) => updateFilter(setFilters, "status", e.target.value)}
                          sx={filterInputSx}
                        >
                          <MenuItem value="all">All</MenuItem>
                          <MenuItem value="inside">Currently Inside</MenuItem>
                          <MenuItem value="exited">Exited</MenuItem>
                        </TextField>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FilterField
                      title="Computer Usage"
                      helper="Useful for student lab access analysis"
                      field={
                        <TextField
                          select
                          label="Computer Usage"
                          fullWidth
                          value={filters.use_computer}
                          onChange={(e) => updateFilter(setFilters, "use_computer", e.target.value)}
                          sx={filterInputSx}
                        >
                          <MenuItem value="all">All</MenuItem>
                          <MenuItem value="YES">Yes</MenuItem>
                          <MenuItem value="NO">No</MenuItem>
                        </TextField>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FilterField
                      title="Search"
                      helper="Search by visitor name or roll number"
                      field={
                        <TextField
                          label="Name or Roll Number"
                          fullWidth
                          value={filters.search}
                          onChange={(e) => updateFilter(setFilters, "search", e.target.value)}
                          sx={filterInputSx}
                        />
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FilterField
                      title="Department"
                      helper="Available when the visitor is a student"
                      field={
                        <TextField
                          select
                          label="Department"
                          fullWidth
                          value={filters.department}
                          onChange={(e) => updateFilter(setFilters, "department", e.target.value)}
                          sx={filterInputSx}
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
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FilterField
                      title="Actions"
                      helper="Reset the view to today&apos;s default filters"
                      field={
                        <Stack direction="row" spacing={1.5} sx={{ height: "100%", alignItems: "center" }}>
                          <Button
                            variant="outlined"
                            sx={clearButtonSx}
                            onClick={() =>
                              setFilters({
                                visit_date: getTodayValue(),
                                visitor_type: "all",
                                search: "",
                                department: "",
                                use_computer: "all",
                                status: "all"
                              })
                            }
                          >
                            Reset Filters
                          </Button>
                          <Button
                            variant="contained"
                            sx={exportButtonSx}
                            onClick={handleExportLogs}
                          >
                            Export Logs
                          </Button>
                        </Stack>
                      }
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper sx={panelSx}>
                <Typography variant="h6" sx={panelTitleSx}>
                  Upload students
                </Typography>
                <Typography sx={panelTextSx}>
                  Upload an Excel file containing roll number, name, year, and department columns.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
                  <Button
                    component="a"
                    href="/student-upload-template.csv"
                    download
                    variant="outlined"
                    sx={downloadButtonSx}
                  >
                    Download Template
                  </Button>
                </Stack>
                <Box sx={{ mt: 2 }}>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{ width: "100%" }}
                  />
                </Box>
                <Button variant="contained" sx={uploadButtonSx} onClick={handleUpload}>
                  Upload Excel File
                </Button>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={panelSx}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6" sx={panelTitleSx}>
                  Visit logs
                </Typography>
                <Typography sx={panelTextSx}>
                  Entry and exit timestamps with filterable operational records.
                </Typography>
              </Box>
              <Typography sx={{ color: "text.secondary", alignSelf: "center" }}>
                Showing {logs.length} of {totalLogs} record{totalLogs === 1 ? "" : "s"}
              </Typography>
            </Stack>

            {logsLoading && <LinearProgress sx={{ mb: 2, borderRadius: 999 }} />}
            {logError && <Alert severity="error" sx={{ mb: 2 }}>{logError}</Alert>}

            <TableContainer sx={{ border: "1px solid #e1e9f2", borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "linear-gradient(90deg, #f5f8fc, #eef3fb)" }}>
                    <TableCell>Visitor Type</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Roll No</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Visit Date</TableCell>
                    <TableCell>Entry Time</TableCell>
                    <TableCell>Exit Time</TableCell>
                    <TableCell>Computer</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No visit logs found for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {logs.map((log) => (
                    <TableRow key={log.log_id} hover>
                      <TableCell sx={{ textTransform: "capitalize" }}>{log.visitor_type}</TableCell>
                      <TableCell>{log.visitor_name || "-"}</TableCell>
                      <TableCell>{log.roll_no || "-"}</TableCell>
                      <TableCell>{log.department || "-"}</TableCell>
                      <TableCell>{formatDate(log.visit_date)}</TableCell>
                      <TableCell>{formatDateTime(log.entry_time)}</TableCell>
                      <TableCell>{formatDateTime(log.exit_time)}</TableCell>
                      <TableCell>{log.use_computer || "-"}</TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              alignItems="center"
              sx={{ mt: 2.5, flexWrap: "wrap", gap: 1 }}
            >
              <Button
                variant="outlined"
                sx={paginationButtonSx}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Prev
              </Button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "contained" : "outlined"}
                  sx={pageNumber === currentPage ? activePaginationButtonSx : paginationButtonSx}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              ))}

              <Button
                variant="outlined"
                sx={paginationButtonSx}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </Stack>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={6}>
              <Paper sx={panelSx}>
                <Typography variant="h6" sx={panelTitleSx}>
                  Student leaderboard
                </Typography>
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                  {leaderboard.slice(0, 8).map((item, index) => (
                    <Box key={`${item.roll_no}-${index}`} sx={listRowSx}>
                      <Typography sx={{ color: "text.primary", fontWeight: 600 }}>
                        {index + 1}. {item.visitor_name}
                      </Typography>
                      <Typography sx={{ color: "text.secondary" }}>
                        {item.roll_no || "-"} | {item.visits} visits
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Paper sx={panelSx}>
                <Typography variant="h6" sx={panelTitleSx}>
                  Time spent today
                </Typography>
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                  {studentTime.slice(0, 8).map((item, index) => (
                    <Box key={`${item.roll_no}-${index}`} sx={listRowSx}>
                      <Typography sx={{ color: "text.primary", fontWeight: 600 }}>
                        {item.visitor_name}
                      </Typography>
                      <Typography sx={{ color: "text.secondary" }}>
                        {item.roll_no || "-"} | {item.minutes_spent} minutes
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={7}>
              <Paper sx={panelSx}>
                <Typography variant="h6" sx={panelTitleSx}>
                  Monthly student footfall
                </Typography>
                <Stack spacing={1.4} sx={{ mt: 2 }}>
                  {monthlyFootfall.map((item) => (
                    <Box key={item.month}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.6 }}>
                        <Typography sx={{ color: "text.secondary" }}>
                          {monthLabel(item.month)}
                        </Typography>
                        <Typography sx={{ color: "text.secondary" }}>
                          {item.total_students}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(item.total_students / maxMonthly) * 100}
                        sx={{
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: "#e8eef7",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 999,
                            background: "#2563eb"
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Paper sx={panelSx}>
                <Typography variant="h6" sx={panelTitleSx}>
                  Today&apos;s usage
                </Typography>
                <Divider sx={{ my: 2 }} />
                <MetricRow label="Students Logged" value={footfall.total_students} />
                <MetricRow label="Using Computer" value={footfall.computer_users} />
                <MetricRow label="Not Using Computer" value={footfall.non_computer_users} />
                <MetricRow label="Peak Hour" value={peakHour?.hour !== undefined ? `${peakHour.hour}:00` : "No data"} />
                <MetricRow label="Total Time" value={`${totalTime} min`} />

                <Box sx={{ mt: 2.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(footfall.computer_users / computerUsageTotal) * 100}
                    sx={{
                      height: 10,
                      borderRadius: 999,
                      backgroundColor: "#e8eef7",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        background: "#0f766e"
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

function updateFilter(setFilters, key, value) {
  setFilters((prev) => ({
    ...prev,
    [key]: value
  }));
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

function MetricRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.8 }}>
      <Typography sx={{ color: "text.secondary" }}>{label}</Typography>
      <Typography sx={{ color: "text.primary", fontWeight: 700 }}>{value}</Typography>
    </Stack>
  );
}

function StatusBadge({ status }) {
  const isInside = status === "Inside";

  return (
    <Box
      sx={{
        display: "inline-flex",
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: isInside ? "#065f46" : "#92400e",
        background: isInside ? "#d1fae5" : "#fef3c7"
      }}
    >
      {status}
    </Box>
  );
}

function FilterField({ title, helper, field }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, #16243a 0%, #182a45 100%)"
            : "linear-gradient(180deg, #fbfdff 0%, #f6f9fd 100%)",
        height: "100%"
      }}
    >
      <Typography sx={filterTitleSx}>{title}</Typography>
      <Typography sx={filterHelperSx}>{helper}</Typography>
      <Box sx={{ mt: 1.5 }}>{field}</Box>
    </Box>
  );
}

const heroSx = {
  p: { xs: 3, md: 4 },
  borderRadius: 5,
  border: "1px solid",
  borderColor: "divider",
  background: (theme) =>
    theme.palette.mode === "dark"
      ? "linear-gradient(135deg, #122038 0%, #172842 100%)"
      : "linear-gradient(135deg, #ffffff 0%, #f3f7fd 100%)",
  boxShadow: "0 18px 50px rgba(15, 23, 42, 0.06)"
};

const cardSx = {
  p: 3,
  borderRadius: 4,
  color: "#ffffff",
  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)"
};

const panelSx = {
  p: 3,
  borderRadius: 4,
  border: "1px solid",
  borderColor: "divider",
  background: "background.paper",
  height: "100%",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)"
};

const metricLabelSx = {
  color: "rgba(255,255,255,0.82)",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: 1.2
};

const metricValueSx = {
  mt: 1.25,
  color: "#ffffff",
  fontWeight: 800,
  fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif'
};

const panelTitleSx = {
  color: "text.primary",
  fontWeight: 700,
  fontFamily: 'Cambria, Georgia, serif'
};

const panelTextSx = {
  mt: 1,
  color: "text.secondary",
  lineHeight: 1.7
};

const heroEyebrowSx = {
  color: "primary.main",
  letterSpacing: 2,
  fontWeight: 700
};

const heroTitleSx = {
  mt: 1,
  color: "text.primary",
  fontWeight: 800,
  fontFamily: 'Cambria, Georgia, serif'
};

const heroBodySx = {
  mt: 1.25,
  color: "text.secondary",
  lineHeight: 1.7,
  maxWidth: 720
};

const listRowSx = {
  p: 1.5,
  borderRadius: 3,
  background: (theme) =>
    theme.palette.mode === "dark"
      ? "linear-gradient(180deg, #16243a 0%, #182a45 100%)"
      : "linear-gradient(180deg, #f8fbff 0%, #f3f7fc 100%)",
  border: "1px solid",
  borderColor: "divider"
};

const uploadButtonSx = {
  mt: 2,
  py: 1.2,
  borderRadius: 3,
  fontWeight: 700,
  background: "#2563eb"
};

const logoutButtonSx = {
  py: 1.15,
  px: 2.2,
  borderRadius: 3,
  fontWeight: 700,
  background: "#b45309"
};

const refreshButtonSx = {
  py: 1.15,
  px: 2.2,
  borderRadius: 3,
  fontWeight: 700,
  borderColor: "divider",
  color: "text.primary",
  "&:hover": {
    borderColor: "primary.main",
    background: "action.hover"
  }
};

const clearButtonSx = {
  py: 1.15,
  flex: 1,
  borderRadius: 3,
  fontWeight: 700,
  borderColor: "divider",
  color: "text.primary",
  "&:hover": {
    borderColor: "primary.main",
    background: "action.hover"
  }
};

const exportButtonSx = {
  flex: 1,
  py: 1.15,
  borderRadius: 3,
  fontWeight: 700,
  background: "#2563eb"
};

const filterTitleSx = {
  color: "text.primary",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: "uppercase"
};

const filterHelperSx = {
  mt: 0.5,
  color: "text.secondary",
  fontSize: 13,
  minHeight: 36
};

const filterInputSx = {
  "& .MuiOutlinedInput-root": {
    background: "background.paper"
  }
};

const actionChipSx = {
  borderRadius: 2,
  fontWeight: 700,
  color: "primary.main",
  background: (theme) => (theme.palette.mode === "dark" ? "#16243a" : "#eaf2ff"),
  border: "1px solid",
  borderColor: (theme) => (theme.palette.mode === "dark" ? "#264766" : "#cfe0fb"),
  "&:hover": {
    background: (theme) => (theme.palette.mode === "dark" ? "#1b2d49" : "#dce9ff")
  }
};

const downloadButtonSx = {
  py: 1.1,
  borderRadius: 3,
  fontWeight: 700,
  borderColor: "divider",
  color: "text.primary",
  "&:hover": {
    borderColor: "primary.main",
    background: "action.hover"
  }
};

const paginationButtonSx = {
  minWidth: 44,
  borderRadius: 3,
  fontWeight: 700,
  borderColor: "divider",
  color: "text.primary",
  "&:hover": {
    borderColor: "primary.main",
    background: "action.hover"
  }
};

const activePaginationButtonSx = {
  minWidth: 44,
  borderRadius: 3,
  fontWeight: 700,
  background: "#2563eb"
};
