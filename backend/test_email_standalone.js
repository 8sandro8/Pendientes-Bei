const nodemailer = require('nodemailer');
require('dotenv').config();

const user = process.env.EMAIL_USER || 'harmonyyclay@gmail.com';
const pass = process.env.EMAIL_PASS || 'ngkbkfahmqvvjjqb';

console.log('Testing Email with User:', user);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
});

const mailOptions = {
    from: user,
    to: user, // Send to self
    subject: 'TEST EMAIL FROM SCRIPT',
    text: 'If you receive this, the credentials and network are working.'
};

transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
        console.error('ERROR:', err);
    } else {
        console.log('SUCCESS:', info.messageId);
    }
});
