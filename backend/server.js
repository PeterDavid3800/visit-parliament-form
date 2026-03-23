require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db"); // your Postgres connection
const { Resend } = require("resend");
const multer = require("multer");

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

/* =========================
   GET AVAILABLE SLOTS
========================= */
app.get("/slots", async (req, res) => {
  const { date } = req.query;

  try {
    let result = await pool.query(
      `SELECT * FROM slots WHERE DATE(date) = $1 ORDER BY time ASC`,
      [date]
    );

    // AUTO-GENERATE if empty
    if (result.rows.length === 0) {
      const capacity = 5;
      const times = [
        "09:00","09:30","10:00","10:30","11:00","11:30",
        "12:00","12:30","14:30","15:00","15:30","16:00","16:30"
      ];

      for (let time of times) {
        await pool.query(
          `INSERT INTO slots (date, time, capacity, booked_count)
           VALUES ($1,$2,$3,0)
           ON CONFLICT DO NOTHING`,
          [date, time, capacity]
        );
      }

      // Fetch again
      result = await pool.query(
        `SELECT * FROM slots WHERE DATE(date) = $1 ORDER BY time ASC`,
        [date]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});

/* =========================
   CREATE BOOKING
========================= */
app.post("/send-email", upload.single("file"), async (req, res) => {
  try {
    const {
      institution,
      name,
      reason,
      date,
      visitors,
      email,
      phone,
      slot_id,
      institution_type,
      institution_status
    } = req.body;

    const visitorsCount = Number(visitors);

    // VALIDATION
    if (!institution || !name || !reason || !date || !visitorsCount || !email || !phone || !slot_id) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (visitorsCount > 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum 50 participants allowed",
      });
    }

    // VALIDATE SLOT
    const slotRes = await pool.query("SELECT * FROM slots WHERE id=$1", [slot_id]);
    if (slotRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid slot" });
    }

    const slot = slotRes.rows[0];
    if (slot.booked_count >= slot.capacity) {
      return res.status(400).json({ success: false, message: "Slot is full" });
    }

    const fileUrl = req.file ? req.file.path : null;

    // INSERT BOOKING
    await pool.query(
      `INSERT INTO bookings
       (institution, name, reason, visit_date, visitors, email, phone, slot_id, institution_type, institution_status, file_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        institution,
        name,
        reason,
        date,
        visitorsCount,
        email,
        phone,
        slot_id,
        institution_type || null,
        institution_status || null,
        fileUrl
      ]
    );

    // UPDATE SLOT COUNT
    await pool.query(
      "UPDATE slots SET booked_count = booked_count + 1 WHERE id=$1",
      [slot_id]
    );

    // SEND BEAUTIFUL EMAILS
    const VERIFIED_EMAIL = process.env.VERIFIED_EMAIL;

    if (process.env.RECEIVER_EMAIL && VERIFIED_EMAIL) {
      // ADMIN EMAIL
      const adminMail = {
        from: `Visit Request System <${VERIFIED_EMAIL}>`,
        to: process.env.RECEIVER_EMAIL,
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
                        <tr><td><b>Time Slot</b></td><td>${slot.time}</td></tr>
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

      // VISITOR EMAIL
      const visitorMail = {
        from: `Visit Request System <${VERIFIED_EMAIL}>`,
        to: email,
        subject: "Visit Request Received",
        html: `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:20px;font-family:Arial;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #0b6b3a;border-radius:6px;">
                  <tr>
                    <td style="background:#0b6b3a;color:#ffffff;text-align:center;padding:20px;font-size:22px;font-weight:bold;">
                      Visit Request Received
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px;">
                      <table width="100%" cellpadding="10" cellspacing="0">
                        <tr><td><b>Name</b></td><td>${name}</td></tr>
                        <tr><td><b>Institution</b></td><td>${institution}</td></tr>
                        <tr><td><b>Visit Date</b></td><td>${date}</td></tr>
                        <tr><td><b>Time Slot</b></td><td>${slot.time}</td></tr>
                        <tr><td colspan="2">Our team will review your request and contact you.</td></tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `
      };

      await resend.emails.send(adminMail);
      await resend.emails.send(visitorMail);
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =========================
   SERVE FRONTEND
========================= */
const buildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(buildPath));
app.get("*", (req, res) => res.sendFile(path.join(buildPath, "index.html")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));