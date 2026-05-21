import nodemailer from "nodemailer";

let etherealTransporter: nodemailer.Transporter | null = null;
let etherealAccount: nodemailer.TestAccount | null = null;

const getEtherealTransporter = async () => {
  if (!etherealTransporter) {
    let account;

    if (process.env.ETHEREAL_EMAIL && process.env.ETHEREAL_PASSWORD) {
      account = {
        user: process.env.ETHEREAL_EMAIL,
        pass: process.env.ETHEREAL_PASSWORD,
      };
    } else {
      // Buat akun baru
      account = await nodemailer.createTestAccount();
      console.log("\n📧 New Ethereal account created. Save these to .env:");
      console.log(`ETHEREAL_EMAIL=${account.user}`);
      console.log(`ETHEREAL_PASSWORD=${account.pass}\n`);
    }

    etherealTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
  }

  return { transporter: etherealTransporter };
};

export const sendResetPasswordEmail = async (
  email: string,
  resetToken: string,
) => {
  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

  const { transporter } = await getEtherealTransporter();

  const mailOptions = {
    from: '"Fusion Heart" <noreply@fusionheart.com>',
    to: email,
    subject: "Reset Password - Fusion Heart",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h1 style="color: #e91e63; margin-bottom: 0;">Fusion Heart</h1>
        <p style="color: #666; margin-top: 0;">❤️ Toko Buku & Kopi</p>
        
        <h2 style="color: #333;">Reset Password Anda</h2>
        
        <p>Anda menerima email ini karena Anda (atau orang lain) telah meminta reset password untuk akun Fusion Heart Anda.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #e91e63; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p>Atau copy link berikut:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">
          <a href="${resetUrl}" style="color: #e91e63;">${resetUrl}</a>
        </p>
        
        <p><strong>Link ini akan kadaluarsa dalam 1 jam.</strong></p>
        
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          © 2024 Fusion Heart - Toko Buku & Kopi JABODETABEK
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log("\n🔐 ============ RESET PASSWORD EMAIL ============");
  console.log(`📧 Email sent to: ${email}`);
  console.log(`🔗 Preview URL (klik untuk lihat email): ${previewUrl}`);
  console.log(`🔑 Reset token (jika perlu manual): ${resetToken}`);
  console.log("===============================================\n");

  return { info, previewUrl };
};
