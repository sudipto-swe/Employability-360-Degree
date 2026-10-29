/**
 * Database Seed Script
 * 
 * Seeds the database with initial categories and demo data.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Software Engineering", slug: "software-engineering", icon: "💻" },
  { name: "Data Science & Analytics", slug: "data-science", icon: "📊" },
  { name: "Product & Design", slug: "product-design", icon: "🎨" },
  { name: "Marketing & Sales", slug: "marketing-sales", icon: "📈" },
  { name: "Finance & Accounting", slug: "finance-accounting", icon: "💰" },
  { name: "Human Resources", slug: "human-resources", icon: "👥" },
  { name: "Operations & Logistics", slug: "operations-logistics", icon: "🔧" },
  { name: "Customer Support", slug: "customer-support", icon: "🎧" },
  { name: "Healthcare", slug: "healthcare", icon: "🏥" },
  { name: "Education & Training", slug: "education-training", icon: "📚" },
  { name: "Content & Writing", slug: "content-writing", icon: "✍️" },
  { name: "Legal", slug: "legal", icon: "⚖️" },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // Seed Categories
  console.log("📂 Creating categories...");
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`   ✅ Created ${CATEGORIES.length} categories\n`);

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
