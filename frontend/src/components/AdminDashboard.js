import { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Divider,
  Stack
} from "@mui/material";

export default function AdminDashboard({ setScreen }) {
  // ===== BASIC COUNTS =====
  const [data, setData] = useState({
    total: 0,
    students: 0,
    staff: 0,
    guests: 0
  });

  // ===== ANALYTICS STATES =====
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

  // ===== UPLOAD STATES =====
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/admin/dashboard")
      .then(res => setData(res.data));

    axios.get("http://localhost:5000/api/admin/leaderboard")
      .then(res => setLeaderboard(res.data));

    axios.get("http://localhost:5000/api/admin/footfall")
      .then(res => setFootfall(res.data));

    axios.get("http://localhost:5000/api/admin/monthly-footfall")
      .then(res => setMonthlyFootfall(res.data));

    axios.get("http://localhost:5000/api/admin/student-time-today")
      .then(res => setStudentTime(res.data));

    axios.get("http://localhost:5000/api/admin/total-time-today")
      .then(res => setTotalTime(res.data.total_minutes || 0));

    axios.get("http://localhost:5000/api/admin/peak-hour")
      .then(res => setPeakHour(res.data));
  }, []);

  // ===== HANDLE EXCEL UPLOAD =====
  const handleUpload = async () => {
    if (!file) {
      setUploadMsg("Please select an Excel file");
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

      setUploadMsg(
        `✅ ${res.data.inserted} students uploaded successfully`
      );
    } catch (err) {
      setUploadMsg("❌ Excel upload failed");
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Typography variant="h5" align="center" gutterBottom>
        📊 Admin Dashboard
      </Typography>

      {/* ===== SUMMARY CARDS ===== */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {["Total Entries", "Students", "Staff", "Guests"].map((title, i) => {
          const values = [data.total, data.students, data.staff, data.guests];
          return (
            <Grid item xs={12} md={3} key={i}>
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h6">{title}</Typography>
                <Typography variant="h4">{values[i]}</Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* ===== EXCEL UPLOAD ===== */}
      <Paper sx={{ p: 3, mt: 5 }}>
        <Typography variant="h6">📤 Upload Students (Excel)</Typography>
        <Divider sx={{ my: 1 }} />

        <Stack spacing={2}>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <Button variant="contained" onClick={handleUpload}>
            Upload Excel
          </Button>

          {uploadMsg && (
            <Typography color="primary">{uploadMsg}</Typography>
          )}
        </Stack>
      </Paper>

      {/* ===== TODAY FOOTFALL ===== */}
      <Paper sx={{ p: 3, mt: 5 }}>
        <Typography variant="h6">📈 Today’s Student Footfall</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography>Total Students: {footfall.total_students}</Typography>
        <Typography>Using Computer: {footfall.computer_users}</Typography>
        <Typography>Not Using Computer: {footfall.non_computer_users}</Typography>
      </Paper>

      {/* ===== PEAK HOUR ===== */}
      <Paper sx={{ p: 3, mt: 5 }}>
        <Typography variant="h6">⏰ Peak Hour</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography>
          {peakHour ? `${peakHour.hour}:00 hrs` : "No data available"}
        </Typography>
      </Paper>

      {/* ===== TOTAL TIME SPENT ===== */}
      <Paper sx={{ p: 3, mt: 5 }}>
        <Typography variant="h6">🕒 Total Time Spent Today</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography>{totalTime} minutes</Typography>
      </Paper>

      {/* ===== STUDENT TIME ===== */}
      <Paper sx={{ p: 3, mt: 5 }}>
        <Typography variant="h6">📚 Student Time Spent Today</Typography>
        <Divider sx={{ my: 1 }} />
        {studentTime.length === 0 && <Typography>No data</Typography>}
        {studentTime.map((s, i) => (
          <Typography key={i}>
            {i + 1}. {s.visitor_name} ({s.roll_no}) – {s.minutes_spent} minutes
          </Typography>
        ))}
      </Paper>

      {/* ===== LEADERBOARD ===== */}
      <Paper sx={{ p: 3, mt: 5 }}>
        <Typography variant="h6">🏆 Student Leaderboard</Typography>
        <Divider sx={{ my: 1 }} />
        {leaderboard.map((s, i) => (
          <Typography key={i}>
            {i + 1}. {s.visitor_name} ({s.roll_no}) – {s.visits} visits
          </Typography>
        ))}
      </Paper>

      {/* ===== LOGOUT ===== */}
      <Button
        variant="contained"
        color="error"
        sx={{ mt: 4 }}
        onClick={() => setScreen("home")}
      >
        Logout
      </Button>
    </Container>
  );
}
