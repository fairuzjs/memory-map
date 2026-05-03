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
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
            body, table, td, p, a, li, blockquote {
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
            }
            body { 
                margin: 0; padding: 0; width: 100% !important; 
                background-color: #E5E5E5; 
                font-family: 'Outfit', 'Segoe UI', Tahoma, sans-serif;
            }
            img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
            table { border-collapse: collapse !important; }
            
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; padding: 20px !important; }
                .card { padding: 32px 20px !important; box-shadow: 6px 6px 0 #000 !important; }
                .brand-pill { padding: 8px 20px !important; }
            }
        </style>
    </head>
    <body style="background-color: #E5E5E5; margin: 0; padding: 0;">
        <center>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #E5E5E5;">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        
                        <!-- ─── Brand Nav ─── -->
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 32px;">
                            <tr>
                                <td class="brand-pill" style="background: #00FFFF; border: 4px solid #000; box-shadow: 6px 6px 0 #000; padding: 12px 28px;">
                                    <span style="font-size: 24px; font-weight: 900; color: #000; letter-spacing: -1px; text-transform: uppercase;">Memory</span><span style="font-size: 24px; font-weight: 900; color: #FF00FF; letter-spacing: -1px; text-transform: uppercase;">Map</span><span style="display:inline-block; width:8px; height:8px; background:#FFFF00; border: 2px solid #000; margin-left:6px; vertical-align:middle;"></span>
                                </td>
                            </tr>
                        </table>

                        <!-- ─── Email Card ─── -->
                        <table class="container" width="560" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 560px; margin: 0 auto;">
                            <tr>
                                <td class="card" style="background-color: #FFFFFF; border: 4px solid #000000; padding: 48px; box-shadow: 12px 12px 0 #000000;">
                                    
                                    <!-- Top Accent -->
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                                        <tr>
                                            <td height="8" style="font-size: 1px; line-height: 1px; background: #FF3300; border: 2px solid #000;">&nbsp;</td>
                                        </tr>
                                    </table>

                                    <!-- Badge -->
                                    <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                        <tr>
                                            <td style="background: #FFFF00; border: 3px solid #000; box-shadow: 4px 4px 0 #000; padding: 6px 14px; font-size: 12px; font-weight: 900; color: #000; text-transform: uppercase; letter-spacing: 1px;">
                                                ${badge}
                                            </td>
                                        </tr>
                                    </table>


                                    <!-- Headline -->
                                    <h1 style="margin: 0 0 20px 0; font-size: 32px; font-weight: 900; color: #000000; letter-spacing: -0.5px; text-transform: uppercase;">${title}</h1>
                                    
                                    <!-- Dynamic Content -->
                                    ${contentHtml}

                                </td>
                            </tr>
                        </table>

                        <!-- ─── Footer ─── -->
                        <table class="container" width="560" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 560px; margin: 0 auto; margin-top: 32px;">
                            <tr>
                                <td align="center" style="font-size: 13px; color: #000000; line-height: 1.8; font-weight: 700;">
                                    <p style="margin: 0 0 8px 0; text-transform: uppercase;">&copy; ${year} MemoryMap Inc.</p>
                                    <p style="margin: 0; background: #000; color: #FFF; display: inline-block; padding: 4px 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-size: 10px;">Sent via Secure Mail Server System</p>
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
    <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.8; color: #000000; font-weight: 600;">
        Halo! Kami menerima permintaan untuk mengatur ulang kata sandi akun MemoryMap Anda. Ketuk tombol di bawah ini untuk memulai proses pemulihan.
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
        <tr>
            <td align="left">
                <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background-color: #00FF00; color: #000000; font-size: 16px; font-weight: 900; text-decoration: none; border: 4px solid #000; box-shadow: 6px 6px 0 #000; text-transform: uppercase;">
                    Atur Kata Sandi Baru &rarr;
                </a>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 1.8; color: #000000; font-weight: 700; background: #FFD700; padding: 16px; border: 3px solid #000;">
        Jika Anda tidak merasa meminta hal ini, silakan abaikan pesan ini. Link ini akan kedaluwarsa secara otomatis dalam <strong style="color: #000; font-weight: 900; text-decoration: underline;">60 menit</strong>.
    </p>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 4px solid #000; padding-top: 24px;">
        <tr>
            <td style="font-size: 13px; color: #000000; line-height: 1.6; font-weight: 700;">
                Tautan cadangan:<br>
                <a href="${resetLink}" style="color: #FF00FF; text-decoration: underline; font-weight: 900;">${resetLink}</a>
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
            <td style="padding: 0 6px;">
                <div style="width: 48px; height: 64px; background: #FFFFFF; border: 4px solid #000; box-shadow: 4px 4px 0 #000; font-size: 32px; font-weight: 900; color: #000000; text-align: center; line-height: 64px;">${d}</div>
            </td>`
        )
        .join("")

    const contentHtml = `
    <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.8; color: #000000; font-weight: 600;">
        Masukkan kode verifikasi di bawah ini untuk mengonfirmasi kepemilikan akun Anda dan mulai menjelajahi <strong style="font-weight: 900;">MEMORYMAP</strong>.
    </p>

    <center>
        <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
            <tr>
                ${digitCells}
            </tr>
        </table>
    </center>

    <div style="background: #E5E5E5; border: 3px solid #000; padding: 16px; text-align: center; margin-bottom: 32px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #000000; font-weight: 700;">
            Kode ini dikirim untuk <strong style="background: #000; color: #FFF; padding: 2px 6px;">${email}</strong>
        </p>
        <p style="margin: 0; font-size: 14px; color: #000000; font-weight: 700;">
            Berlaku selama <strong style="color: #FF3300; font-weight: 900; text-transform: uppercase;">10 menit</strong>
        </p>
    </div>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 4px solid #000; padding-top: 24px;">
        <tr>
            <td style="font-size: 13px; color: #000000; line-height: 1.6; text-align: center; font-weight: 700;">
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