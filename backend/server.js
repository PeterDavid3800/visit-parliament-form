require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
const pool = require("./db"); // PostgreSQL connection

const app = express();

/* -----------------------------
   Middleware
----------------------------- */
app.use(cors());
app.use(express.json());

/* -----------------------------
   Email Transporter
----------------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error) => {
  if (error) console.error("Email server error:", error);
  else console.log("Email server ready");
});

/* -----------------------------
   API ROUTES
----------------------------- */

app.post("/send-email", async (req, res) => {

  const { institution, name, reason, date, visitors, email, phone } = req.body;

  if (!institution || !name || !reason || !date || !visitors || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  try {

    /* -----------------------------
       SAVE BOOKING TO DATABASE
    ----------------------------- */

    await pool.query(
      `INSERT INTO bookings
      (institution, name, reason, visit_date, visitors, email, phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [institution, name, reason, date, visitors, email, phone]
    );

    /* -----------------------------
       ADMIN EMAIL
    ----------------------------- */

    const adminMail = {
      from: `"Visit Request System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: "📩 New Visit Request",
      html: `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:20px;font-family:Arial;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #0b6b3a;border-radius:6px;">
              <tr>
                <td style="background:#0b6b3a;color:#ffffff;text-align:center;padding:20px;font-size:22px;font-weight:bold;">
                  New Visit Request
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <table width="100%" cellpadding="10" cellspacing="0">
                    <tr><td><b>Institution</b></td><td>${institution}</td></tr>
                    <tr><td><b>Name</b></td><td>${name}</td></tr>
                    <tr><td><b>Reason</b></td><td>${reason}</td></tr>
                    <tr><td><b>Visit Date</b></td><td>${date}</td></tr>
                    <tr><td><b>Visitors</b></td><td>${visitors}</td></tr>
                    <tr><td><b>Email</b></td><td>${email}</td></tr>
                    <tr><td><b>Phone</b></td><td>${phone}</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      `
    };

    /* -----------------------------
       VISITOR CONFIRMATION EMAIL
    ----------------------------- */

    const visitorMail = {
      from: `"Visit Request System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Visit Request Received",
      html: `
      <div style="font-family:Arial;padding:20px;">
        <h2 style="color:#0b6b3a;">Visit Request Received</h2>
        <p>Hello ${name},</p>
        <p>Your visit request has been received.</p>
        <p><b>Visit Date:</b> ${date}</p>
        <p><b>Institution:</b> ${institution}</p>
        <p>Our team will review and contact you.</p>
      </div>
      `
    };

    await transporter.sendMail(adminMail);
    await transporter.sendMail(visitorMail);

    res.status(200).json({
      success: true,
      message: "Booking saved and emails sent"
    });

  } catch (error) {

    console.error("Server error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

/* -----------------------------
   Serve React Build
----------------------------- */

const buildPath = path.join(__dirname, "../frontend/build");

app.use(express.static(buildPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

/* -----------------------------
   Start Server
----------------------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});