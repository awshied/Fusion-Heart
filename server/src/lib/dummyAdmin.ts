import prisma from "./database";
import { hashPassword } from "./hash.utils";

const createAdmin = async () => {
  try {
    const adminEmail = "admincontrol01@fusionheart.co.id";
    const adminPassword = "admin01_12345";

    const hashedPassword = await hashPassword(adminPassword);

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: hashedPassword,
        name: "Chiko Orion",
        phone: "081234567890",
        role: "ADMIN",
      },
    });

    console.log("✅ Admin user created:", admin.email);
    console.log("📝 Password:", adminPassword);
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await prisma.$disconnect();
  }
};

createAdmin();
