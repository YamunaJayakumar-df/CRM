// Adds the demo customers, interactions and follow-ups to the database.
// Run it from the backend folder with:  npm run db:seed
//
// Safety rules:
//   - It only ADDS records; it never changes or deletes anything.
//   - If demo customers already exist (emails ending in ".example"), it stops,
//     so running it twice does not create duplicates.
//   - Everything is saved in ONE transaction: either all demo records are
//     saved, or (if anything fails) none are.
import "../env.js"; // must stay the first import: loads backend/.env
import { prisma } from "../db.js";
import { todayInKolkata } from "../shared/plainDate.js";
import { buildDemoRecords } from "./buildDemoRecords.js";
import { DEMO_CUSTOMERS, DEMO_EMAIL_ENDING } from "./demoData.js";

// Saving ~50 records to Supabase over the internet can take a few seconds;
// Prisma's default transaction time limit (5 seconds) may be too short.
const TRANSACTION_TIMEOUT_MS = 30_000;

async function seedDemoData(): Promise<void> {
  const existingDemoCustomers = await prisma.customer.count({
    where: { email: { endsWith: DEMO_EMAIL_ENDING } },
  });
  if (existingDemoCustomers > 0) {
    console.log(
      `Demo data is already there (${existingDemoCustomers} demo customers). Nothing was added.`,
    );
    return;
  }

  const today = todayInKolkata();
  const records = buildDemoRecords(DEMO_CUSTOMERS, today);

  await prisma.$transaction(
    async (tx) => {
      for (const record of records) {
        const { interactions, followUps, ...customer } = record;
        // A "nested create": the customer and its interactions and
        // follow-ups are saved together, already linked by customerId.
        await tx.customer.create({
          data: {
            ...customer,
            interactions: { create: interactions },
            followUps: { create: followUps },
          },
        });
      }
    },
    { timeout: TRANSACTION_TIMEOUT_MS },
  );

  const interactionCount = records.reduce(
    (sum, record) => sum + record.interactions.length,
    0,
  );
  const followUpCount = records.reduce(
    (sum, record) => sum + record.followUps.length,
    0,
  );
  console.log(`Demo data added (dates counted from ${today}, India time):`);
  console.log(`  ${records.length} customers`);
  console.log(`  ${interactionCount} interactions`);
  console.log(`  ${followUpCount} follow-ups`);
}

try {
  await seedDemoData();
} catch (error) {
  console.error("Could not add demo data. Nothing was saved.");
  console.error(error);
  process.exitCode = 1;
} finally {
  // Close the database connections so the script can finish.
  await prisma.$disconnect();
}
