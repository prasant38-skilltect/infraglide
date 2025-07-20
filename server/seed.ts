import { storage } from "./storage";
import bcrypt from "bcryptjs";

async function seedDatabase() {
  try {
    console.log("🌱 Seeding database...");

    // Check if admin user already exists
    const existingUsers = await storage.getUsers();
    const adminExists = existingUsers.some(user => user.username === "admin");

    if (!adminExists) {
      // Create admin user
      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      await storage.createUser({
        email: "admin@infraglide.com",
        username: "admin",
        firstName: "Admin",
        lastName: "User",
        passwordHash: hashedPassword,
        authProvider: "local",
        isActive: true,
        isAdmin: true,
      });

      console.log("✅ Created admin user: admin / admin123");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Check if demo user already exists
    const demoExists = existingUsers.some(user => user.username === "demo");

    if (!demoExists) {
      // Create demo user
      const hashedPassword = await bcrypt.hash("demo123", 10);
      
      await storage.createUser({
        email: "demo@infraglide.com",
        username: "demo",
        firstName: "Demo",
        lastName: "User",
        passwordHash: hashedPassword,
        authProvider: "local",
        isActive: true,
        isAdmin: false,
      });

      console.log("✅ Created demo user: demo / demo123");
    } else {
      console.log("ℹ️  Demo user already exists");
    }

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0));
}

export { seedDatabase };