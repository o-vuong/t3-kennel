import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create owner user
  const owner = await prisma.user.upsert({
    where: { email: "owner@kennel.com" },
    update: {},
    create: {
      email: "owner@kennel.com",
      name: "Kennel Owner",
      role: UserRole.OWNER,
      emailVerified: true,
      phone: "+1-555-0123",
      address: "123 Main St, City, State 12345",
    },
  });

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@kennel.com" },
    update: {},
    create: {
      email: "admin@kennel.com",
      name: "Kennel Admin",
      role: UserRole.ADMIN,
      emailVerified: true,
      phone: "+1-555-0124",
      address: "456 Admin Ave, City, State 12345",
    },
  });

  // Create staff user
  const staff = await prisma.user.upsert({
    where: { email: "staff@kennel.com" },
    update: {},
    create: {
      email: "staff@kennel.com",
      name: "Kennel Staff",
      role: UserRole.STAFF,
      emailVerified: true,
      phone: "+1-555-0125",
      address: "789 Staff St, City, State 12345",
    },
  });

  // Create customer user
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "John Customer",
      role: UserRole.CUSTOMER,
      emailVerified: true,
      phone: "+1-555-0126",
      address: "321 Customer Ct, City, State 12345",
    },
  });

  // Create kennels
  const kennels = await Promise.all([
    prisma.kennel.upsert({
      where: { id: "kennel-1" },
      update: {},
      create: {
        id: "kennel-1",
        name: "Small Kennel #1",
        size: "small",
        description: "Perfect for small dogs up to 25 lbs",
        price: 35.00,
      },
    }),
    prisma.kennel.upsert({
      where: { id: "kennel-2" },
      update: {},
      create: {
        id: "kennel-2",
        name: "Medium Kennel #1",
        size: "medium",
        description: "Ideal for medium dogs 25-50 lbs",
        price: 45.00,
      },
    }),
    prisma.kennel.upsert({
      where: { id: "kennel-3" },
      update: {},
      create: {
        id: "kennel-3",
        name: "Large Kennel #1",
        size: "large",
        description: "Spacious for large dogs 50-75 lbs",
        price: 55.00,
      },
    }),
    prisma.kennel.upsert({
      where: { id: "kennel-4" },
      update: {},
      create: {
        id: "kennel-4",
        name: "XL Kennel #1",
        size: "xlarge",
        description: "Extra large for dogs over 75 lbs",
        price: 65.00,
      },
    }),
  ]);

  // Create pets for customer
  const pets = await Promise.all([
    prisma.pet.upsert({
      where: { id: "pet-1" },
      update: {},
      create: {
        id: "pet-1",
        name: "Buddy",
        breed: "Golden Retriever",
        weight: 65,
        age: 3,
        vaccinations: ["Rabies", "DHPP", "Bordetella"],
        medicalNotes: "Friendly and well-behaved. No allergies.",
        ownerId: customer.id,
      },
    }),
    prisma.pet.upsert({
      where: { id: "pet-2" },
      update: {},
      create: {
        id: "pet-2",
        name: "Luna",
        breed: "Border Collie",
        weight: 40,
        age: 2,
        vaccinations: ["Rabies", "DHPP"],
        medicalNotes: "Very active. Needs daily exercise.",
        ownerId: customer.id,
      },
    }),
    prisma.pet.upsert({
      where: { id: "pet-3" },
      update: {},
      create: {
        id: "pet-3",
        name: "Max",
        breed: "Beagle",
        weight: 25,
        age: 5,
        vaccinations: ["Rabies", "DHPP", "Bordetella", "Lyme"],
        medicalNotes: "Senior dog. Takes daily medication for arthritis.",
        ownerId: customer.id,
      },
    }),
  ]);

  // Create sample bookings
  const bookings = await Promise.all([
    prisma.booking.upsert({
      where: { id: "booking-1" },
      update: {},
      create: {
        id: "booking-1",
        petId: pets[0].id,
        kennelId: kennels[2].id, // Large kennel
        startDate: new Date("2024-12-15T10:00:00Z"),
        endDate: new Date("2024-12-17T16:00:00Z"),
        price: 110.00,
        status: "CONFIRMED",
        customerId: customer.id,
        creatorId: customer.id,
        notes: "First time boarding. Very friendly dog.",
      },
    }),
    prisma.booking.upsert({
      where: { id: "booking-2" },
      update: {},
      create: {
        id: "booking-2",
        petId: pets[1].id,
        kennelId: kennels[1].id, // Medium kennel
        startDate: new Date("2024-12-20T10:00:00Z"),
        endDate: new Date("2024-12-22T16:00:00Z"),
        price: 90.00,
        status: "PENDING",
        customerId: customer.id,
        creatorId: customer.id,
        notes: "Needs extra exercise time.",
      },
    }),
  ]);

  // Create sample care logs
  await Promise.all([
    prisma.careLog.create({
      data: {
        bookingId: bookings[0].id,
        type: "feeding",
        note: "Ate all breakfast. Good appetite.",
        staffId: staff.id,
        timestamp: new Date("2024-12-15T08:00:00Z"),
      },
    }),
    prisma.careLog.create({
      data: {
        bookingId: bookings[0].id,
        type: "exercise",
        note: "30-minute play session in the yard. Very energetic.",
        staffId: staff.id,
        timestamp: new Date("2024-12-15T14:00:00Z"),
      },
    }),
    prisma.careLog.create({
      data: {
        bookingId: bookings[0].id,
        type: "medication",
        note: "Administered daily vitamins as requested.",
        staffId: staff.id,
        timestamp: new Date("2024-12-15T18:00:00Z"),
      },
    }),
  ]);

  // Create sample notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: customer.id,
        type: "booking_confirmation",
        title: "Booking Confirmed",
        message: "Your booking for Buddy has been confirmed for Dec 15-17, 2024.",
        payload: {
          bookingId: bookings[0].id,
          petName: pets[0].name,
        },
      },
    }),
    prisma.notification.create({
      data: {
        userId: customer.id,
        type: "payment_reminder",
        title: "Payment Due",
        message: "Payment for Luna's upcoming booking is due by Dec 18, 2024.",
        payload: {
          bookingId: bookings[1].id,
          amount: 90.00,
        },
      },
    }),
  ]);

  // Create audit logs for initial setup
  await Promise.all([
    prisma.auditLog.create({
      data: {
        actorId: owner.id,
        action: "CREATE",
        target: "system:initialization",
        meta: {
          action: "seed_database",
          timestamp: new Date().toISOString(),
        },
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "CREATE",
        target: "user:setup",
        meta: {
          action: "create_sample_data",
          timestamp: new Date().toISOString(),
        },
      },
    }),
  ]);

  console.log("✅ Database seeded successfully!");
  console.log("👤 Users created:");
  console.log(`   Owner: ${owner.email}`);
  console.log(`   Admin: ${admin.email}`);
  console.log(`   Staff: ${staff.email}`);
  console.log(`   Customer: ${customer.email}`);
  console.log(`🏠 Kennels created: ${kennels.length}`);
  console.log(`🐕 Pets created: ${pets.length}`);
  console.log(`📅 Bookings created: ${bookings.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
