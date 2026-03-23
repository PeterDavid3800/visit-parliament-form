require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db");
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
      "SELECT * FROM slots WHERE date=$1 ORDER BY time ASC",
      [date]
    );

    // 🔥 AUTO CREATE IF EMPTY
    if (result.rows.length === 0) {
      const type = "non-sitting"; // you can improve later
      const capacity = type === "sitting" ? 4 : 5;

      const times = [
        "09:00","09:30","10:00","10:30",
        "11:00","11:30","12:00","12:30",
        "14:30","15:00","15:30","16:00","16:30","17:00"
      ];

      for (let time of times) {
        await pool.query(
          `INSERT INTO slots (date, time, type, capacity)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT DO NOTHING`,
          [date, time, type, capacity]
        );
      }

      // fetch again
      result = await pool.query(
        "SELECT * FROM slots WHERE date=$1 ORDER BY time ASC",
        [date]
      );
    }

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});
app.get("/admin/bookings", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM bookings ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});
/* =========================
   CREATE BOOKING
========================= */
app.post("/send-email", upload.single("file"), async (req, res) => {
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

  const file = req.file;

  if (
    !institution || !name || !reason || !date ||
    !visitors || !email || !phone || !slot_id
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  try {
    /* =========================
       VALIDATE SLOT
    ========================= */
    const slotRes = await pool.query(
      "SELECT * FROM slots WHERE id=$1",
      [slot_id]
    );

    if (slotRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot"
      });
    }

    const slot = slotRes.rows[0];

    if (slot.booked_count >= slot.capacity) {
      return res.status(400).json({
        success: false,
        message: "Slot is full"
      });
    }

    if (Number(visitors) > 50) {
      return res.status(400).json({
        success: false,
        message: "Max 50 participants allowed"
      });
    }

    const fileUrl = file ? file.path : null;

    /* =========================
       SAVE BOOKING
    ========================= */
    await pool.query(
      `INSERT INTO bookings
      (institution, name, reason, visit_date, visitors, email, phone, slot_id, institution_type, institution_status, file_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        institution,
        name,
        reason,
        date,
        visitors,
        email,
        phone,
        slot_id,
        institution_type,
        institution_status,
        fileUrl
      ]
    );

    /* =========================
       UPDATE SLOT COUNT
    ========================= */
    await pool.query(
      "UPDATE slots SET booked_count = booked_count + 1 WHERE id=$1",
      [slot_id]
    );

    /* =========================
       EMAILS
    ========================= */
    const VERIFIED_EMAIL = process.env.VERIFIED_EMAIL;

    const adminHTML = `
      <h2>New Visit Request</h2>
      <p><b>Institution:</b> ${institution}</p>
      <p><b>Name:</b> ${name}</p>
      <p><b>Visitors:</b> ${visitors}</p>
      <p><b>Date:</b> ${date}</p>
      <p><b>Time:</b> ${slot.time}</p>
    `;

    const visitorHTML = `
      <h2>Visit Request Received</h2>
      <p>Hello ${name},</p>
      <p>Your booking is confirmed.</p>
      <p><b>Date:</b> ${date}</p>
      <p><b>Time:</b> ${slot.time}</p>
    `;

    if (process.env.RECEIVER_EMAIL && VERIFIED_EMAIL) {
      await resend.emails.send({
        from: `Visit Parliament <${VERIFIED_EMAIL}>`,
        to: process.env.RECEIVER_EMAIL,
        reply_to: email,
        subject: "New Visit Request",
        html: adminHTML
      });

      await resend.emails.send({
        from: `Visit Parliament <${VERIFIED_EMAIL}>`,
        to: email,
        subject: "Visit Request Received",
        html: visitorHTML
      });
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* =========================
   GENERATE SLOTS (RUN ONCE)
========================= */
app.get("/generate-slots", async (req, res) => {
  const { date, type } = req.query;

  const capacity = type === "sitting" ? 4 : 5;

  const times = [
    "09:00","09:30","10:00","10:30",
    "11:00","11:30","12:00","12:30",
    "14:30","15:00","15:30","16:00","16:30","17:00"
  ];

  try {
    for (let time of times) {
      await pool.query(
        `INSERT INTO slots (date, time, type, capacity)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT DO NOTHING`,
        [date, time, type, capacity]
      );
    }

    res.send("Slots generated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating slots");
  }
});

/* =========================
   SERVE FRONTEND
========================= */
const buildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(buildPath));

app.get("*", (req, res) =>
  res.sendFile(path.join(buildPath, "index.html"))
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);