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

export async function sendPasswordResetEmail(email: string, token: string) {
    // Determine the base URL dynamically based on environment or fallback to localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"MemoryMap" <noreply@memorymap.com>',
        to: email,
        subject: "Permintaan Reset Kata Sandi - MemoryMap",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Kata Sandi</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #080810; color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; margin-bottom: 16px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                        Memory<span style="color: #818cf8;">Map</span>
                    </h1>
                </div>

                <!-- Main Content -->
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);">
                    <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
                        Reset Kata Sandi Anda
                    </h2>
                    
                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #a3a3a3;">
                        Halo, kami menerima permintaan untuk mengatur ulang kata sandi pada akun MemoryMap Anda. Jika Anda merasa tidak pernah memintanya, Anda dapat mengabaikan email ini.
                    </p>

                    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #a3a3a3;">
                        Untuk mengatur ulang kata sandi Anda, silakan klik tombol di bawah ini:
                    </p>

                    <div style="text-align: center; margin-bottom: 32px;">
                        <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 9999px; box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.5); border: 1px solid rgba(255, 255, 255, 0.1);">
                            Reset Kata Sandi
                        </a>
                    </div>

                    <div style="padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                        <p style="margin: 0 0 12px 0; font-size: 13px; color: #737373;">
                            Atau salin dan tempel tautan ini ke peramban web Anda:
                        </p>
                        <p style="margin: 0; font-size: 13px; color: #818cf8; word-break: break-all; line-height: 1.5;">
                            ${resetLink}
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #525252;">
                        Tautan ini akan kedaluwarsa dalam 1 jam demi keamanan akun Anda.
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #525252;">
                        &copy; ${new Date().getFullYear()} MemoryMap Inc. Hak cipta dilindungi undang-undang.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `
    }

    try {
        await transporter.sendMail(mailOptions)
        console.log("Password reset email sent to " + email)
    } catch (error) {
        console.error("Error sending email", error)
    }
}
