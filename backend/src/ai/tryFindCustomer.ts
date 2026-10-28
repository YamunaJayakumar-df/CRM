// Step 2: see the whole customer search work on the real (demo) data.
// Run it from the backend folder with:  npm run ai:find
//
// For each name below: fetch candidates from the database (read only), rank
// them with reasons, and print every option plus "create new".
// No AI, no cost. Never writes to the database.
import "../env.js"; // must stay the first import: loads backend/.env
import { prisma } from "../db.js";
import { rankCustomerOptions, type NameToMatch } from "./customerMatching.js";
import { findCustomerCandidates } from "./findCustomerCandidates.js";

// Names as the AI might hear them. Change these to try your own.
const NAMES_TO_FIND: NameToMatch[] = [
  { companyName: "Sunrise Hospital", contactName: "Priya" },
  { companyName: "Greenfield School", contactName: null },
  { companyName: "Bluewave Logistics", contactName: "Arjun" },
  { companyName: "Orchid Hotels and Resorts Pvt Ltd", contactName: null },
  { companyName: "Nova Tech", contactName: "Kiran" },
];

try {
  for (const wanted of NAMES_TO_FIND) {
    const contact = wanted.contactName ? ` (contact: ${wanted.contactName})` : "";
    console.log("\n" + "=".repeat(70));
    console.log(`LOOKING FOR: ${wanted.companyName}${contact}\n`);

    const { candidates, moreMatches } = await findCustomerCandidates(wanted);
    const choices = rankCustomerOptions(wanted, candidates, moreMatches);

    if (choices.options.length === 0) {
      console.log("  No matching customers.");
    }
    choices.options.forEach((option, index) => {
      console.log(`  ${index + 1}. ${option.companyName}  [${option.strength}]  #${option.id}`);
      for (const reason of option.reasons) {
        console.log(`       - ${reason}`);
      }
    });
    if (choices.moreMatches) {
      console.log("  ... more customers match. Type a more exact name.");
    }
    const newContact = choices.createNew.contactName ? ` (contact: ${choices.createNew.contactName})` : "";
    console.log(`  +  Create new customer: ${choices.createNew.companyName}${newContact}`);
  }
} catch (error) {
  console.error("\nCould not search the database. Is DATABASE_URL in backend/.env correct?");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
