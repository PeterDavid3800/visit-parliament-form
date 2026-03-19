require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db");
const axios = require("axios");
const { Resend } = require("resend");

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());

app.post("/send-email", async (req, res) => {
  const {
    institution,
    name,
    reason,
    date,
    visitors,
    email,
    phone,
    captchaToken
  } = req.body;

  if (!institution || !name || !reason || !date || !visitors || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  // ❌ CAPTCHA VALIDATION DISABLED
  /*
  if (!captchaToken) {
    return res.status(400).json({
      success: false,
      message: "Please verify you are not a robot"
    });
  }
  */

  try {

    // ❌ RECAPTCHA VERIFICATION DISABLED
    /*
    const verifyURL = "https://www.google.com/recaptcha/api/siteverify";

    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET_KEY);
    params.append("response", captchaToken);

    const captchaVerify = await axios.post(verifyURL, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    console.log("CAPTCHA RESPONSE:", captchaVerify.data);

    if (!captchaVerify.data.success) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification failed",
        errorCodes: captchaVerify.data["error-codes"]
      });
    }
    */

    await pool.query(
      `INSERT INTO bookings
      (institution, name, reason, visit_date, visitors, email, phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [institution, name, reason, date, visitors, email, phone]
    );

    const adminHTML = `
<table width="100%" style="background:#f2f2f2;padding:20px;font-family:Arial;">
  <tr>
    <td align="center">
      <table width="600" style="background:#fff;border:2px solid #0b6b3a;">
        <tr>
          <td style="background:#0b6b3a;color:#fff;padding:20px;text-align:center;font-size:22px;">
            📩 New Visit Request
          </td>
        </tr>
        <tr>
          <td style="padding:20px;">
            <p><b>Institution:</b> ${institution}</p>
            <p><b>Name:</b> ${name}</p>
            <p><b>Reason:</b> ${reason}</p>
            <p><b>Date:</b> ${date}</p>
            <p><b>Visitors:</b> ${visitors}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Phone:</b> ${phone}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

    const visitorHTML = `
    <div style="font-family:Arial;padding:20px;">
      <h2 style="color:#0b6b3a;">Visit Request Received</h2>
      <p>Hello ${name},</p>
      <p>Your visit request has been received.</p>
      <p><b>Visit Date:</b> ${date}</p>
      <p><b>Institution:</b> ${institution}</p>
      <p>We will contact you soon.</p>
    </div>
    `;

    await resend.emails.send({
      from: "Visit Parliament <noreply@visit-parliament-form.org>",
      to: process.env.RECEIVER_EMAIL,
      reply_to: email,
      subject: "📩 New Visit Request",
      html: adminHTML
    });

    await resend.emails.send({
      from: "Visit Parliament <noreply@visit-parliament-form.org>",
      to: email,
      subject: "Visit Request Received",
      html: visitorHTML
    });

    res.status(200).json({
      success: true,
      message: "Booking submitted successfully"
    });

  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

const buildPath = path.join(__dirname, "../frontend/build");

app.use(express.static(buildPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});