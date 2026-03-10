const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Configuración de Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Configuración de Nodemailer (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Endpoint para enviar confirmación de compra
app.post('/api/confirmar-compra', async (req, res) => {
    const { email, nombres, total, productos, id_pedido } = req.body;

    if (!email || !productos) {
        return res.status(400).json({ error: 'Faltan datos del pedido' });
    }

    const TASA_COP = 4150; // Tasa fija según js/currency.js

    const listaProductosHtml = productos.map(p => {
        const precioCOP = p.precio * TASA_COP;
        return `
            <tr>
                <td style="padding: 15px 0; border-bottom: 1px solid #1e293b;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td valign="top">
                                <p style="margin: 0; color: #f8fafc; font-size: 14px; font-weight: bold;">${p.nombre}</p>
                                <p style="margin: 5px 0 0; color: #94a3b8; font-size: 12px;">Talla: <span style="color: #00b7ff; font-weight: bold;">${p.talla || 'N/A'}</span> | Cantidad: ${p.cantidad}</p>
                            </td>
                            <td align="right" valign="top">
                                <p style="margin: 0; color: #00b7ff; font-weight: 900; font-size: 14px;">$ ${precioCOP.toLocaleString('es-CO', { minimumFractionDigits: 0 })} COP</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `;
    }).join('');

    const totalCOP = total * TASA_COP;

    const mailOptions = {
        from: `"PixelWear" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `[PEDIDO #${id_pedido}] ¡Misión Iniciada, ${nombres}! 🛡️`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Inter', Arial, sans-serif;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#020617">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 32px; overflow: hidden; border: 1px solid #1e293b;">
                                <!-- Header -->
                                <tr>
                                    <td align="center" style="background: linear-gradient(135deg, #00b7ff 0%, #4f46e5 100%); padding: 40px 20px;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: 5px; text-transform: uppercase;">PIXEL<span style="color: #020617;">WEAR</span></h1>
                                        <p style="margin: 10px 0 0; color: #ffffff; font-size: 10px; font-weight: 700; letter-spacing: 3px; opacity: 0.9; text-transform: uppercase;">Protocolo de Suministros Rango S</p>
                                    </td>
                                </tr>

                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding-bottom: 30px;">
                                                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900;">¡Saludos, ${nombres}! 👋</h2>
                                                    <p style="margin: 10px 0 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">Tu pedido ha sido registrado con éxito en nuestro sistema central. Estamos preparando tu equipo para que subas de nivel.</p>
                                                </td>
                                            </tr>

                                            <!-- Order Box -->
                                            <tr>
                                                <td style="background-color: #1e293b; border-radius: 20px; padding: 25px; border: 1px solid #334155;">
                                                    <p style="margin: 0 0 15px; color: #00b7ff; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">Resumen de la Transacción #${id_pedido}</p>
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                        ${listaProductosHtml}
                                                        <tr>
                                                            <td align="right" style="padding-top: 25px;">
                                                                <table border="0" cellspacing="0" cellpadding="0">
                                                                    <tr>
                                                                        <td style="color: #94a3b8; font-size: 12px; font-weight: 700; padding-right: 15px; text-transform: uppercase;">Total de la Misión:</td>
                                                                        <td style="color: #ffffff; font-size: 28px; font-weight: 900;">$ ${totalCOP.toLocaleString('es-CO', { minimumFractionDigits: 0 })} COP</td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>

                                            <!-- Status Message -->
                                            <tr>
                                                <td style="padding-top: 35px;">
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(239, 68, 68, 0.1); border-radius: 12px; border-left: 4px solid #ef4444;">
                                                        <tr>
                                                            <td style="padding: 15px 20px;">
                                                                <p style="margin: 0; color: #ef4444; font-size: 14px; font-weight: 900;">🛡️ ESTADO: PREPARANDO ENVÍO</p>
                                                                <p style="margin: 5px 0 0; color: #94a3b8; font-size: 12px;">Nuestros herreros tecnológicos están verificando cada artículo antes de la entrega.</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>

                                            <!-- Button -->
                                            <tr>
                                                <td align="center" style="padding-top: 45px;">
                                                    <a href="${BASE_URL}/rastreo.html?id=${id_pedido}" style="background: linear-gradient(90deg, #00b7ff, #4f46e5); color: #ffffff; padding: 20px 40px; border-radius: 16px; text-decoration: none; font-weight: 900; font-size: 14px; letter-spacing: 2px; display: inline-block; text-transform: uppercase; box-shadow: 0 10px 20px rgba(0, 183, 255, 0.3);">Seguimiento de Misión</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding: 0 30px 40px; color: #475569; font-size: 11px;">
                                        <p style="margin: 0; padding-top: 20px; border-top: 1px solid #1e293b;">&copy; 2026 PIXELWEAR • EL GREMIO DE LOS CAZADORES</p>
                                        <p style="margin: 5px 0 0;">Si recibiste este correo por error, por favor ignóralo.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Confirmación enviada a ${email}`);
        res.status(200).json({ success: true, message: 'Correo enviado correctamente' });
    } catch (error) {
        console.error('[Email Error]', error);
        res.status(500).json({ error: 'Error al enviar el correo' });
    }
});

// Manejo de todas las otras rutas para index.html (SPA feel)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
    ---------------------------------------------------
    🚀 PixelWear Server rodando en: ${BASE_URL}
    📧 Servicio de Correo: pixelwear632@gmail.com
    ---------------------------------------------------
    `);
});
