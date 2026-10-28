// Demo records for showing the CRM (used by `npm run db:seed`).
//
// Why dates are written as "days ago" / "due in N days" instead of real dates:
// the demo should always look current. buildDemoRecords.ts turns these numbers
// into real dates counted from the day the seed runs (in Asia/Kolkata).
//
// How demo data is recognised: every demo customer's email ends with
// DEMO_EMAIL_ENDING. ".example" is a reserved domain ending that can never
// belong to a real company, so real customers are never mistaken for demo ones.
import type { CustomerStatusName } from "../customers/customerValidation.js";
import type {
  FollowUpPriorityName,
  FollowUpStatusName,
} from "../followUps/followUpValidation.js";
import type { InteractionTypeName } from "../interactions/interactionValidation.js";

export const DEMO_EMAIL_ENDING = ".example";

export type DemoInteraction = {
  type: InteractionTypeName;
  summary: string;
  daysAgo: number; // 0 = today
  time: string; // "HH:MM" in India, e.g. "10:30"
};

export type DemoFollowUp = {
  title: string;
  dueInDays: number; // negative = overdue, 0 = due today
  status: FollowUpStatusName;
  priority: FollowUpPriorityName;
  notes: string | null;
};

export type DemoCustomer = {
  companyName: string;
  contactName: string;
  website: string;
  industry: string;
  status: CustomerStatusName;
  email: string; // must end with DEMO_EMAIL_ENDING
  phone: string;
  notes: string;
  addedDaysAgo: number; // when the customer was "created"
  interactions: DemoInteraction[];
  followUps: DemoFollowUp[];
};

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  {
    companyName: "Sunrise Multispeciality Hospital",
    contactName: "Priya Raman",
    website: "sunrisehospital.example",
    industry: "Healthcare",
    status: "ACTIVE",
    email: "priya.raman@sunrisehospital.example",
    phone: "+91 90000 00001",
    notes: "Managed IT support for 3 branches.\nNeeds 24x7 helpdesk for the ICU systems.",
    addedDaysAgo: 13,
    interactions: [
      { type: "MEETING", summary: "Kick-off meeting: agreed scope for network upgrade at the main branch", daysAgo: 13, time: "11:00" },
      { type: "CALL", summary: "Reported slow Wi-Fi in the OPD wing; scheduled a site survey", daysAgo: 8, time: "15:30" },
      { type: "EMAIL", summary: "Sent site survey report and quote for 12 new access points", daysAgo: 4, time: "10:15" },
      { type: "CALL", summary: "Priya approved the quote; waiting for purchase order", daysAgo: 1, time: "12:45" },
    ],
    followUps: [
      { title: "Collect purchase order for access points", dueInDays: 0, status: "OPEN", priority: "HIGH", notes: "Finance team said it would be signed today." },
      { title: "Plan weekend installation window", dueInDays: 4, status: "OPEN", priority: "MEDIUM", notes: null },
      { title: "Send signed support contract (SLA) copy", dueInDays: -6, status: "OPEN", priority: "LOW", notes: null },
    ],
  },
  {
    companyName: "Greenfield Public School",
    contactName: "Arjun Mehta",
    website: "greenfieldschool.example",
    industry: "Education",
    status: "ACTIVE",
    email: "arjun.mehta@greenfieldschool.example",
    phone: "+91 90000 00002",
    notes: "Computer lab with 40 PCs and a small office network.",
    addedDaysAgo: 12,
    interactions: [
      { type: "CALL", summary: "Asked about antivirus renewal for the computer lab", daysAgo: 12, time: "09:30" },
      { type: "EMAIL", summary: "Shared renewal options for 40 antivirus licences", daysAgo: 11, time: "14:00" },
      { type: "NOTE", summary: "School prefers a 2-year licence to lock in the price", daysAgo: 6, time: "16:20" },
    ],
    followUps: [
      { title: "Send final invoice for antivirus renewal", dueInDays: -3, status: "OPEN", priority: "MEDIUM", notes: null },
      { title: "Confirm lab PC count with Arjun", dueInDays: -8, status: "DONE", priority: "LOW", notes: "Confirmed: 40 PCs." },
    ],
  },
  {
    companyName: "Swift Cargo Logistics",
    contactName: "Kavya Nair",
    website: "swiftcargo.example",
    industry: "Logistics",
    status: "ACTIVE",
    email: "kavya.nair@swiftcargo.example",
    phone: "+91 90000 00003",
    notes: "Warehouse scanners and a fleet tracking server.",
    addedDaysAgo: 10,
    interactions: [
      { type: "MEETING", summary: "Discussed moving the tracking server to the cloud", daysAgo: 10, time: "11:30" },
      { type: "EMAIL", summary: "Sent cloud migration proposal with monthly cost estimate", daysAgo: 7, time: "17:10" },
      { type: "CALL", summary: "Kavya asked for a backup plan in case the migration fails", daysAgo: 3, time: "10:00" },
      { type: "NOTE", summary: "Warehouse scanner batteries are failing; offer replacement bundle", daysAgo: 0, time: "09:15" },
    ],
    followUps: [
      { title: "Send rollback plan for cloud migration", dueInDays: -1, status: "OPEN", priority: "HIGH", notes: "Kavya needs this before the board meeting." },
      { title: "Quote for scanner battery replacement", dueInDays: 6, status: "OPEN", priority: "LOW", notes: null },
    ],
  },
  {
    companyName: "Lotus Cooperative Bank",
    contactName: "Rahul Iyer",
    website: "lotusbank.example",
    industry: "Banking & Finance",
    status: "ACTIVE",
    email: "rahul.iyer@lotusbank.example",
    phone: "+91 90000 00004",
    notes: "Strict security rules: all visits must be booked 2 days ahead.",
    addedDaysAgo: 9,
    interactions: [
      { type: "MEETING", summary: "Security audit review: firewall rules need updating", daysAgo: 9, time: "10:30" },
      { type: "EMAIL", summary: "Shared the list of firewall changes for approval", daysAgo: 5, time: "13:40" },
      { type: "CALL", summary: "Rahul approved the changes for this weekend", daysAgo: 2, time: "16:05" },
    ],
    followUps: [
      { title: "Apply approved firewall changes", dueInDays: 2, status: "OPEN", priority: "HIGH", notes: "Book the visit with the branch manager first." },
      { title: "Send audit summary report", dueInDays: -2, status: "DONE", priority: "MEDIUM", notes: null },
    ],
  },
  {
    companyName: "Bluewave Textiles",
    contactName: "Sneha Kulkarni",
    website: "bluewavetextiles.example",
    industry: "Manufacturing",
    status: "ACTIVE",
    email: "sneha.kulkarni@bluewavetextiles.example",
    phone: "+91 90000 00005",
    notes: "Factory floor PCs run the production planning software.",
    addedDaysAgo: 7,
    interactions: [
      { type: "CALL", summary: "Production planning PC crashed; remote fix done in 30 minutes", daysAgo: 7, time: "08:50" },
      { type: "NOTE", summary: "Three factory PCs are 8 years old; suggest replacement", daysAgo: 6, time: "12:00" },
      { type: "EMAIL", summary: "Sent quote for 3 replacement PCs with installation", daysAgo: 2, time: "11:25" },
    ],
    followUps: [
      { title: "Follow up on PC replacement quote", dueInDays: 1, status: "OPEN", priority: "MEDIUM", notes: null },
    ],
  },
  {
    companyName: "Orchid Hotels & Resorts",
    contactName: "Vikram Singh",
    website: "orchidhotels.example",
    industry: "Hospitality",
    status: "ACTIVE",
    email: "vikram.singh@orchidhotels.example",
    phone: "+91 90000 00006",
    notes: "Guest Wi-Fi and front desk systems at 2 resorts.",
    addedDaysAgo: 5,
    interactions: [
      { type: "MEETING", summary: "Site visit: guests complain about Wi-Fi in the pool area", daysAgo: 5, time: "15:00" },
      { type: "EMAIL", summary: "Proposed outdoor access points for the pool and garden", daysAgo: 3, time: "18:30" },
      { type: "CALL", summary: "Vikram wants the work done before the holiday season", daysAgo: 0, time: "11:10" },
    ],
    followUps: [
      { title: "Book outdoor Wi-Fi installation", dueInDays: 0, status: "OPEN", priority: "HIGH", notes: "Must finish before the holiday rush." },
      { title: "Check front desk printer warranty", dueInDays: 9, status: "OPEN", priority: "LOW", notes: null },
    ],
  },
  {
    companyName: "Northstar Legal Associates",
    contactName: "Ananya Das",
    website: "northstarlegal.example",
    industry: "Legal",
    status: "INACTIVE",
    email: "ananya.das@northstarlegal.example",
    phone: "+91 90000 00007",
    notes: "Support contract ended last month. May renew next year.",
    addedDaysAgo: 4,
    interactions: [
      { type: "CALL", summary: "Ananya confirmed they will not renew this year", daysAgo: 4, time: "14:20" },
      { type: "NOTE", summary: "Keep in touch: they may need a document server next year", daysAgo: 4, time: "14:45" },
    ],
    followUps: [
      { title: "Check in about renewing the support contract", dueInDays: 12, status: "OPEN", priority: "LOW", notes: null },
    ],
  },
  {
    companyName: "Pixel Retail Mart",
    contactName: "Mohammed Farhan",
    website: "pixelretail.example",
    industry: "Retail",
    status: "ACTIVE",
    email: "farhan@pixelretail.example",
    phone: "+91 90000 00008",
    notes: "5 stores, billing counters and CCTV.",
    addedDaysAgo: 2,
    interactions: [
      { type: "CALL", summary: "Billing counter at store 3 cannot print receipts", daysAgo: 2, time: "10:40" },
      { type: "EMAIL", summary: "Sent steps to reinstall the receipt printer driver", daysAgo: 1, time: "09:05" },
      { type: "MEETING", summary: "Demo of our managed CCTV monitoring service", daysAgo: 0, time: "09:45" },
    ],
    followUps: [
      { title: "Visit store 3 if the printer still fails", dueInDays: 0, status: "OPEN", priority: "MEDIUM", notes: null },
      { title: "Send CCTV monitoring proposal", dueInDays: 3, status: "OPEN", priority: "MEDIUM", notes: null },
    ],
  },
];
