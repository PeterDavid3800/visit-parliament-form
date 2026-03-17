import React, { useState, useRef } from "react";
import "../styles/VisitForm.css";
import ReCAPTCHA from "react-google-recaptcha";

function VisitForm() {
  const recaptchaRef = useRef();

  const [formData, setFormData] = useState({
    institution: "",
    name: "",
    reason: "",
    otherReason: "",
    date: "",
    visitors: "",
    email: "",
    phone: ""
  });

  const [captchaToken, setCaptchaToken] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaToken) {
      setStatusMessage("❌ Please verify that you are not a robot.");
      setStatusType("error");
      setTimeout(() => setStatusMessage(""), 5000);
      return;
    }

    const reasonToSend =
      formData.reason === "Other" ? formData.otherReason : formData.reason;

    try {
      const response = await fetch("/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          reason: reasonToSend,
          captchaToken
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatusMessage("✔ Request submitted successfully!");
        setStatusType("success");

        setFormData({
          institution: "",
          name: "",
          reason: "",
          otherReason: "",
          date: "",
          visitors: "",
          email: "",
          phone: ""
        });

        setCaptchaToken(null);
        recaptchaRef.current.reset();
      } else {
        setStatusMessage(`❌ ${data.message || "Failed to submit request."}`);
        setStatusType("error");
      }

    } catch (error) {
      console.error("Error:", error);
      setStatusMessage("❌ An error occurred while submitting the form.");
      setStatusType("error");
    }

    setTimeout(() => setStatusMessage(""), 5000);
  };

  return (
    <div className="form-container">

      <div className="form-intro">
        <h1 className="title">Visit Request Form</h1>
        <h2>How to get to Parliament Building</h2>
        <p>Parliament Building is located at <strong>Parliament Road, Nairobi</strong>.</p>
        <p>
          It is easy to get to Parliament Building by car, public transport, or by foot.
          From the City Centre, take <strong>Harambee Avenue</strong> to Parliament Road.
        </p>
        <p>To book a visit to Parliament, kindly fill in your details below.</p>
      </div>

      {statusMessage && (
        <div className={`status-message ${statusType}`}>
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="visit-form">

        <input
          type="text"
          name="institution"
          placeholder="Institution Name"
          value={formData.institution}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

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

        {formData.reason === "Other" && (
          <input
            type="text"
            name="otherReason"
            placeholder="Please specify your reason"
            value={formData.otherReason}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
        />

        <input
          type="number"
          name="visitors"
          placeholder="Number of Visitors"
          value={formData.visitors}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
        />

        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey="6LeOTYksAAAAAE5IeQBAdniPBXJn3Vgluqmh9Qx6"
          onChange={handleCaptchaChange}
        />

        <button type="submit">Submit Request</button>

      </form>
    </div>
  );
}

export default VisitForm;