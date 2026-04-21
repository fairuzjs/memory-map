import nodemailer from "nodemailer"

// Create a reusable transporter using SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_SERVER_PORT) || 465,
    secure: true, // Use TLS
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
})

/**
 * Base layout for all MemoryMap emails.
 * Uses table-based layout for maximum email client compatibility.
 */
function renderEmail(title: string, badge: string, contentHtml: string): string {
    const year = new Date().getFullYear()
    
    return `
    <!DOCTYPE html>
    <html lang="id" xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${title}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
            body, table, td, p, a, li, blockquote {
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
            }
            body { 
                margin: 0; padding: 0; width: 100% !important; 
                background-color: #030305; 
                font-family: 'Outfit', 'Segoe UI', Tahoma, sans-serif;
            }
            img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
            table { border-collapse: collapse !important; }
            
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; padding: 20px !important; }
                .card { padding: 32px 20px !important; border-radius: 20px !important; }
                .brand-pill { padding: 8px 20px !important; }
            }
        </style>
    </head>
    <body style="background-color: #030305; margin: 0; padding: 0;">
        <center>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #030305;">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        
                        <!-- ─── Brand Nav ─── -->
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 32px;">
                            <tr>
                                <td class="brand-pill" style="background: #0d0d14; border: 1px solid rgba(255,255,255,0.08); border-radius: 40px; padding: 12px 28px;">
                                    <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -1px;">Memory</span><span style="font-size: 24px; font-weight: 800; color: #6366f1; letter-spacing: -1px;">Map</span><span style="display:inline-block; width:6px; height:6px; background:#6366f1; border-radius:50%; margin-left:4px; vertical-align:middle;"></span>
                                </td>
                            </tr>
                        </table>

                        <!-- ─── Email Card ─── -->
                        <table class="container" width="560" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 560px; margin: 0 auto;">
                            <tr>
                                <td class="card" style="background-color: #0d0d14; border: 1px solid rgba(255,255,255,0.08); border-radius: 32px; padding: 48px; box-shadow: 0 40px 100px rgba(0,0,0,0.5);">
                                    
                                    <!-- Top Accent -->
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td height="1" style="font-size: 1px; line-height: 1px; background: linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent);">&nbsp;</td>
                                        </tr>
                                    </table>

                                    <!-- Badge -->
                                    <table border="0" cellpadding="0" cellspacing="0" style="margin-top: 24px; margin-bottom: 20px;">
                                        <tr>
                                            <td style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); border-radius: 20px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 1px;">
                                                &#9679;&nbsp; ${badge}
                                            </td>
                                        </tr>
                                    </table>


                                    <!-- Headline -->
                                    <h1 style="margin: 0 0 16px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${title}</h1>
                                    
                                    <!-- Dynamic Content -->
                                    ${contentHtml}

                                </td>
                            </tr>
                        </table>

                        <!-- ─── Footer ─── -->
                        <table class="container" width="560" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 560px; margin: 0 auto; margin-top: 32px;">
                            <tr>
                                <td align="center" style="font-size: 13px; color: #4b5563; line-height: 1.8;">
                                    <p style="margin: 0 0 8px 0;">&copy; ${year} MemoryMap Inc. &middot; Made with love for your memories.</p>
                                    <p style="margin: 0;">Sent via Secure Mail Server System</p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>
        </center>
    </body>
    </html>
    `
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    const contentHtml = `
    <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.8; color: #9ca3af;">
        Halo! Kami menerima permintaan untuk mengatur ulang kata sandi akun MemoryMap Anda. Ketuk tombol di bawah ini untuk memulai proses pemulihan.
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
        <tr>
            <td align="center">
                <a href="${resetLink}" style="display: inline-block; padding: 18px 42px; background-color: #6366f1; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);">
                    Atur Kata Sandi Baru &rarr;
                </a>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 1.8; color: #4b5563;">
        Jika Anda tidak merasa meminta hal ini, silakan abaikan pesan ini. Link ini akan kedaluwarsa secara otomatis dalam <strong>60 menit</strong>.
    </p>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px;">
        <tr>
            <td style="font-size: 12px; color: #4b5563; line-height: 1.6;">
                Tautan cadangan:<br>
                <a href="${resetLink}" style="color: #6366f1; text-decoration: none;">${resetLink}</a>
            </td>
        </tr>
    </table>
    `

    const html = renderEmail("Atur Ulang Kata Sandi", "Keamanan Akun", contentHtml)

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"MemoryMap" <noreply@memorymap.com>',
            to: email,
            subject: "Permintaan Reset Kata Sandi - MemoryMap",
            html,
        })
        console.log("Password reset email sent to " + email)
    } catch (error) {
        console.error("Error sending email", error)
    }
}

export async function sendVerificationEmail(email: string, code: string) {
    const digits = code.toString().split("")
    const digitCells = digits
        .map(
            (d) => `
            <td style="padding: 0 5px;">
                <div style="width: 44px; height: 56px; background: rgba(255,255,255,0.03); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; font-size: 28px; font-weight: 800; color: #ffffff; text-align: center; line-height: 56px;">${d}</div>
            </td>`
        )
        .join("")

    const contentHtml = `
    <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.8; color: #9ca3af;">
        Masukkan kode verifikasi di bawah ini untuk mengonfirmasi kepemilikan akun Anda dan mulai menjelajahi MemoryMap.
    </p>

    <center>
        <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
                ${digitCells}
            </tr>
        </table>
    </center>

    <p style="margin: 0 0 32px 0; text-align: center; font-size: 13px; color: #4b5563;">
        Kode ini dikirim untuk <strong style="color: #c7d0dd;">${email}</strong><br>
        Berlaku selama <strong style="color: #6366f1;">10 menit</strong>
    </p>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px;">
        <tr>
            <td style="font-size: 12px; color: #4b5563; line-height: 1.6; text-align: center;">
                Bukan Anda? Abaikan saja email ini. Keamanan akun Anda terjaga secara otomatis.
            </td>
        </tr>
    </table>
    `

    const html = renderEmail("Verifikasi Akun Anda", "Verifikasi Akun", contentHtml)

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"MemoryMap" <noreply@memorymap.com>',
            to: email,
            subject: "Kode Verifikasi Email - MemoryMap",
            html,
        })
        console.log("Verification email sent to " + email)
    } catch (error) {
        console.error("Error sending verification email", error)
        throw error
    }
}