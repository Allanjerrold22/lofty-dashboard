import { NextResponse } from "next/server";
import { INSFORGE_API_KEY, INSFORGE_BASE_URL, insforge, isDbEnabled } from "@/lib/insforge";

export const dynamic = "force-dynamic";

// ---------- Table schemas ----------
const TABLES = [
  {
    tableName: "leads",
    columns: [
      { name: "name", type: "string", nullable: false },
      { name: "first_name", type: "string", nullable: true },
      { name: "last_name", type: "string", nullable: true },
      { name: "email", type: "string", nullable: true },
      { name: "phone", type: "string", nullable: true },
      { name: "address", type: "string", nullable: true },
      { name: "source", type: "string", nullable: false },
      { name: "score", type: "integer", nullable: false },
      { name: "tags", type: "json", nullable: true },
      { name: "priority", type: "string", nullable: true, defaultValue: "normal" },
      { name: "pipeline_stage", type: "string", nullable: true },
      { name: "type", type: "string", nullable: true },
      { name: "score_color", type: "string", nullable: true },
      { name: "created_at", type: "datetime", nullable: true },
    ],
  },
  {
    tableName: "tasks",
    columns: [
      { name: "title", type: "string", nullable: false },
      { name: "contact", type: "string", nullable: false },
      { name: "time", type: "string", nullable: true, defaultValue: "Anytime" },
      { name: "done", type: "boolean", nullable: false, defaultValue: "false" },
      { name: "priority", type: "string", nullable: true, defaultValue: "normal" },
      { name: "created_at", type: "datetime", nullable: true },
    ],
  },
  {
    tableName: "appointments",
    columns: [
      { name: "person", type: "string", nullable: false },
      { name: "time", type: "string", nullable: false },
      { name: "note", type: "string", nullable: true },
      { name: "done", type: "boolean", nullable: false, defaultValue: "false" },
      { name: "created_at", type: "datetime", nullable: true },
    ],
  },
  {
    tableName: "transactions",
    columns: [
      { name: "address", type: "string", nullable: false },
      { name: "warning", type: "string", nullable: true },
      { name: "type", type: "string", nullable: false },
      { name: "created_at", type: "datetime", nullable: true },
    ],
  },
] as const;

// ---------- Seed data ----------
const SEED_LEADS = [
  // From existing mock store
  { name: "Rob Adam", first_name: "Rob", last_name: "Adam", email: "rob.adam@gmail.com", phone: "408-555-0101", address: "3712 Oak Blvd, San Jose, CA 95101", source: "Facebook Ads", score: 88, tags: ["Buyer", "Seller"], priority: "high", pipeline_stage: "Showing", type: "Buyer/Seller", score_color: "bg-emerald-500" },
  { name: "Michael Scott", first_name: "Michael", last_name: "Scott", email: "mscott@dundermifflin.com", phone: "408-555-0102", address: "1725 Slough Ave, Scranton, PA 18501", source: "Website", score: 48, tags: ["Buyer"], priority: "normal", pipeline_stage: "Qualified", type: "Buyer", score_color: "bg-amber-500" },
  { name: "Jessica Philips", first_name: "Jessica", last_name: "Philips", email: "j.philips@outlook.com", phone: "650-555-0103", address: "88 Marina Blvd, San Francisco, CA 94123", source: "Website", score: 61, tags: ["Buyer", "Seller", "Investor"], priority: "normal", pipeline_stage: "Offer", type: "Investor", score_color: "bg-neutral-700" },
  // 22 additional leads from Numbers file (real estate CRM leads)
  { name: "Ryan Mitchell", first_name: "Ryan", last_name: "Mitchell", email: "ryan.mitchell@gmail.com", phone: "415-555-0104", address: "204 Maple St, Palo Alto, CA 94301", source: "Zillow", score: 74, tags: ["Buyer"], priority: "high", pipeline_stage: "Showing", type: "Buyer", score_color: "bg-emerald-500" },
  { name: "Mike Patterson", first_name: "Mike", last_name: "Patterson", email: "mikepaterson@yahoo.com", phone: "510-555-0105", address: "3344 Hillside Dr, Oakland, CA 94602", source: "Referral", score: 55, tags: ["Buyer"], priority: "normal", pipeline_stage: "Leads", type: "Buyer", score_color: "bg-amber-500" },
  { name: "John Nguyen", first_name: "John", last_name: "Nguyen", email: "john.nguyen@hotmail.com", phone: "408-555-0106", address: "900 Blossom Hill Rd, San Jose, CA 95123", source: "Open House", score: 82, tags: ["Seller"], priority: "high", pipeline_stage: "Qualified", type: "Seller", score_color: "bg-emerald-500" },
  { name: "Matt Williams", first_name: "Matt", last_name: "Williams", email: "matt.w@gmail.com", phone: "415-555-0107", address: "1580 Bryant St, San Francisco, CA 94103", source: "Website", score: 40, tags: ["Buyer"], priority: "low", pipeline_stage: "Leads", type: "Buyer", score_color: "bg-neutral-700" },
  { name: "Rebecca Torres", first_name: "Rebecca", last_name: "Torres", email: "rebecca.torres@gmail.com", phone: "650-555-0108", address: "77 Ocean Ave, Pacifica, CA 94044", source: "Facebook Ads", score: 66, tags: ["Buyer", "Investor"], priority: "normal", pipeline_stage: "Showing", type: "Buyer", score_color: "bg-neutral-700" },
  { name: "Stephen Chen", first_name: "Stephen", last_name: "Chen", email: "stephen.chen@icloud.com", phone: "408-555-0109", address: "2190 Saratoga Ave, Santa Clara, CA 95051", source: "Zillow", score: 91, tags: ["Seller"], priority: "high", pipeline_stage: "Offer", type: "Seller", score_color: "bg-emerald-500" },
  { name: "Cory Johnson", first_name: "Cory", last_name: "Johnson", email: "cory.j@outlook.com", phone: "510-555-0110", address: "630 Grand Ave, Oakland, CA 94610", source: "Referral", score: 35, tags: ["Buyer"], priority: "low", pipeline_stage: "Leads", type: "Buyer", score_color: "bg-neutral-700" },
  { name: "Robert Kim", first_name: "Robert", last_name: "Kim", email: "rkim@gmail.com", phone: "415-555-0111", address: "400 Larkin St, San Francisco, CA 94102", source: "Website", score: 78, tags: ["Buyer", "Seller"], priority: "high", pipeline_stage: "Qualified", type: "Buyer/Seller", score_color: "bg-emerald-500" },
  { name: "Alex Ramirez", first_name: "Alex", last_name: "Ramirez", email: "alex.ramirez@yahoo.com", phone: "408-555-0112", address: "1440 Meridian Ave, San Jose, CA 95125", source: "Open House", score: 59, tags: ["Buyer"], priority: "normal", pipeline_stage: "Showing", type: "Buyer", score_color: "bg-amber-500" },
  { name: "Lindsay Park", first_name: "Lindsay", last_name: "Park", email: "lindsay.park@gmail.com", phone: "650-555-0113", address: "10 Bayview Dr, Millbrae, CA 94030", source: "Facebook Ads", score: 70, tags: ["Buyer", "Investor"], priority: "normal", pipeline_stage: "Qualified", type: "Investor", score_color: "bg-emerald-500" },
  { name: "Adam Flores", first_name: "Adam", last_name: "Flores", email: "adam.flores@icloud.com", phone: "415-555-0114", address: "3621 18th St, San Francisco, CA 94114", source: "Referral", score: 83, tags: ["Seller"], priority: "high", pipeline_stage: "Offer", type: "Seller", score_color: "bg-emerald-500" },
  { name: "Jennifer Clark", first_name: "Jennifer", last_name: "Clark", email: "jclark@gmail.com", phone: "510-555-0115", address: "875 Bay Rd, Menlo Park, CA 94025", source: "Zillow", score: 52, tags: ["Buyer"], priority: "normal", pipeline_stage: "Leads", type: "Buyer", score_color: "bg-amber-500" },
  { name: "David Lee", first_name: "David", last_name: "Lee", email: "david.lee@hotmail.com", phone: "408-555-0116", address: "222 Santana Row, San Jose, CA 95128", source: "Website", score: 44, tags: ["Buyer"], priority: "low", pipeline_stage: "Leads", type: "Buyer", score_color: "bg-neutral-700" },
  { name: "Sarah Thompson", first_name: "Sarah", last_name: "Thompson", email: "sarah.t@outlook.com", phone: "650-555-0117", address: "588 Castro St, Mountain View, CA 94041", source: "Open House", score: 76, tags: ["Buyer", "Seller"], priority: "high", pipeline_stage: "Showing", type: "Buyer/Seller", score_color: "bg-emerald-500" },
  { name: "Carlos Martinez", first_name: "Carlos", last_name: "Martinez", email: "carlos.m@gmail.com", phone: "415-555-0118", address: "900 N Point St, San Francisco, CA 94109", source: "Facebook Ads", score: 61, tags: ["Buyer"], priority: "normal", pipeline_stage: "Qualified", type: "Buyer", score_color: "bg-neutral-700" },
  { name: "Amanda Wilson", first_name: "Amanda", last_name: "Wilson", email: "a.wilson@yahoo.com", phone: "408-555-0119", address: "770 Brokaw Rd, Santa Clara, CA 95050", source: "Referral", score: 87, tags: ["Seller", "Investor"], priority: "high", pipeline_stage: "Offer", type: "Investor", score_color: "bg-emerald-500" },
  { name: "Kevin Brown", first_name: "Kevin", last_name: "Brown", email: "kevin.brown@icloud.com", phone: "510-555-0120", address: "1200 Clay St, Oakland, CA 94612", source: "Zillow", score: 38, tags: ["Buyer"], priority: "low", pipeline_stage: "Leads", type: "Buyer", score_color: "bg-neutral-700" },
  { name: "Michelle Davis", first_name: "Michelle", last_name: "Davis", email: "mdavis@gmail.com", phone: "650-555-0121", address: "301 Forest Ave, Palo Alto, CA 94301", source: "Website", score: 72, tags: ["Buyer", "Seller"], priority: "normal", pipeline_stage: "Showing", type: "Buyer/Seller", score_color: "bg-emerald-500" },
  { name: "James Anderson", first_name: "James", last_name: "Anderson", email: "j.anderson@hotmail.com", phone: "415-555-0122", address: "3400 17th St, San Francisco, CA 94110", source: "Open House", score: 65, tags: ["Buyer"], priority: "normal", pipeline_stage: "Qualified", type: "Buyer", score_color: "bg-neutral-700" },
  { name: "Nicole Garcia", first_name: "Nicole", last_name: "Garcia", email: "nicole.garcia@outlook.com", phone: "408-555-0123", address: "1818 Willow St, San Jose, CA 95125", source: "Facebook Ads", score: 80, tags: ["Seller"], priority: "high", pipeline_stage: "Offer", type: "Seller", score_color: "bg-emerald-500" },
  { name: "Brian Martinez", first_name: "Brian", last_name: "Martinez", email: "brian.m@gmail.com", phone: "510-555-0124", address: "666 Broadway, Oakland, CA 94607", source: "Referral", score: 49, tags: ["Buyer", "Investor"], priority: "normal", pipeline_stage: "Leads", type: "Investor", score_color: "bg-amber-500" },
  { name: "Lauren Taylor", first_name: "Lauren", last_name: "Taylor", email: "lauren.t@icloud.com", phone: "650-555-0125", address: "2450 El Camino Real, Santa Clara, CA 95051", source: "Zillow", score: 93, tags: ["Buyer", "Seller"], priority: "high", pipeline_stage: "Closed", type: "Buyer/Seller", score_color: "bg-emerald-500" },
];

const SEED_TASKS = [
  { title: "Call back for more information", contact: "Rob Adams", time: "10:00 AM", done: false, priority: "high" },
  { title: "Call Back", contact: "James Adam", time: "Anytime", done: true, priority: "normal" },
  { title: "Spanish-speaking follow up", contact: "Michael Scott", time: "12:00 PM", done: false, priority: "normal" },
  { title: "Text contract reminder", contact: "Dav Smith", time: "2:00 PM", done: false, priority: "normal" },
  { title: "Schedule showing at 204 Maple St", contact: "Ryan Mitchell", time: "3:00 PM", done: false, priority: "high" },
  { title: "Send comp report", contact: "Stephen Chen", time: "11:00 AM", done: false, priority: "high" },
  { title: "Follow up on offer terms", contact: "Adam Flores", time: "4:00 PM", done: false, priority: "high" },
];

const SEED_APPOINTMENTS = [
  { person: "William Johnson, Annie Campbell", time: "11:00 AM – 2:00 PM", note: "Discuss the showing details from last Friday.", done: false },
  { person: "Maria Lopez", time: "3:00 PM – 3:30 PM", note: "Quick call to align on offer terms.", done: false },
  { person: "Daniel Park", time: "4:00 PM – 5:00 PM", note: "Walkthrough at 87 Valencia ST.", done: true },
  { person: "Ryan Mitchell", time: "9:00 AM – 10:00 AM", note: "First showing at 204 Maple St, Palo Alto.", done: false },
  { person: "Nicole Garcia", time: "1:00 PM – 1:30 PM", note: "Review listing agreement for 1818 Willow St.", done: false },
];

const SEED_TRANSACTIONS = [
  { address: "3931 Via Montalvo, Campbell, CA 95008", warning: "2 tasks near deadline", type: "deadline" },
  { address: "87 Valencia ST, Half Moon Bay, CA 94019", warning: "Escrow doc missing", type: "deadline" },
  { address: "2118 Thornridge Cir, Syracuse, CT 35624", warning: "Near offer date", type: "caution" },
  { address: "26096 Dougherty Pl, Carmel, CA 93923", warning: "Closing in 4 days", type: "caution" },
  { address: "204 Maple St, Palo Alto, CA 94301", warning: "Inspection report pending", type: "caution" },
];

async function createTable(tableName: string, columns: object[], rlsEnabled = false) {
  const res = await fetch(`${INSFORGE_BASE_URL}/api/database/tables`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": INSFORGE_API_KEY,
    },
    body: JSON.stringify({ tableName, columns, rlsEnabled }),
  });
  const body = await res.json();
  return { ok: res.ok, status: res.status, body };
}

export async function POST() {
  if (!isDbEnabled) {
    return NextResponse.json({ error: "InsForge not configured. Set INSFORGE_BASE_URL, INSFORGE_ANON_KEY, and INSFORGE_API_KEY in .env.local." }, { status: 503 });
  }

  const results: Record<string, unknown> = {};

  // 1. Create tables (ignore "already exists" errors)
  for (const table of TABLES) {
    const r = await createTable(table.tableName, table.columns);
    results[`create_${table.tableName}`] = r.ok ? "created" : (r.body?.message ?? r.status);
  }

  // 2. Seed leads
  const { error: leadsErr } = await insforge.database
    .from("leads")
    .insert(SEED_LEADS.map((l) => ({ ...l, tags: JSON.stringify(l.tags), created_at: new Date().toISOString() })));
  results.seed_leads = leadsErr ? `error: ${leadsErr.message}` : `${SEED_LEADS.length} rows inserted`;

  // 3. Seed tasks
  const { error: tasksErr } = await insforge.database
    .from("tasks")
    .insert(SEED_TASKS.map((t) => ({ ...t, created_at: new Date().toISOString() })));
  results.seed_tasks = tasksErr ? `error: ${tasksErr.message}` : `${SEED_TASKS.length} rows inserted`;

  // 4. Seed appointments
  const { error: aptsErr } = await insforge.database
    .from("appointments")
    .insert(SEED_APPOINTMENTS.map((a) => ({ ...a, created_at: new Date().toISOString() })));
  results.seed_appointments = aptsErr ? `error: ${aptsErr.message}` : `${SEED_APPOINTMENTS.length} rows inserted`;

  // 5. Seed transactions
  const { error: txErr } = await insforge.database
    .from("transactions")
    .insert(SEED_TRANSACTIONS.map((t) => ({ ...t, created_at: new Date().toISOString() })));
  results.seed_transactions = txErr ? `error: ${txErr.message}` : `${SEED_TRANSACTIONS.length} rows inserted`;

  return NextResponse.json({ ok: true, results });
}
