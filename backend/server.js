require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
const pool = require("./db");

const app = express();

/* Middleware */

app.use(cors());
app.use(express.json());

/* Email Transporter */

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

/* API ROUTE */

app.post("/send-email", async (req, res) => {

  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body"
    });
  }

  const { institution, name, reason, date, visitors, email, phone } = req.body;

  if (!institution || !name || !reason || !date || !visitors || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  try {

    await pool.query(
      `INSERT INTO bookings
      (institution, name, reason, visit_date, visitors, email, phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [institution, name, reason, date, visitors, email, phone]
    );

    const adminMail = {
      from: `"Visit Request System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: "📩 New Visit Request",
      html: `
      <h2>New Visit Request</h2>
      <p><b>Institution:</b> ${institution}</p>
      <p><b>Name:</b> ${name}</p>
      <p><b>Reason:</b> ${reason}</p>
      <p><b>Date:</b> ${date}</p>
      <p><b>Visitors:</b> ${visitors}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone}</p>
      `
    };

    const visitorMail = {
      from: `"Visit Request System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Visit Request Received",
      html: `
      <h2>Visit Request Received</h2>
      <p>Hello ${name},</p>
      <p>Your visit request has been received.</p>
      <p><b>Visit Date:</b> ${date}</p>
      <p><b>Institution:</b> ${institution}</p>
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

/* Serve React */

const buildPath = path.join(__dirname, "../frontend/build");

app.use(express.static(buildPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

/* Global Error Handler */

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

/* Start Server */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});