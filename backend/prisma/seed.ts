import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

declare const process: any;

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@gmail.com";
  const hashedPassword = await bcrypt.hash("admin@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.SUPER_ADMIN,
    },
    create: {
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log(`Admin user created/updated: ${admin.email} (Role: ${admin.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
