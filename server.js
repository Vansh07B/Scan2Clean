// 🌿 Campus Clean Reporting System
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const Report = require("./models/Report");

const app = express();

// 🔧 Middleware Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// 🔐 Session Setup
app.use(
  session({
    secret: "scan2clean_secret_key", // change this
    resave: false,
    saveUninitialized: false,
  })
);

// ⚙️ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err.message));

// 🖼️ Multer Setup (Image Uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/images"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// 🔑 Admin Credentials (Hardcoded)
const ADMIN = { username: "admin", password: "Scan2Clean" };

// Middleware to protect admin routes
function adminAuth(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  // Redirect to login page if not logged in
  return res.redirect("/admin/login");
}

// 🏠 ROUTES ------------------------------------------------

// 🏡 Home Page
app.get("/", (req, res) => {
  res.render("index");
});

// 🧾 Report Form Page
app.get("/report", (req, res) => {
  res.render("reportForm");
});

// 🛡 Admin Login Page
app.get("/admin/login", (req, res) => {
  if (req.session.admin) return res.redirect("/admin");
  res.render("adminLogin", { error: null });
});

// 🛡 Handle Admin Login
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    req.session.admin = true;
    return res.redirect("/admin");
  } else {
    return res.render("adminLogin", { error: "Invalid username or password" });
  }
});

// 🔓 Admin Logout
app.get("/admin/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

// 🧹 Admin Dashboard
app.get("/admin", adminAuth, async (req, res) => {
  try {
    const filter = req.query.filter || "all";
    let reports;

    if (filter === "resolved") {
      reports = await Report.find({ resolved: true }).sort({ createdAt: -1 });
    } else if (filter === "unresolved") {
      reports = await Report.find({ resolved: false }).sort({ createdAt: -1 });
    } else {
      reports = await Report.find().sort({ createdAt: -1 });
    }

    res.render("admin", { reports, filter });
  } catch (error) {
    console.error("❌ Error fetching reports:", error);
    res.status(500).send("Error fetching reports.");
  }
});

// 📨 Submit Report
app.post("/submit", upload.single("image"), async (req, res) => {
  try {
    const { location, date, time, description } = req.body;
    const image = req.file ? req.file.filename : "";

    const newReport = new Report({
      location,
      date,
      time,
      description,
      image,
      resolved: false, // Default: unresolved
    });

    await newReport.save();
    res.json({ success: true, message: "Report submitted successfully!" });
  } catch (error) {
    console.error("❌ Error submitting report:", error);
    res.status(500).json({ success: false, message: "Failed to submit the report." });
  }
});

// ✅ Mark Report as Resolved
app.post("/resolve/:id", adminAuth, async (req, res) => {
  try {
    await Report.findByIdAndUpdate(req.params.id, { resolved: true });
    console.log(`🟢 Report ${req.params.id} marked as resolved.`);
    res.redirect("/admin");
  } catch (error) {
    console.error("❌ Error marking as resolved:", error);
    res.status(500).send("Failed to update report.");
  }
});

// 🗑️ Delete Report
app.post("/delete/:id", adminAuth, async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    console.log(`🗑️ Report ${req.params.id} deleted.`);
    res.redirect("/admin");
  } catch (error) {
    console.error("❌ Error deleting report:", error);
    res.status(500).send("Failed to delete report.");
  }
});

// ❌ 404 Page
app.use((req, res) => {
  res.status(404).send(`
    <h2 style="font-family:sans-serif;color:red;">404 - Page Not Found</h2>
    <a href="/" style="font-family:sans-serif;text-decoration:none;">🏠 Go to Home</a>
  `);
});

// 🚀 Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
