import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import API_BASE from "../api";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography
} from "@mui/material";
import {
  Add,
  ArrowBack,
  CheckCircleOutline,
  DeleteOutline,
  DescriptionOutlined,
  FileUploadOutlined,
  SyncAlt,
  TableChartOutlined,
  WarningAmber
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import ThemeToggleButton from "./ThemeToggleButton";


const DEFAULT_FILTERS = {
  academic_year: "all",
  course: "all",
  status: "all",
  search: ""
};

const EMPTY_ADD_FORM = {
  roll_no: "",
  name: "",
  course: "",
  admission_year: new Date().getFullYear().toString()
};

const PAGE_TABS = [
  { id: "overview", label: "Overview", icon: "◈" },
  { id: "students", label: "Students", icon: "◉" },
  { id: "upload", label: "Upload", icon: "⇑" },
  { id: "danger", label: "Danger Zone", icon: "⚠" }
];

export default function AdminStudentManagement({ setScreen, mode, onToggleMode }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [studentTimeToday, setStudentTimeToday] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const theme = useTheme();
  const uploadSectionRef = useRef(null);  
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    fyEligible: 0,
    syEligible: 0
  });
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedRollNos, setSelectedRollNos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteContext, setPromoteContext] = useState({
    rollNos: [],
    filters: null,
    label: "all active students",
    fyCount: 0,
    syCount: 0
  });
  const [promoteSubmitting, setPromoteSubmitting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupLogs, setCleanupLogs] = useState(true);
  const [cleanupStudents, setCleanupStudents] = useState(false);
  const [cleanupConfirmText, setCleanupConfirmText] = useState("");
  const [cleanupSubmitting, setCleanupSubmitting] = useState(false);
  const [uploadTab, setUploadTab] = useState("upload");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [lastUploadSummary, setLastUploadSummary] = useState(null);

  const currentPageStudents = students;
  const selectedStudents = useMemo(
    () => currentPageStudents.filter((student) => selectedRollNos.includes(student.roll_no)),
    [currentPageStudents, selectedRollNos]
  );
  const allRowsSelected =
    currentPageStudents.length > 0 &&
    currentPageStudents.every((student) => selectedRollNos.includes(student.roll_no));

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setTableError("");
  

    try {
      const [studentsRes, leaderboardRes, timeRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/students`, {
          params: {
            ...Object.fromEntries(
              Object.entries(filters).filter(([, value]) => value && value !== "all")
            ),
            page: currentPage,
            limit: 8
          }
        }),
        axios.get(`${API_BASE}/api/admin/leaderboard`),
        axios.get(`${API_BASE}/api/admin/student-time-today`)
      ]);

      setStudents(studentsRes.data.data || []);
      setStats((prev) => ({
        ...prev,
        ...studentsRes.data.stats
      }));
      setCourses(studentsRes.data.courses || []);
      setLeaderboard(leaderboardRes.data);
      setStudentTimeToday(timeRes.data || []);
      setTotalPages(studentsRes.data.totalPages || 1);
      setTotalStudents(studentsRes.data.total || 0);
      setSelectedRollNos((previous) =>
        previous.filter((rollNo) =>
          (studentsRes.data.data || []).some((student) => student.roll_no === rollNo)
        )
      );
    } catch (error) {
      setTableError(error.response?.data?.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  function showToast(message, severity = "success") {
    setSnackbar({
      open: true,
      message,
      severity
    });
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function resetAddForm() {
    setAddForm(EMPTY_ADD_FORM);
  }

  function handleFileSelect(file) {
    setUploadFile(file || null);
    setUploadPreview(null);
    setLastUploadSummary(null);
    setUploadTab("upload");
  }

  async function handleAddStudent() {
    setAddSubmitting(true);

    try {
      await axios.post(`${API_BASE}/api/admin/students`, {
        ...addForm,
        admission_year: Number.parseInt(addForm.admission_year, 10)
      });
      setAddDialogOpen(false);
      resetAddForm();
      showToast("Student added successfully.");
      await loadStudents();
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to add student.", "error");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function requestUploadPreview() {
    if (!uploadFile) {
      showToast("Choose a CSV or XLSX file first.", "error");
      return;
    }

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("mode", "preview");

      const response = await axios.post(
        `${API_BASE}/api/admin/upload-students`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setUploadPreview(response.data);
      setLastUploadSummary(null);
      setUploadTab("preview");
      showToast("Upload preview generated.");
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to preview upload.", "error");
    } finally {
      setUploadLoading(false);
    }
  }

  async function confirmUpload() {
    if (!uploadFile) {
      showToast("Choose a CSV or XLSX file first.", "error");
      return;
    }

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("mode", "confirm");

      const response = await axios.post(
        `${API_BASE}/api/admin/upload-students`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setLastUploadSummary({
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        inserted: response.data.inserted || 0,
        skipped: response.data.skipped || 0,
        totalRows: response.data.totalRows || 0
      });
      setUploadFile(null);
      setUploadPreview(null);
      setUploadTab("upload");
      showToast(response.data.message || "Students uploaded successfully.");
      await loadStudents();
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to upload students.", "error");
    } finally {
      setUploadLoading(false);
    }
  }

  function openPromoteDialog(context) {
    setPromoteContext(context);
    setPromoteDialogOpen(true);
  }

  function openBulkPromoteDialog() {
    if (selectedStudents.length === 0) {
      return;
    }

    openPromoteDialog({
      rollNos: selectedStudents.map((student) => student.roll_no),
      label: `${selectedStudents.length} selected student${selectedStudents.length === 1 ? "" : "s"}`,
      fyCount: selectedStudents.filter(
        (student) => student.status === "active" && student.academic_year === "FY"
      ).length,
      syCount: selectedStudents.filter(
        (student) => student.status === "active" && student.academic_year === "SY"
      ).length
    });
  }

  // Option B: fetch exact FY/SY eligible counts for the currently filtered view
  // before opening the dialog, so the counts reflect only the filtered students.
  async function openPromoteAllDialog() {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v && v !== "all")
    );
    const hasFilters = Object.keys(activeFilters).length > 0;

    // Respect the user's academic_year filter: only query year buckets that
    // are not already excluded by the filter.
    const filterYear = filters.academic_year;
    const includeFY = !filterYear || filterYear === "all" || filterYear === "FY";
    const includeSY = !filterYear || filterYear === "all" || filterYear === "SY";

    const fyQuery = includeFY
      ? axios.get(`${API_BASE}/api/admin/students`, {
          params: { ...activeFilters, status: "active", academic_year: "FY", limit: 1 }
        })
      : Promise.resolve({ data: { total: 0 } });

    const syQuery = includeSY
      ? axios.get(`${API_BASE}/api/admin/students`, {
          params: { ...activeFilters, status: "active", academic_year: "SY", limit: 1 }
        })
      : Promise.resolve({ data: { total: 0 } });

    try {
      const [fyRes, syRes] = await Promise.all([fyQuery, syQuery]);
      openPromoteDialog({
        rollNos: [],
        filters: hasFilters ? activeFilters : null,
        label: hasFilters ? "filtered active students" : "all active students",
        fyCount: fyRes.data.total || 0,
        syCount: syRes.data.total || 0
      });
    } catch {
      // Fallback to global stats on network error
      openPromoteDialog({
        rollNos: [],
        filters: null,
        label: "all active students",
        fyCount: stats.fyEligible || 0,
        syCount: stats.syEligible || 0
      });
    }
  }

  function openSinglePromoteDialog(student) {
    openPromoteDialog({
      rollNos: [student.roll_no],
      label: student.name,
      fyCount: student.status === "active" && student.academic_year === "FY" ? 1 : 0,
      syCount: student.status === "active" && student.academic_year === "SY" ? 1 : 0
    });
  }

  async function handlePromoteStudents() {
    setPromoteSubmitting(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/admin/students/promote`,
        { rollNos: promoteContext.rollNos },
        // Forward active filters as query params so the backend scopes the
        // promotion to the filtered set (only used when rollNos is empty).
        { params: promoteContext.filters || {} }
      );
      setPromoteDialogOpen(false);
      setSelectedRollNos([]);
      showToast(
        `${response.data.promotedToSY} moved to SY, ${response.data.movedToInactive} moved to inactive.`
      );
      await loadStudents();
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to promote students.", "error");
    } finally {
      setPromoteSubmitting(false);
    }
  }

  async function handleDeactivateStudent() {
    if (!deactivateTarget) {
      return;
    }

    setActionSubmitting(true);

    try {
      const response = await axios.patch(
        `${API_BASE}/api/admin/students/${deactivateTarget.roll_no}/deactivate`
      );
      setDeactivateTarget(null);
      showToast(response.data.message || "Student deactivated successfully.");
      await loadStudents();
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to deactivate student.", "error");
    } finally {
      setActionSubmitting(false);
    }
  }

  async function handleDeleteStudent() {
    if (!deleteTarget) {
      return;
    }

    setActionSubmitting(true);

    try {
      const response = await axios.delete(
        `${API_BASE}/api/admin/students/${deleteTarget.roll_no}`
      );
      setDeleteTarget(null);
      setSelectedRollNos((previous) =>
        previous.filter((rollNo) => rollNo !== deleteTarget.roll_no)
      );
      showToast(response.data.message || "Student deleted successfully.");
      await loadStudents();
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to delete student.", "error");
    } finally {
      setActionSubmitting(false);
    }
  }

  async function handleCleanupInactive() {
    if (!cleanupLogs && !cleanupStudents) return;
    setCleanupSubmitting(true);

    try {
      const response = await axios.delete(`${API_BASE}/api/admin/students/inactive`, {
        params: {
          deleteLogs: cleanupLogs,
          deleteStudents: cleanupStudents
        }
      });
      setCleanupDialogOpen(false);
      setCleanupConfirmText("");
      showToast(response.data.message || "Cleanup completed successfully.");
      await loadStudents();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Unable to complete cleanup.",
        "error"
      );
    } finally {
      setCleanupSubmitting(false);
    }
  }


  function toggleStudentSelection(rollNo) {
    setSelectedRollNos((previous) =>
      previous.includes(rollNo)
        ? previous.filter((value) => value !== rollNo)
        : [...previous, rollNo]
    );
  }

  function toggleAllVisibleRows() {
    if (allRowsSelected) {
      setSelectedRollNos([]);
      return;
    }

    setSelectedRollNos(currentPageStudents.map((student) => student.roll_no));
  }

  function scrollToUploadSection() {
    setUploadTab("upload");
    uploadSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set([1, totalPages]);
    for (let d = -1; d <= 1; d++) {
      const p = currentPage + d;
      if (p > 1 && p < totalPages) pages.add(p);
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
      result.push(sorted[i]);
    }
    return result;
  }, [totalPages, currentPage]);

  const statCards = [
    {
      label: "Total students",
      value: stats.total,
      description: "All records currently in the system",
      accent: "#1a56db"
    },
    {
      label: "Active",
      value: stats.active,
      description: "Students allowed for library entry",
      accent: "#0f766e"
    },
    {
      label: "Inactive",
      value: stats.inactive,
      description: "Students retained for history only",
      accent: "#b45309"
    },
    {
      label: "Pending promotion",
      value: stats.pending,
      description: "Students waiting for year-end status change",
      accent: "#dc2626"
    }
  ];
  const activeFileCard = uploadFile
    ? {
        name: uploadFile.name,
        size: uploadFile.size,
        status: uploadLoading
          ? "Working"
          : uploadPreview
            ? "Preview Ready"
            : "Selected"
      }
    : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: theme.palette.mode === "dark" ? "#0f1117" : "#f0f2f7",
        color: "text.primary"
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          maxWidth: "none",
          px: 0
        }}
      >
        <Stack spacing={0}>
          <Paper sx={headerCardSx(theme)}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography sx={headerLabelSx}>Student Management</Typography>
                <Typography variant="h4" sx={headerTitleSx}>
                  Manage students
                </Typography>
                <Typography sx={headerBodySx}>
                  Add, promote, deactivate, and delete students while keeping lifecycle
                  controls separate from the visit system.
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <ThemeToggleButton mode={mode} onToggle={onToggleMode} />
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  sx={backActionButtonSx(theme)}
                  onClick={() => setScreen("adminDashboard")}
                >
                  Back to Dashboard
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Box sx={actionBarSx(theme)}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              <Button
                variant="contained"
                startIcon={<Add />}
                sx={primaryActionButtonSx}
                onClick={() => setAddDialogOpen(true)}
              >
                Add Student
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileUploadOutlined />}
                sx={secondaryActionButtonSx}
                onClick={() => {
                  setActiveTab("upload");
                  setTimeout(scrollToUploadSection, 0);
                }}
              >
                Upload CSV/XLSX
              </Button>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ ml: "auto" }}>
              <Button
                variant="contained"
                startIcon={<SyncAlt />}
                sx={successActionButtonSx}
                onClick={openPromoteAllDialog}
              >
                Promote Students
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteOutline />}
                sx={dangerActionButtonSx}
                onClick={() => setCleanupDialogOpen(true)}
              >
                Clean up
              </Button>
            </Stack>
          </Box>

          <Box sx={tabNavSx(theme)}>
            {PAGE_TABS.map((tab) => (
              <Button
                key={tab.id}
                variant="text"
                onClick={() => setActiveTab(tab.id)}
                sx={tabButtonSx(theme, activeTab === tab.id, tab.id === "danger")}
              >
                <Box component="span" sx={{ fontSize: 12, mr: 0.8 }}>
                  {tab.icon}
                </Box>
                {tab.label}
              </Button>
            ))}
          </Box>

          <Box sx={panelSx}>

          {activeTab === "overview" && (
            <>
          <Box sx={statsGridSx}>
            {statCards.map((card) => (
              <Paper key={card.label} sx={statCardSx(theme, card.accent)}>
                <Box sx={statAccentSx(card.accent)} />
                <Typography sx={statLabelSx}>{card.label}</Typography>
                <Typography sx={statValueSx(card.accent)}>{card.value}</Typography>
                <Typography sx={statDescriptionSx}>{card.description}</Typography>
              </Paper>
            ))}
          </Box>
          <Paper sx={sectionCardSx(theme)}>
  <Typography sx={sectionTitleSx}>Student Leaderboard</Typography>
  <Typography sx={sectionSubSx}>
    Ranked by library activity (based on total visits).
  </Typography>

  <TableContainer
    sx={{
      mt: 2,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 3,
      overflowX: "auto"
    }}
  >
    <Table size="small">
      <TableHead>
        <TableRow
          sx={{
            background: theme.palette.mode === "dark" ? "#172033" : "#f6f8fc"
          }}
        >
          <TableCell>Rank</TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Roll No</TableCell>
          <TableCell>Course</TableCell>
          <TableCell>Academic Year</TableCell>
          <TableCell align="right">Visits</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {leaderboard.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
              No leaderboard data available
            </TableCell>
          </TableRow>
        )}

        {leaderboard.map((student, index) => {
          const isTop3 = index < 3;

          return (
            <TableRow key={student.roll_no} hover sx={{ transition: "background-color 0.2s ease, transform 0.2s ease", "&:hover": { transform: "scale(1.002)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", zIndex: 1, position: "relative" } }}>
              {/* Rank */}
              <TableCell sx={{ fontWeight: 800 }}>
                {index + 1}
              </TableCell>

              {/* Name */}
              <TableCell sx={{ fontWeight: 600 }}>
                {student.name}
              </TableCell>

              {/* Roll No */}
              <TableCell sx={{ fontFamily: "monospace" }}>
                {student.roll_no}
              </TableCell>

              {/* Course */}
              <TableCell>{student.course}</TableCell>

              {/* Year */}
              <TableCell>
                <Chip
                  label={student.academic_year}
                  size="small"
                  sx={
                    student.academic_year === "FY"
                      ? yearChipPrimarySx
                      : yearChipSecondarySx
                  }
                />
              </TableCell>

              {/* Visits */}
              <TableCell align="right">
                <Chip
                  label={`${student.visits}`}
                  size="small"
                  sx={(theme) => ({
                    background: isTop3
                      ? "#1a56db"
                      : theme.palette.mode === "dark" ? "rgba(99,102,241,0.18)" : "#e0e7ff",
                    color: isTop3
                      ? "#fff"
                      : theme.palette.mode === "dark" ? "#a5b4fc" : "#3730a3",
                    fontWeight: 700
                  })}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
</Paper>

          <Paper sx={sectionCardSx(theme)}>
            <Typography sx={sectionTitleSx}>Time spent today</Typography>
            <Typography sx={sectionSubSx}>
              Top students by total time spent in the library today.
            </Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {studentTimeToday.length === 0 ? (
                <Typography sx={{ color: "text.secondary" }}>
                  No student time data available for today.
                </Typography>
              ) : (
                studentTimeToday.slice(0, 6).map((item, index) => (
                  <Box key={`${item.roll_no}-${index}`} sx={rowInfoSx(theme)}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{item.visitor_name || item.roll_no || "Unknown"}</Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                        {item.roll_no || "-"}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: "#1a56db" }}>
                      {formatMinutes(item.minutes_spent || 0)}
                    </Typography>
                  </Box>
                ))
              )}
            </Stack>
          </Paper>
            </>
          )}

          {activeTab === "students" && (
            <>
          <Paper sx={sectionCardSx(theme)}>
            <Typography sx={sectionTitleSx}>Filters</Typography>
            <Typography sx={sectionSubSx}>
              Narrow the student list by academic year, course, status, or search text.
            </Typography>

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <Box sx={filterCardSx(theme)}>
                  <Typography sx={filterTitleSx}>Academic year</Typography>
                  <Typography sx={filterHelperSx}>Filter first-year and second-year students.</Typography>
                  <TextField
                    select
                    fullWidth
                    value={filters.academic_year}
                    onChange={(event) => updateFilter("academic_year", event.target.value)}
                    sx={filterFieldSx}
                  >
                    <MenuItem value="all">All academic years</MenuItem>
                    <MenuItem value="FY">FY</MenuItem>
                    <MenuItem value="SY">SY</MenuItem>
                  </TextField>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Box sx={filterCardSx(theme)}>
                  <Typography sx={filterTitleSx}>Course</Typography>
                  <Typography sx={filterHelperSx}>Limit the list to a specific programme.</Typography>
                  <TextField
                    select
                    fullWidth
                    value={filters.course}
                    onChange={(event) => updateFilter("course", event.target.value)}
                    sx={filterFieldSx}
                  >
                    <MenuItem value="all">All courses</MenuItem>
                    {courses.map((course) => (
                      <MenuItem key={course} value={course}>
                        {course}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Box sx={filterCardSx(theme)}>
                  <Typography sx={filterTitleSx}>Status</Typography>
                  <Typography sx={filterHelperSx}>Separate active records from inactive ones.</Typography>
                  <TextField
                    select
                    fullWidth
                    value={filters.status}
                    onChange={(event) => updateFilter("status", event.target.value)}
                    sx={filterFieldSx}
                  >
                    <MenuItem value="all">All statuses</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                </Box>
              </Grid>
              <Grid item xs={12} lg={3}>
                <Box sx={filterCardSx(theme)}>
                  <Typography sx={filterTitleSx}>Search by name or roll number</Typography>
                  <Typography sx={filterHelperSx}>Use partial text like Vaibhav or C25084.</Typography>
                  <TextField
                    fullWidth
                    value={filters.search}
                    onChange={(event) => updateFilter("search", event.target.value)}
                    placeholder="Search students"
                    sx={filterFieldSx}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={sectionCardSx(theme)}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={1.5}
              sx={{ mb: 1 }}
            >
              <Box>
                <Typography sx={sectionTitleSx}>Student list</Typography>
                <Typography sx={sectionSubSx}>
                  Showing {students.length} of {totalStudents} students.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button variant="outlined" sx={tinyButtonSx} onClick={toggleAllVisibleRows}>
                  {allRowsSelected ? "Clear selection" : "Select all"}
                </Button>
                <Button
                  variant="contained"
                  sx={tinySuccessButtonSx}
                  disabled={selectedStudents.length === 0}
                  onClick={openBulkPromoteDialog}
                >
                  Promote selected
                </Button>
              </Stack>
            </Stack>

            {loading && <LinearProgress sx={{ mb: 2, borderRadius: 999 }} />}
            {tableError && <Alert severity="error" sx={{ mb: 2 }}>{tableError}</Alert>}

            <TableContainer
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                overflowX: "auto"
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 1180,
                  "& .MuiTableCell-head": {
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    letterSpacing: "0.04em"
                  },
                  "& .MuiTableCell-body": {
                    fontSize: 13
                  }
                }}
              >
                <TableHead>
                  <TableRow sx={{ background: theme.palette.mode === "dark" ? "#172033" : "#f6f8fc" }}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={allRowsSelected} onChange={toggleAllVisibleRows} />
                    </TableCell>
                    <TableCell>Roll No</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Academic Year</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No students found for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}

                  {students.map((student) => {
                    const isActive = student.status === "active";

                    return (
                      <TableRow key={student.roll_no} hover sx={{ transition: "background-color 0.2s ease, transform 0.2s ease", "&:hover": { transform: "scale(1.002)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", zIndex: 1, position: "relative" } }}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedRollNos.includes(student.roll_no)}
                            onChange={() => toggleStudentSelection(student.roll_no)}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: '"Consolas", "Courier New", monospace',
                            whiteSpace: "nowrap"
                          }}
                        >
                          {student.roll_no}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 220 }}>{student.name}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{student.course}</TableCell>
                        <TableCell>
                          <Chip
                            label={student.academic_year}
                            size="small"
                            sx={student.academic_year === "FY" ? yearChipPrimarySx : yearChipSecondarySx}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isActive ? "Active" : "Inactive"}
                            size="small"
                            sx={isActive ? statusChipActiveSx : statusChipInactiveSx}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 220 }}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {isActive ? (
                              <>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  sx={rowDangerButtonSx}
                                  onClick={() => setDeactivateTarget(student)}
                                >
                                  Deactivate
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  sx={rowPromoteButtonSx}
                                  onClick={() => openSinglePromoteDialog(student)}
                                >
                                  Promote
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outlined"
                                size="small"
                                sx={rowDangerButtonSx}
                                onClick={() => setDeleteTarget(student)}
                              >
                                Delete
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              flexWrap="wrap"
              spacing={0.5}
              sx={{ mt: 2, overflow: "hidden" }}
            >
              <Button
                variant="outlined"
                sx={paginationButtonSx}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Prev
              </Button>
              {paginationItems.map((item, index) =>
                item === "..." ? (
                  <Box
                    key={`ellipsis-${index}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 0.75,
                      color: "text.secondary",
                      fontSize: 15,
                      userSelect: "none",
                      letterSpacing: 1
                    }}
                  >
                    …
                  </Box>
                ) : (
                  <Button
                    key={item}
                    variant={item === currentPage ? "contained" : "outlined"}
                    sx={item === currentPage ? activePaginationButtonSx : paginationButtonSx}
                    onClick={() => setCurrentPage(item)}
                  >
                    {item}
                  </Button>
                )
              )}
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
            </>
          )}

          {activeTab === "upload" && (
          <Paper sx={sectionCardSx(theme)} ref={uploadSectionRef}>
            <Typography sx={sectionTitleSx}>Upload students</Typography>
            <Typography sx={sectionSubSx}>
              Upload a CSV or XLSX file, preview validation results, then confirm the valid rows.
            </Typography>

            <Tabs
              value={uploadTab}
              onChange={(_, value) => setUploadTab(value)}
              sx={{ mb: 2 }}
            >
              <Tab label="Upload file" value="upload" />
              <Tab label="Preview & confirm" value="preview" disabled={!uploadPreview} />
            </Tabs>

            {uploadTab === "upload" && (
              <Stack spacing={2}>
                <Box sx={uploadZoneSx(theme)}>
                  <FileUploadOutlined sx={{ fontSize: 32, color: "#1a56db" }} />
                  <Typography sx={{ fontWeight: 600, mt: 1 }}>
                    Click to choose file or drag and drop
                  </Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
                    Accepted formats: .csv and .xlsx
                  </Typography>
                  <Box sx={{ mt: 2, width: "100%" }}>
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={(event) => handleFileSelect(event.target.files?.[0] || null)}
                      style={{ width: "100%" }}
                    />
                  </Box>
                </Box>

                {activeFileCard && (
                  <Box sx={fileCardSx(theme)}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={fileIconWrapSx(theme)}>
                        {activeFileCard.name.toLowerCase().endsWith(".csv") ? (
                          <TableChartOutlined sx={{ color: "#0f766e" }} />
                        ) : (
                          <DescriptionOutlined sx={{ color: "#1a56db" }} />
                        )}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={fileNameSx} noWrap>
                          {activeFileCard.name}
                        </Typography>
                        <Typography sx={fileMetaSx}>
                          {formatFileSize(activeFileCard.size)} · {activeFileCard.status}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}

                {lastUploadSummary && (
                  <Box sx={uploadedFileCardSx(theme)}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={uploadedIconWrapSx(theme)}>
                          <CheckCircleOutline sx={(t) => ({ color: t.palette.mode === "dark" ? "#4ade80" : "#166534" })} />
                        </Box>
                        <Box>
                          <Typography sx={fileNameSx}>{lastUploadSummary.fileName}</Typography>
                          <Typography sx={fileMetaSx}>
                            {formatFileSize(lastUploadSummary.fileSize)} · Uploaded successfully
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip label={`${lastUploadSummary.inserted} inserted`} sx={successPillSx} />
                        <Chip label={`${lastUploadSummary.skipped} skipped`} sx={neutralPillSx} />
                      </Stack>
                    </Stack>
                  </Box>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <Button
                    component="a"
                    href="/student-upload-template.csv"
                    download
                    variant="outlined"
                    sx={secondaryActionButtonSx}
                  >
                    Download Template
                  </Button>
                  <Button
                    variant="contained"
                    sx={primaryActionButtonSx}
                    onClick={requestUploadPreview}
                    disabled={uploadLoading}
                  >
                    Preview Upload
                  </Button>
                </Stack>
              </Stack>
            )}

            {uploadTab === "preview" && uploadPreview && (
              <Stack spacing={2}>
                {activeFileCard && (
                  <Box sx={fileCardSx(theme)}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={fileIconWrapSx(theme)}>
                        {activeFileCard.name.toLowerCase().endsWith(".csv") ? (
                          <TableChartOutlined sx={{ color: "#0f766e" }} />
                        ) : (
                          <DescriptionOutlined sx={{ color: "#1a56db" }} />
                        )}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={fileNameSx} noWrap>
                          {activeFileCard.name}
                        </Typography>
                        <Typography sx={fileMetaSx}>
                          {formatFileSize(activeFileCard.size)} · {activeFileCard.status}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}

                <Alert severity={uploadPreview.invalidRows > 0 ? "warning" : "success"}>
                  {uploadPreview.invalidRows > 0
                    ? `${uploadPreview.invalidRows} row(s) have errors. Valid rows can still be uploaded.`
                    : "All rows are valid and ready to upload."}
                </Alert>

                <TableContainer
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    maxHeight: 320
                  }}
                >
                  <Table
                    stickyHeader
                    size="small"
                    sx={{
                      minWidth: 900,
                      "& .MuiTableCell-head": {
                        whiteSpace: "nowrap",
                        fontSize: 12
                      }
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Roll No</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Course</TableCell>
                        <TableCell>Admission Year</TableCell>
                        <TableCell>Result</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {uploadPreview.rows.map((row) => (
                        <TableRow
                          key={`${row.row_number}-${row.roll_no}`}
                          sx={
                            row.is_valid
                              ? undefined
                              : {
                                  background:
                                    theme.palette.mode === "dark" ? "rgba(127, 29, 29, 0.16)" : "#fef2f2"
                                }
                          }
                        >
                          <TableCell>{row.row_number}</TableCell>
                          <TableCell>{row.roll_no || "-"}</TableCell>
                          <TableCell>{row.name || "-"}</TableCell>
                          <TableCell>{row.course || "-"}</TableCell>
                          <TableCell>{row.admission_year || "-"}</TableCell>
                          <TableCell>
                            {row.is_valid ? (
                              <Chip label="OK" size="small" sx={statusChipActiveSx} />
                            ) : (
                              <Chip
                                label={row.errors.join(", ")}
                                size="small"
                                sx={uploadErrorChipSx}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <Button
                    variant="contained"
                    sx={primaryActionButtonSx}
                    onClick={confirmUpload}
                    disabled={uploadLoading || uploadPreview.validRows === 0}
                  >
                    Upload Valid Rows ({uploadPreview.validRows})
                  </Button>
                  <Button
                    variant="outlined"
                    sx={secondaryActionButtonSx}
                    onClick={() => setUploadTab("upload")}
                  >
                    Re-upload File
                  </Button>
                </Stack>
              </Stack>
            )}
          </Paper>
          )}

          {activeTab === "danger" && (
          <Paper sx={dangerZoneSx(theme)}>
            <Stack spacing={1.5}>
              <Typography sx={{ color: "#b91c1c", fontWeight: 700 }}>
                Danger zone — Clean up inactive students
              </Typography>
              <Typography sx={{ color: "#b91c1c", fontSize: 13, lineHeight: 1.7 }}>
                Securely bulk delete visit logs or complete student records for all currently inactive students. This helps maintain system performance and data privacy.
              </Typography>
              <Alert severity="error" icon={<WarningAmber fontSize="inherit" />}>
                This action is irreversible. It affects all students currently marked inactive.
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <Button
                  variant="outlined"
                  startIcon={<DeleteOutline />}
                  sx={dangerActionButtonSx}
                  onClick={() => setCleanupDialogOpen(true)}
                >
                  Clean up inactive students
                </Button>
                <Typography sx={{ color: "#b91c1c", fontSize: 12, alignSelf: "center" }}>
                  {stats.inactive} inactive students currently in the system
                </Typography>
              </Stack>
            </Stack>
          </Paper>
          )}
          </Box>
        </Stack>
      </Container>

      <Dialog open={addDialogOpen} onClose={() => !addSubmitting && setAddDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add student</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Roll number"
              value={addForm.roll_no}
              onChange={(event) => setAddForm((prev) => ({ ...prev, roll_no: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Full name"
              value={addForm.name}
              onChange={(event) => setAddForm((prev) => ({ ...prev, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Course"
              value={addForm.course}
              onChange={(event) => setAddForm((prev) => ({ ...prev, course: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Admission year"
              type="number"
              value={addForm.admission_year}
              onChange={(event) =>
                setAddForm((prev) => ({ ...prev, admission_year: event.target.value }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              resetAddForm();
            }}
            disabled={addSubmitting}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddStudent} disabled={addSubmitting}>
            Add student
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={promoteDialogOpen} onClose={() => !promoteSubmitting && setPromoteDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Promote students</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">
              Only active students are promoted. FY becomes SY, and SY becomes inactive.
            </Alert>
            <Typography sx={{ color: "text.secondary" }}>
              Target group: <strong>{promoteContext.label}</strong>
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Paper sx={promoteStatSx(theme)}>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1a56db" }}>
                    {promoteContext.fyCount}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    FY students moving to SY
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={promoteStatSx(theme)}>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#0f766e" }}>
                    {promoteContext.syCount}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    SY students moving to inactive
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPromoteDialogOpen(false)} disabled={promoteSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handlePromoteStudents}
            disabled={promoteSubmitting || promoteContext.fyCount + promoteContext.syCount === 0}
          >
            Confirm promotion
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deactivateTarget)} onClose={() => !actionSubmitting && setDeactivateTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Deactivate student</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
            Deactivating <strong>{deactivateTarget?.name}</strong> will prevent new library
            entries. Existing visit logs will remain untouched.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeactivateTarget(null)} disabled={actionSubmitting}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeactivateStudent} disabled={actionSubmitting}>
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !actionSubmitting && setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete student</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
              Delete <strong>{deleteTarget?.name}</strong> from the student master list.
            </Typography>
            <Alert severity="info">
              Student deletion will not remove past visit logs. Historical logs stay in the
              system.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={actionSubmitting}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteStudent} disabled={actionSubmitting}>
            Delete student
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cleanupDialogOpen} onClose={() => !cleanupSubmitting && setCleanupDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Clean up inactive students</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="error">
              This action is irreversible. Please select what you want to delete.
            </Alert>
            
            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Checkbox 
                    checked={cleanupLogs} 
                    onChange={(e) => setCleanupLogs(e.target.checked)} 
                    disabled={cleanupSubmitting}
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>Delete visit logs</Typography>
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>Removes all historical library visit records for inactive students.</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Checkbox 
                    checked={cleanupStudents} 
                    onChange={(e) => setCleanupStudents(e.target.checked)} 
                    disabled={cleanupSubmitting}
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>Delete student records</Typography>
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>Permanently removes inactive students from the system.</Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>

            <TextField
              label="Type DELETE to confirm"
              value={cleanupConfirmText}
              onChange={(event) => setCleanupConfirmText(event.target.value)}
              fullWidth
              placeholder="DELETE"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCleanupDialogOpen(false)} disabled={cleanupSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCleanupInactive}
            disabled={cleanupSubmitting || cleanupConfirmText !== "DELETE" || (!cleanupLogs && !cleanupStudents)}
          >
            Permanently delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const headerCardSx = (theme) => ({
  px: { xs: 2, md: 4 },
  py: { xs: 2.5, md: 3.5 },
  borderRadius: 0,
  border: 0,
  borderBottom: "1px solid",
  borderColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.16)" : "rgba(229, 231, 235, 0.5)",
  background: theme.palette.mode === "dark" ? "rgba(21, 25, 35, 0.7)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(12px)",
  boxShadow: "none"
});

const actionBarSx = (theme) => ({
  display: "flex",
  gap: 1.25,
  flexWrap: "wrap",
  px: { xs: 2, md: 4 },
  py: 1.75,
  background: theme.palette.mode === "dark" ? "rgba(21, 25, 35, 0.7)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid",
  borderColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.16)" : "rgba(229, 231, 235, 0.5)",
  position: "sticky",
  top: 0,
  zIndex: 10
});

const tabNavSx = (theme) => ({
  display: "flex",
  gap: 0.5,
  flexWrap: "wrap",
  px: { xs: 2, md: 4 },
  pt: 2,
  background: theme.palette.mode === "dark" ? "rgba(21, 25, 35, 0.7)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid",
  borderColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.16)" : "rgba(229, 231, 235, 0.5)"
});

const tabButtonSx = (theme, isActive, isDanger) => ({
  alignItems: "center",
  borderRadius: "8px 8px 0 0",
  px: 2.25,
  py: 1,
  minHeight: 40,
  textTransform: "none",
  fontSize: 13.5,
  fontWeight: isActive ? 700 : 500,
  color: isDanger
    ? isActive
      ? "#dc2626"
      : "#ef4444"
    : isActive
      ? "#1d4ed8"
      : "text.secondary",
  background: isActive
    ? isDanger
      ? theme.palette.mode === "dark"
        ? "rgba(127, 29, 29, 0.32)"
        : "#fef2f2"
      : theme.palette.mode === "dark"
        ? "rgba(37, 99, 235, 0.18)"
        : "#eff6ff"
    : "transparent",
  borderBottom: isActive ? `2px solid ${isDanger ? "#ef4444" : "#2563eb"}` : "2px solid transparent",
  "&:hover": {
    background: isDanger
      ? theme.palette.mode === "dark"
        ? "rgba(127, 29, 29, 0.24)"
        : "#fef2f2"
      : theme.palette.mode === "dark"
        ? "rgba(37, 99, 235, 0.14)"
        : "#eff6ff"
  }
});

const panelSx = {
  px: { xs: 2, md: 4 },
  py: 3,
  display: "flex",
  flexDirection: "column",
  gap: 2.5
};

const statsGridSx = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16
};

const statCardSx = (theme, accent) => ({
  p: "20px 22px",
  minHeight: 144,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  borderRadius: 3.5,
  border: 0,
  background: theme.palette.mode === "dark" ? "linear-gradient(145deg, #1a1e2b 0%, #151923 100%)" : "linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)",
  borderTop: `3px solid ${accent}`,
  boxShadow: theme.palette.mode === "dark" ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.05)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  position: "relative",
  overflow: "hidden",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.palette.mode === "dark" ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.1)",
  }
});

const statAccentSx = (accent) => ({
  position: "absolute",
  bottom: -20,
  right: -20,
  width: 100,
  height: 100,
  borderRadius: "50%",
  background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
  zIndex: 0
});

const statLabelSx = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "text.secondary"
};

const statValueSx = (accent) => ({
  mt: 1,
  fontSize: 36,
  lineHeight: 1,
  fontWeight: 800,
  background: `linear-gradient(90deg, ${accent} 0%, ${accent}aa 100%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  zIndex: 1
});

const statDescriptionSx = {
  mt: 1.4,
  fontSize: 12,
  lineHeight: 1.55,
  color: "text.secondary"
};

const sectionCardSx = (theme) => ({
  p: { xs: 2.5, md: 3 },
  borderRadius: 3.5,
  border: "1px solid",
  borderColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.08)" : "rgba(229, 231, 235, 0.6)",
  background: theme.palette.mode === "dark" ? "rgba(21, 25, 35, 0.6)" : "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(10px)",
  boxShadow: theme.palette.mode === "dark" ? "0 4px 16px rgba(0,0,0,0.2)" : "0 4px 16px rgba(0,0,0,0.04)"
});

const dangerZoneSx = (theme) => ({
  p: { xs: 2.75, md: 3.5 },
  borderRadius: 3.5,
  border: "1.5px solid",
  borderColor: theme.palette.mode === "dark" ? "rgba(248, 113, 113, 0.4)" : "#fca5a5",
  background: theme.palette.mode === "dark" ? "#151923" : "#ffffff",
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 2px 12px rgba(0,0,0,0.22)"
      : "0 2px 12px rgba(239,68,68,0.07)"
});

const headerLabelSx = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "text.secondary"
};

const headerTitleSx = {
  mt: 0.5,
  fontWeight: 700,
  fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  letterSpacing: 0
};

const headerBodySx = {
  mt: 0.75,
  color: "text.secondary",
  lineHeight: 1.7,
  maxWidth: 860
};

const sectionTitleSx = {
  fontSize: 16,
  fontWeight: 700,
  color: "text.primary"
};

const sectionSubSx = {
  mt: 0.5,
  fontSize: 13,
  color: "text.secondary",
  lineHeight: 1.6
};

const filterFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    background: "background.paper"
  },
  "& .MuiInputBase-input": {
    py: 1.3
  }
};

const filterCardSx = (theme) => ({
  p: 2,
  height: "100%",
  borderRadius: 2.5,
  border: "1px solid",
  borderColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.16)" : "#eef2f7",
  background: theme.palette.mode === "dark" ? "#181d29" : "#fbfdff"
});

const filterTitleSx = {
  fontSize: 13,
  fontWeight: 700,
  color: "text.primary"
};

const filterHelperSx = {
  mt: 0.5,
  mb: 1.25,
  fontSize: 12,
  color: "text.secondary",
  lineHeight: 1.55,
  minHeight: 36
};

const uploadZoneSx = (theme) => ({
  border: "2px dashed",
  borderColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.28)" : "#d1d5db",
  borderRadius: 3,
  textAlign: "center",
  p: { xs: 3.5, md: 6.5 },
  position: "relative"
});

const fileCardSx = (theme) => ({
  p: 2,
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  background:
    theme.palette.mode === "dark"
      ? "linear-gradient(180deg, #172236 0%, #1b2940 100%)"
      : "linear-gradient(180deg, #fcfdff 0%, #f6fafe 100%)"
});

const uploadedFileCardSx = (theme) => ({
  p: 2,
  borderRadius: 3,
  border: "1px solid",
  borderColor: theme.palette.mode === "dark" ? "rgba(74, 222, 128, 0.25)" : "#bbf7d0",
  background: theme.palette.mode === "dark" ? "rgba(22, 101, 52, 0.18)" : "#f0fdf4"
});

const fileIconWrapSx = (theme) => ({
  width: 44,
  height: 44,
  display: "grid",
  placeItems: "center",
  borderRadius: 2.5,
  background: theme.palette.mode === "dark" ? "#0f172a" : "#ffffff",
  border: "1px solid",
  borderColor: "divider",
  flexShrink: 0
});

const uploadedIconWrapSx = (theme) => ({
  width: 44,
  height: 44,
  display: "grid",
  placeItems: "center",
  borderRadius: 2.5,
  background: theme.palette.mode === "dark" ? "rgba(34,197,94,0.15)" : "#dcfce7",
  border: "1px solid",
  borderColor: theme.palette.mode === "dark" ? "rgba(74,222,128,0.3)" : "#86efac",
  flexShrink: 0
});

const rowInfoSx = (theme) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  p: 1.5,
  borderRadius: 3,
  background: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.08)" : "#f8fafc"
});

const fileNameSx = {
  fontSize: 14,
  fontWeight: 700,
  color: "text.primary"
};

const fileMetaSx = {
  mt: 0.25,
  fontSize: 12,
  color: "text.secondary"
};

const promoteStatSx = (theme) => ({
  p: 2,
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  background: theme.palette.mode === "dark" ? "#162133" : "#f8fbff"
});

const primaryActionButtonSx = {
  borderRadius: 2,
  px: 2,
  py: 1,
  fontWeight: 700,
  fontSize: 13,
  textTransform: "none",
  background: "#2563eb",
  boxShadow: "none",
  "&:hover": {
    background: "#1d4ed8",
    boxShadow: "none"
  }
};

const successActionButtonSx = {
  borderRadius: 2,
  px: 2,
  py: 1,
  fontWeight: 700,
  fontSize: 13,
  textTransform: "none",
  background: "#0d9488",
  boxShadow: "none",
  "&:hover": {
    background: "#0f766e",
    boxShadow: "none"
  }
};

const secondaryActionButtonSx = {
  borderRadius: 2,
  px: 2,
  py: 1,
  fontWeight: 700,
  fontSize: 13,
  textTransform: "none",
  color: "text.primary",
  borderColor: "#d1d5db",
  background: "background.paper",
  "&:hover": {
    borderColor: "#9ca3af",
    background: "action.hover"
  }
};

const backActionButtonSx = (theme) => ({
  borderRadius: 2,
  px: 2,
  py: 1,
  fontWeight: 700,
  fontSize: 13,
  textTransform: "none",
  color: "text.primary",
  borderColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.22)" : "#d1d5db",
  background: theme.palette.mode === "dark" ? "transparent" : "#ffffff",
  "&:hover": {
    borderColor: "#9ca3af",
    background: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.08)" : "#f9fafb"
  }
});

const dangerActionButtonSx = {
  borderRadius: 2,
  px: 2,
  py: 1,
  fontWeight: 700,
  fontSize: 13,
  textTransform: "none",
  color: (theme) => theme.palette.mode === "dark" ? "#f87171" : "#dc2626",
  borderColor: "transparent",
  background: (theme) => theme.palette.mode === "dark" ? "rgba(239,68,68,0.15)" : "#fee2e2",
  "&:hover": {
    borderColor: "transparent",
    background: (theme) => theme.palette.mode === "dark" ? "rgba(239,68,68,0.25)" : "#fecaca"
  }
};

const tinyButtonSx = {
  borderRadius: 2,
  fontWeight: 700,
  textTransform: "none"
};

const tinySuccessButtonSx = {
  borderRadius: 2,
  fontWeight: 700,
  textTransform: "none",
  background: "#0d9488",
  "&:hover": {
    background: "#0f766e"
  }
};

const rowDangerButtonSx = {
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 700,
  color: (theme) => theme.palette.mode === "dark" ? "#f87171" : "#dc2626",
  borderColor: "transparent",
  background: (theme) => theme.palette.mode === "dark" ? "rgba(239,68,68,0.15)" : "#fee2e2",
  "&:hover": {
    borderColor: "transparent",
    background: (theme) => theme.palette.mode === "dark" ? "rgba(239,68,68,0.25)" : "#fecaca"
  }
};

const rowPromoteButtonSx = {
  borderRadius: 2,
  fontWeight: 700,
  textTransform: "none",
  background: "#0d9488",
  "&:hover": {
    background: "#0f766e"
  }
};

const statusChipActiveSx = (theme) => ({
  background: theme.palette.mode === "dark" ? "rgba(34,197,94,0.15)" : "#dcfce7",
  color: theme.palette.mode === "dark" ? "#4ade80" : "#166534",
  fontWeight: 700
});

const statusChipInactiveSx = (theme) => ({
  background: theme.palette.mode === "dark" ? "rgba(148,163,184,0.12)" : "#f3f4f6",
  color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
  fontWeight: 700
});

const yearChipPrimarySx = (theme) => ({
  background: theme.palette.mode === "dark" ? "rgba(99,102,241,0.15)" : "#e0e7ff",
  color: theme.palette.mode === "dark" ? "#a5b4fc" : "#3730a3",
  fontWeight: 700
});

const yearChipSecondarySx = (theme) => ({
  background: theme.palette.mode === "dark" ? "rgba(245,158,11,0.15)" : "#fef3c7",
  color: theme.palette.mode === "dark" ? "#fbbf24" : "#92400e",
  fontWeight: 700
});

const uploadErrorChipSx = (theme) => ({
  background: theme.palette.mode === "dark" ? "rgba(239,68,68,0.15)" : "#fee2e2",
  color: theme.palette.mode === "dark" ? "#f87171" : "#b91c1c",
  height: "auto",
  "& .MuiChip-label": {
    display: "block",
    whiteSpace: "normal",
    paddingTop: 4,
    paddingBottom: 4
  }
});

const successPillSx = (theme) => ({
  background: theme.palette.mode === "dark" ? "rgba(34,197,94,0.15)" : "#dcfce7",
  color: theme.palette.mode === "dark" ? "#4ade80" : "#166534",
  fontWeight: 700
});

const neutralPillSx = (theme) => ({
  background: theme.palette.mode === "dark" ? "rgba(99,102,241,0.15)" : "#eff6ff",
  color: theme.palette.mode === "dark" ? "#a5b4fc" : "#1d4ed8",
  fontWeight: 700
});

const paginationButtonSx = {
  minWidth: 42,
  borderRadius: 2
};

const activePaginationButtonSx = {
  minWidth: 42,
  borderRadius: 2,
  background: "#1a56db",
  "&:hover": {
    background: "#1648c0"
  }
};

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

function formatFileSize(size) {
  if (!size) return "0 KB";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}
