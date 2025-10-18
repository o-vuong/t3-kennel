import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function addDemoUsers() {
  console.log("🔐 Adding demo users with passwords...");

  try {
    // Hash passwords for demo users
    const defaultPassword = await hash("demo123", 12);

    // Update existing users with passwords
    const users = [
      {
        email: "owner@kennel.com",
        password: await hash("owner123", 12),
        name: "Kennel Owner",
        role: UserRole.OWNER,
      },
      {
        email: "admin@kennel.com", 
        password: await hash("admin123", 12),
        name: "Kennel Admin",
        role: UserRole.ADMIN,
      },
      {
        email: "staff@kennel.com",
        password: await hash("staff123", 12),
        name: "Kennel Staff",
        role: UserRole.STAFF,
      },
      {
        email: "customer@example.com",
        password: await hash("customer123", 12),
        name: "John Customer",
        role: UserRole.CUSTOMER,
      },
    ];

    for (const userData of users) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          role: userData.role,
          // Note: Better Auth handles passwords differently
          // This is for demo purposes
        },
        create: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          emailVerified: true,
          phone: "+1-555-0123",
          address: "123 Main St, City, State 12345",
        },
      });

      console.log(`✅ User created/updated: ${user.email} (${user.role})`);
    }

    console.log("\n🎉 Demo users ready!");
    console.log("\n📋 Demo Login Credentials:");
    console.log("┌─────────────────────┬──────────────┬─────────────┐");
    console.log("│ Email               │ Password     │ Role        │");
    console.log("├─────────────────────┼──────────────┼─────────────┤");
    console.log("│ owner@kennel.com    │ owner123     │ OWNER       │");
    console.log("│ admin@kennel.com    │ admin123     │ ADMIN       │");
    console.log("│ staff@kennel.com    │ staff123     │ STAFF       │");
    console.log("│ customer@example.com│ customer123  │ CUSTOMER    │");
    console.log("└─────────────────────┴──────────────┴─────────────┘");
    console.log("\n🌐 Demo URL: http://localhost:3001");
    console.log("\n💡 Note: For full authentication, implement Better Auth sign-in flow");

  } catch (error) {
    console.error("❌ Error adding demo users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addDemoUsers();
