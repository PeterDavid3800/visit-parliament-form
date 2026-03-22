import React, { useState } from "react";
import "../styles/VisitForm.css";

function VisitForm() {
  const [slots, setSlots] = useState([]);

  const [formData, setFormData] = useState({
    institution: "",
    name: "",
    reason: "",
    otherReason: "",
    date: "",
    slot_id: "",
    visitors: "",
    email: "",
    phone: "",
    institution_type: "",
    institution_status: "",
    file: null,
    consent: false
  });

  const [status, setStatus] = useState("");

  /* =========================
     HANDLE INPUT CHANGE
  ========================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  /* =========================
     FETCH SLOTS
  ========================= */
  const fetchSlots = async (date) => {
    try {
      const res = await fetch(
        `https://visit-parliament-form.onrender.com/slots?date=${date}`
      );
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
     SUBMIT FORM
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.consent) {
      setStatus("❌ You must agree to the terms");
      return;
    }

    const form = new FormData();

    const reasonToSend =
      formData.reason === "Other"
        ? formData.otherReason
        : formData.reason;

    Object.keys(formData).forEach((key) => {
      if (key === "reason") {
        form.append("reason", reasonToSend);
      } else {
        form.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch(
        "https://visit-parliament-form.onrender.com/send-email",
        {
          method: "POST",
          body: form
        }
      );

      const data = await response.json();

      if (data.success) {
        setStatus("✅ Booking successful!");

        setFormData({
          institution: "",
          name: "",
          reason: "",
          otherReason: "",
          date: "",
          slot_id: "",
          visitors: "",
          email: "",
          phone: "",
          institution_type: "",
          institution_status: "",
          file: null,
          consent: false
        });

        setSlots([]);
      } else {
        setStatus(`❌ ${data.message || "Error occurred"}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Server error");
    }

    setTimeout(() => setStatus(""), 5000);
  };

  return (
    <div className="form-container">
      <h1 className="title">Visit Request Form</h1>

      <p><strong>Parliament Road, Nairobi</strong></p>
      <p>Book your visit below. Entry is FREE.</p>

      {status && <div className="status">{status}</div>}

      <form onSubmit={handleSubmit} className="visit-form">

        {/* Institution */}
        <input
          type="text"
          name="institution"
          placeholder="Institution Name"
          value={formData.institution}
          onChange={handleChange}
          required
        />

        {/* Name */}
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        {/* Institution Type */}
        <select
          name="institution_type"
          value={formData.institution_type}
          onChange={handleChange}
          required
        >
          <option value="">Institution Type</option>
          <option>Private</option>
          <option>Public</option>
          <option>Charitable</option>
        </select>

        {/* Registration Status */}
        <select
          name="institution_status"
          value={formData.institution_status}
          onChange={handleChange}
          required
        >
          <option value="">Registration Status</option>
          <option>Registered</option>
          <option>Not Registered</option>
        </select>

        {/* Reason */}
        <select
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          required
        >
          <option value="">Reason for Visit</option>
          <option>Educational Tour</option>
          <option>Official Meeting</option>
          <option>Research</option>
          <option>Parliamentary Proceedings Observation</option>
          <option>Media Coverage</option>
          <option>Internship or Academic Program</option>
          <option>Government Delegation Visit</option>
          <option>School / University Trip</option>
          <option>Other</option>
        </select>

        {/* Other reason */}
        {formData.reason === "Other" && (
          <input
            type="text"
            name="otherReason"
            placeholder="Specify your reason"
            value={formData.otherReason}
            onChange={handleChange}
            required
          />
        )}

        {/* Date */}
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={(e) => {
            handleChange(e);
            fetchSlots(e.target.value);
          }}
          required
        />

        {/* Slot */}
        <select
          name="slot_id"
          value={formData.slot_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Time Slot</option>
          {slots.map((slot) => (
            <option
              key={slot.id}
              value={slot.id}
              disabled={slot.booked_count >= slot.capacity}
            >
              {slot.time} ({slot.booked_count}/{slot.capacity})
            </option>
          ))}
        </select>

        {/* Visitors */}
        <input
          type="number"
          name="visitors"
          placeholder="Number of Visitors (Max 50)"
          value={formData.visitors}
          onChange={handleChange}
          required
        />

        {/* Email */}
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />

        {/* Phone */}
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        {/* File Upload */}
        <label>Upload Signed Participant List</label>
        <input
          type="file"
          name="file"
          onChange={(e) =>
            setFormData({ ...formData, file: e.target.files[0] })
          }
          required
        />

        {/* Rules */}
        <div className="rules">
          <p>• Only Grade 6 and above allowed</p>
          <p>• Max 50 participants per school</p>
          <p>• Departure within 15 minutes after tour</p>
        </div>

        {/* Consent */}
        <label className="consent">
          <input
            type="checkbox"
            name="consent"
            checked={formData.consent}
            onChange={handleChange}
          />
          I consent to photography and videography by Parliament
        </label>

        {/* Submit */}
        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
}

export default VisitForm;