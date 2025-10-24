import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function addDemoUsers() {
    console.log("🔐 Adding demo users with Better Auth credentials...");

    try {
        const users = [
            {
                email: "owner@kennel.com",
                password: "owner123",
                name: "Kennel Owner",
                role: UserRole.OWNER,
            },
            {
                email: "admin@kennel.com",
                password: "admin123",
                name: "Kennel Admin",
                role: UserRole.ADMIN,
            },
            {
                email: "staff@kennel.com",
                password: "staff123",
                name: "Kennel Staff",
                role: UserRole.STAFF,
            },
            {
                email: "customer@example.com",
                password: "customer123",
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

            const passwordHash = await hashPassword(userData.password);

            await prisma.account.upsert({
                where: {
                    provider_providerAccountId: {
                        provider: "credential",
                        providerAccountId: user.id,
                    },
                },
                update: {
                    password: passwordHash,
                    type: "credentials",
                },
                create: {
                    userId: user.id,
                    type: "credentials",
                    provider: "credential",
                    providerAccountId: user.id,
                    password: passwordHash,
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
		console.log(
			"\n💡 Note: For full authentication, implement Better Auth sign-in flow",
		);
	} catch (error) {
		console.error("❌ Error adding demo users:", error);
	} finally {
		await prisma.$disconnect();
	}
}

addDemoUsers();
