const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log("DB connected successfully", result);
  } catch (e) {
    console.error("DB connection failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
