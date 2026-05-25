import nodemailer from "nodemailer";

let etherealTransporter: nodemailer.Transporter | null = null;
let etherealAccount: nodemailer.TestAccount | null = null;

const getEtherealTransporter = async () => {
  if (!etherealTransporter) {
    etherealAccount = await nodemailer.createTestAccount();

    console.log("\n📧 ============ ETHEREAL EMAIL ACCOUNT ============");
    console.log(`   Email: ${etherealAccount.user}`);
    console.log(`   Password: ${etherealAccount.pass}`);
    console.log("==================================================\n");

    etherealTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass,
      },
    });
  }

  return { transporter: etherealTransporter, account: etherealAccount };
};

// Kirim Token Reset Password
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

// Konfirmasi Pesanan Melalui Email
export const sendOrderConfirmationEmail = async (
  email: string,
  orderData: any,
) => {
  const { transporter } = await getEtherealTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; }
        .header { text-align: center; padding: 20px; background: #e91e63; color: white; }
        .header h1 { margin: 0; }
        .content { padding: 20px; }
        .order-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .total { font-size: 18px; font-weight: bold; color: #e91e63; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
        .button { display: inline-block; padding: 10px 20px; background: #e91e63; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FUSION HEART ❤️</h1>
          <p>Toko Buku & Kopi • Jabodetabek</p>
        </div>
        <div class="content">
          <h2>Order Confirmation</h2>
          <p>Dear ${orderData.customerName},</p>
          <p>Thank you for your order! Your order has been successfully placed.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Invoice Number:</strong> ${orderData.invoiceNumber}</p>
            <p><strong>Order Type:</strong> ${orderData.orderType === "DELIVERY" ? "🚚 Delivery" : "📦 Pickup"}</p>
            <p><strong>Payment Method:</strong> ${orderData.paymentMethod === "TRANSFER" ? "💸 Bank Transfer" : "💵 Cash on Delivery"}</p>
            <p><strong>Total Amount:</strong> <span class="total">Rp${(orderData.total ?? 0).toLocaleString()}</span></p>          
          </div>
          
          <p>You can track your order status in your account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/orders/${orderData.orderId}" class="button">View Order</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 Fusion Heart - Where stories and souls meet</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: '"Fusion Heart" <noreply@fusionheart.com>',
    to: email,
    subject: `Order Confirmation - ${orderData.invoiceNumber}`,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`📧 Order confirmation email sent to ${email}`);
  console.log(`🔗 Preview: ${previewUrl}`);

  return { info, previewUrl };
};

// Memperbarui Status Pesanan
export const sendOrderStatusUpdateEmail = async (
  email: string,
  orderData: any,
) => {
  const { transporter } = await getEtherealTransporter();

  const statusMessages: Record<string, string> = {
    ASSIGNED: "Your order has been assigned to a driver! 🚚",
    PROCESSING: "Your order is being processed! 📦",
    COMPLETED: "Your order has been completed! ✅",
    CANCELLED: "Your order has been cancelled. ❌",
  };

  const message =
    statusMessages[orderData.orderStatus] ||
    `Your order status has been updated to: ${orderData.orderStatus}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; }
        .header { text-align: center; padding: 20px; background: #e91e63; color: white; }
        .content { padding: 20px; text-align: center; }
        .status { font-size: 24px; font-weight: bold; color: #e91e63; margin: 20px 0; }
        .button { display: inline-block; padding: 10px 20px; background: #e91e63; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FUSION HEART ❤️</h1>
        </div>
        <div class="content">
          <p>Dear ${orderData.customerName},</p>
          <p>${message}</p>
          <div class="status">Status: ${orderData.orderStatus}</div>
          <div style="margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/orders/${orderData.orderId}" class="button">Track Order</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 Fusion Heart</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: '"Fusion Heart" <noreply@fusionheart.com>',
    to: email,
    subject: `Order Status Update - ${orderData.invoiceNumber}`,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`📧 Order status email sent to ${email}`);
  console.log(`🔗 Preview: ${previewUrl}`);

  return { info, previewUrl };
};

// Notifikasi Promo
export const sendPromoNotificationEmail = async (
  email: string,
  promoData: any,
) => {
  const { transporter } = await getEtherealTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { text-align: center; padding: 20px; background: #e91e63; color: white; }
        .promo-code { font-size: 28px; font-weight: bold; text-align: center; padding: 20px; background: #f0f0f0; margin: 20px; letter-spacing: 5px; }
        .button { display: inline-block; padding: 10px 20px; background: #e91e63; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Special Offer! 🎉</h1>
        </div>
        <div class="content" style="padding: 20px; text-align: center;">
          <h2>${promoData.title || "Special Promo for You!"}</h2>
          <p>${promoData.description || "Get discount on your next purchase!"}</p>
          <div class="promo-code">${promoData.code}</div>
          <div style="margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/shop" class="button">Shop Now</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 Fusion Heart</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: '"Fusion Heart Promo" <promo@fusionheart.com>',
    to: email,
    subject: promoData.subject || "Special Promo from Fusion Heart!",
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`📧 Promo email sent to ${email}`);
  console.log(`🔗 Preview: ${previewUrl}`);

  return { info, previewUrl };
};
