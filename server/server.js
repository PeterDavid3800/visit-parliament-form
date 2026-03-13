const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/send-email", async (req, res) => {

const { institution, name, reason, date, visitors, email, phone } = req.body;

const transporter = nodemailer.createTransport({
service: "gmail",
auth: {
user: "yourgmail@gmail.com",
pass: "your-app-password"
}
});

const mailOptions = {
from: email,
to: "admin@email.com",
subject: "New Visit Request",
text: `
Institution: ${institution}
Name: ${name}
Reason: ${reason}
Visit Date: ${date}
Visitors: ${visitors}
Email: ${email}
Phone: ${phone}
`
};

try{
await transporter.sendMail(mailOptions);
res.status(200).send("Email sent successfully");
}
catch(error){
res.status(500).send(error);
}

});

app.listen(5000, () => {
console.log("Server running on port 5000");
});