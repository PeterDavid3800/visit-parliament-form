require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");

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
       Admin Notification Email
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
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #0b6b3a;border-radius:6px;overflow:hidden;">
              <tr>
                <td style="background:#0b6b3a;color:#ffffff;text-align:center;padding:20px;font-size:22px;font-weight:bold;">
                  New Visit Request
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="border:1px solid #ddd;font-weight:bold;">Institution</td>
                      <td style="border:1px solid #ddd;">${institution}</td>
                    </tr>
                    <tr>
                      <td style="border:1px solid #ddd;font-weight:bold;">Name</td>
                      <td style="border:1px solid #ddd;">${name}</td>
                    </tr>
                    <tr>
                      <td style="border:1px solid #ddd;font-weight:bold;">Reason</td>
                      <td style="border:1px solid #ddd;">${reason}</td>
                    </tr>
                    <tr>
                      <td style="border:1px solid #ddd;font-weight:bold;">Visit Date</td>
                      <td style="border:1px solid #ddd;">${date}</td>
                    </tr>
                    <tr>
                      <td style="border:1px solid #ddd;font-weight:bold;">Visitors</td>
                      <td style="border:1px solid #ddd;">${visitors}</td>
                    </tr>
                    <tr>
                      <td style="border:1px solid #ddd;font-weight:bold;">Email</td>
                      <td style="border:1px solid #ddd;">${email}</td>
                    </tr>
                    <tr>
                      <td style="border:1px solid #ddd;font-weight:bold;">Phone</td>
                      <td style="border:1px solid #ddd;">${phone}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background:#f4f4f4;text-align:center;padding:12px;font-size:12px;color:#666;">
                  Automated message from the Visit Request System
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      `
    };

    /* -----------------------------
       Visitor Confirmation Email
    ----------------------------- */
    const visitorMail = {
      from: `"Visit Request System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Visit Request Received",
      html: `
      <div style="font-family:Arial;padding:20px;">
        <h2 style="color:#0b6b3a;">Visit Request Received</h2>
        <p>Hello ${name},</p>
        <p>
        Thank you for submitting a visit request to our organization.
        Your request has been received and our team will review it shortly.
        </p>
        <p><strong>Visit Date:</strong> ${date}</p>
        <p><strong>Institution:</strong> ${institution}</p>
        <p>
        We will contact you if further information is required.
        </p>
        <br>
        <p style="color:#777;font-size:12px;">
        This is an automated confirmation email.
        </p>
      </div>
      `
    };

    await transporter.sendMail(adminMail);
    await transporter.sendMail(visitorMail);

    res.status(200).json({ success: true, message: "Emails sent successfully" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

/* -----------------------------
   Serve React Build
----------------------------- */

const buildPath = path.join(__dirname, "../frontend/build");

app.use(express.static(buildPath));


/* -----------------------------
   React Catch-All Route
----------------------------- */
// This avoids the "* path" error and preserves API routes
app.get(/^\/(?!send-email).*$/, (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

/* -----------------------------
   Start Server
----------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});