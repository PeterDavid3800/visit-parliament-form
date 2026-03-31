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
          <option value="">School Type</option>
          <option>National School</option>
          <option>Extra County School</option>
          <option>County School</option>
          <option>Sub County School</option>
          <option>Private School</option>
        </select>

        <select name="institution_status" value={formData.institution_status} onChange={handleChange} required>
          <option value="">Registration Status</option>
          <option>Registered</option>
          <option>Not Registered</option>
        </select>

        <select name="reason" value={formData.reason} onChange={handleChange} required>
          <option value="">Reason for Visit</option>
          <option>Educational Tour</option>
          <option>School / University Trip</option>
          <option>Research</option>
          <option>Parliamentary Proceedings Observation</option>
          <option>Media Coverage</option>
          <option>Internship or Academic Program</option>
          <option>Government Delegation Visit</option>
          <option>Other</option>
        </select>

        {formData.reason === "Other" && (
          <input type="text" name="otherReason" placeholder="Specify your reason" value={formData.otherReason} onChange={handleChange} required />
        )}

        <input type="date" name="date" min={new Date().toISOString().split("T")[0]} value={formData.date} onChange={handleChange} required />

        {formData.date && (
          <table className="slots-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Booked</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const booked = Number(slot.booked_count);
                const capacity = Number(slot.capacity);
                const isFull = booked >= capacity;

                return (
                  <tr key={slot.id}>
                    <td>{slot.time}</td>
                    <td>{booked}</td>
                    <td>{capacity}</td>
                    <td>
                      {isFull ? (
                        <span style={{ color: "red" }}>Full</span>
                      ) : (
                        <span style={{ color: "green" }}>Available</span>
                      )}
                    </td>
                    <td>
                      <input
                        type="radio"
                        name="slot_id"
                        value={slot.id}
                        disabled={isFull}
                        checked={formData.slot_id == slot.id}
                        onChange={() =>
                          setFormData({ ...formData, slot_id: slot.id })
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
          <p>• Visits are strictly for schools only</p>
          <p>• Entry is FREE</p>
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