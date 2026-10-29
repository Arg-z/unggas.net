import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const code = process.argv[2];
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const fn = new AsyncFunction("prisma", code);
await fn(prisma);
await prisma.$disconnect();
