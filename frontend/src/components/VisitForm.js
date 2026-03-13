import React, { useState, useRef } from "react";
import "../styles/VisitForm.css";
import ReCAPTCHA from "react-google-recaptcha";

function VisitForm() {
  const recaptchaRef = useRef();

  const [formData, setFormData] = useState({
    institution: "",
    name: "",
    reason: "",
    date: "",
    visitors: "",
    email: "",
    phone: ""
  });

  const [captchaToken, setCaptchaToken] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

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
      setStatusMessage("❌ Please verify that you are not a a robot.");
      setTimeout(() => setStatusMessage(""), 5000);
      return;
    }

    try {
      const response = await fetch("/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          captchaToken
        })
      });

      if (response.ok) {
        setStatusMessage("✔ Request submitted successfully!");

        setFormData({
          institution: "",
          name: "",
          reason: "",
          date: "",
          visitors: "",
          email: "",
          phone: ""
        });

        setCaptchaToken(null);
        recaptchaRef.current.reset();

      } else {
        const data = await response.json();
        setStatusMessage(`❌ ${data.message || "Failed to submit request."}`);
      }

    } catch (error) {
      console.error("Error:", error);
      setStatusMessage("❌ An error occurred while submitting the form.");
    }

    setTimeout(() => setStatusMessage(""), 5000);
  };

  return (
    <div className="form-container">

      {/* Intro Section */}
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

      {/* Status Message */}
      {statusMessage && <div className="status-message">{statusMessage}</div>}

      {/* Form Section */}
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
        >
          <option value="">Reason for Visit</option>
          <option>Educational Tour</option>
          <option>Official Meeting</option>
          <option>Research</option>
        </select>

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

        {/* reCAPTCHA */}
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