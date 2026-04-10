const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const studentRoutes = require("./routes/studentRoutes");
const staffRoutes = require("./routes/staffRoutes");
const guestRoutes = require("./routes/guestRoutes");
const adminStudentRoutes = require("./routes/adminStudentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const visitRoutes = require("./routes/visitRoutes");
const { startAutoExitJob } = require("./jobs/autoExitJob");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/student", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api/admin", adminStudentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/visit", visitRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
  startAutoExitJob();
});
