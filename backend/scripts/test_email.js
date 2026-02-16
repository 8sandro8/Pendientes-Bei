const path = require('path');
const dotenvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: dotenvPath });
console.log('--- DEBUG INFO ---');
console.log('Script Path:', __dirname);
console.log('Looking for .env at:', dotenvPath);
const fs = require('fs');
console.log('.env exists?:', fs.existsSync(dotenvPath));
const nodemailer = require('nodemailer');

console.log('--- TEST DE EMAIL ---');
console.log('Usuario:', process.env.EMAIL_USER);
console.log('Pass (Longitud):', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : '0');

if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'CAMBIAR_POR_APP_PASSWORD_DE_GOOGLE') {
    console.error('❌ ERROR: La contraseña del email no está configurada en .env');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Enviarse a sí mismo
    subject: 'Prueba de Correo - Pendientes Bei',
    text: 'Si lees esto, ¡el envío de correos funciona correctamente! 🚀'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log('❌ ERROR AL ENVIAR:', error);
    } else {
        console.log('✅ CORREO ENVIADO CON ÉXITO: ' + info.response);
    }
});
