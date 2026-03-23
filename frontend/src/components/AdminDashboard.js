import React, { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState("");

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      const res = await fetch("https://visit-parliament-form.onrender.com/admin/bookings");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch slots
  const fetchSlots = async () => {
    if (!date) return;
    try {
      const res = await fetch(`https://visit-parliament-form.onrender.com/slots?date=${date}`);
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [date]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Admin Dashboard</h1>

      {/* BOOKINGS TABLE */}
      <h2>Bookings</h2>
      <table border="1" cellPadding="10" style={{ width: "100%", marginBottom: "30px" }}>
        <thead>
          <tr>
            <th>Institution</th>
            <th>Name</th>
            <th>Date</th>
            <th>Visitors</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.institution}</td>
              <td>{b.name}</td>
              <td>{b.visit_date}</td>
              <td>{b.visitors}</td>
              <td>{b.email}</td>
              <td>{b.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SLOT VIEW */}
      <h2>Slots</h2>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "10px", marginTop: "10px" }}>
        {slots.map((slot) => (
          <div
            key={slot.id}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background: slot.booked_count >= slot.capacity ? "#f8d7da" : "#d4edda"
            }}
          >
            <strong>{slot.time}</strong>
            <p>{slot.booked_count}/{slot.capacity}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
