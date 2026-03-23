import React, { useState, useEffect } from "react";
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
    consent: false,
  });
  const [status, setStatus] = useState("");
  const [visitorWarning, setVisitorWarning] = useState("");

  /* Handle input change */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "visitors") {
      if (value > 50) {
        setVisitorWarning("⚠ Maximum 50 visitors allowed per school");
      } else {
        setVisitorWarning("");
      }
    }

    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  /* Fetch slots when date changes */
  useEffect(() => {
    if (!formData.date) return;

    const fetchSlots = async () => {
      try {
        const res = await fetch(
          `https://visit-parliament-form.onrender.com/slots?date=${formData.date}`
        );
        const data = await res.json();

        setSlots(data);
        setFormData((prev) => ({ ...prev, slot_id: "" }));
      } catch (err) {
        console.error(err);
      }
    };

    fetchSlots();
  }, [formData.date]);

  /* Handle form submit */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.slot_id) {
      setStatus("❌ Please select a time slot");
      return;
    }

    if (!formData.consent) {
      setStatus("❌ You must agree to the consent.");
      return;
    }

    if (formData.visitors > 50) {
      setStatus("❌ Maximum 50 visitors allowed.");
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
      } else if (key === "file") {
        if (formData.file) form.append("file", formData.file);
      } else {
        form.append(key, formData[key]);
      }
    });

    try {
      const res = await fetch(
        "https://visit-parliament-form.onrender.com/send-email",
        { method: "POST", body: form }
      );

      const data = await res.json();

      if (data.success) {
        setStatus("✅ Booking successful!");

        // Reset form
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
          consent: false,
        });

        setSlots([]);
      } else {
        setStatus(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Server error. Try again.");
    }

    setTimeout(() => setStatus(""), 5000);
  };

  return (
    <div className="form-container">
      <h1 className="title">Visit Request Form</h1>
      <p><strong>Parliament Road, Nairobi</strong></p>
      <p>Book your visit below. Entry is <strong>FREE</strong>.</p>

      {status && <div className="status">{status}</div>}

      <form onSubmit={handleSubmit} className="visit-form">
        <input type="text" name="institution" placeholder="Institution Name" value={formData.institution} onChange={handleChange} required />
        <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />

        <select name="institution_type" value={formData.institution_type} onChange={handleChange} required>
          <option value="">Institution Type</option>
          <option>Private</option>
          <option>Public</option>
          <option>Charitable</option>
        </select>

        <select name="institution_status" value={formData.institution_status} onChange={handleChange} required>
          <option value="">Registration Status</option>
          <option>Registered</option>
          <option>Not Registered</option>
        </select>

        <select name="reason" value={formData.reason} onChange={handleChange} required>
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

        {formData.reason === "Other" && (
          <input type="text" name="otherReason" placeholder="Specify your reason" value={formData.otherReason} onChange={handleChange} required />
        )}

        <input type="date" name="date" min={new Date().toISOString().split("T")[0]} value={formData.date} onChange={handleChange} required />

        {formData.date && (
          <div className="slot-grid">
            {slots.length === 0 && <p>No slots available for this date.</p>}

            {Array.isArray(slots) &&
              slots.map((slot) => {
                const bookedCount = Number(slot.booked_count) || 0;
                const capacity = Number(slot.capacity) || 0;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    className={`slot-btn ${
                      bookedCount >= capacity ? "full" : ""
                    } ${
                      formData.slot_id == slot.id ? "selected" : ""
                    }`}
                    disabled={bookedCount >= capacity}
                    onClick={() =>
                      setFormData({ ...formData, slot_id: slot.id })
                    }
                  >
                    {slot.time} ({bookedCount}/{capacity})
                  </button>
                );
              })}
          </div>
        )}

        <input type="number" name="visitors" placeholder="Number of Visitors" value={formData.visitors} onChange={handleChange} max={50} required />
        {visitorWarning && <small className="warning">{visitorWarning}</small>}

        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
        <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />

        <label>Upload Signed Participant List</label>
        <input type="file" name="file" onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })} required />

        <div className="rules">
          <p>• Only Grade 6 and above allowed</p>
          <p>• Max 50 participants per school</p>
          <p>• Departure within 15 minutes after tour</p>
        </div>

        <label className="consent">
          <input type="checkbox" name="consent" checked={formData.consent} onChange={handleChange} />
          I consent to photography and videography by Parliament
        </label>

        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
}

export default VisitForm;