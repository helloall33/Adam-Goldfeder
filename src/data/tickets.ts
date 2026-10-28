import { dueDateFor } from "@/lib/sla";
import type { Category, Customer, Zone, Priority, Ticket, TicketSource, TicketStatus } from "@/lib/types";

// FICTIONAL customers. All phone numbers use 555 and all emails use ".example"
// domains, which can never belong to a real business.
// Which zone each (fictional) town is in.
const TOWN_ZONES: Record<string, Zone> = {
  Riverside: "North", "Cedar Falls": "North", Fairview: "South",
  Oakdale: "Central", Lakewood: "East", "Maple Grove": "West",
};
const withZone = (c: Omit<Customer, "zone">): Customer => ({ ...c, zone: TOWN_ZONES[c.address.split(", ").pop()!] });

const customers: Customer[] = ([
  { name: "Linda Park", company: "Harborview Medical Offices", address: "120 Harbor St, Riverside", phone: "(555) 310-0101", email: "lpark@harborviewmed.example" },
  { name: "Mike Delgado", company: "Delgado Auto Group", address: "4400 Route 9, Fairview", phone: "(555) 310-0102", email: "mike@delgadoauto.example" },
  { name: "Sarah Whitman", company: "Oakdale Public Library", address: "15 Library Ln, Oakdale", phone: "(555) 310-0103", email: "swhitman@oakdalelibrary.example" },
  { name: "James Ochoa", company: "Pinecrest Self Storage", address: "880 Industrial Pkwy, Lakewood", phone: "(555) 310-0104", email: "jochoa@pinecreststorage.example" },
  { name: "Emily Carter", company: "Brightside Dental", address: "52 Main St, Maple Grove", phone: "(555) 310-0105", email: "office@brightsidedental.example" },
  { name: "Robert Kim", company: "Kim's Jewelry & Watch", address: "9 Market Sq, Riverside", phone: "(555) 310-0106", email: "robert@kimsjewelry.example" },
  { name: "Angela Russo", company: "St. Brendan Elementary School", address: "300 School St, Cedar Falls", phone: "(555) 310-0107", email: "arusso@stbrendan.example" },
  { name: "Tony Nguyen", company: "Golden Wok Restaurant", address: "71 Elm Ave, Fairview", phone: "(555) 310-0108", email: "tony@goldenwok.example" },
  { name: "Patricia Lowe", company: "Lowe Property Management", address: "2200 Commerce Dr, Lakewood", phone: "(555) 310-0109", email: "plowe@lowepm.example" },
  { name: "David Schultz", company: "Northgate Manufacturing", address: "1 Northgate Way, Oakdale", phone: "(555) 310-0110", email: "dschultz@northgatemfg.example" },
  { name: "Grace Liu", company: "Summit Credit Union", address: "600 Summit Blvd, Maple Grove", phone: "(555) 310-0111", email: "gliu@summitcu.example" },
  { name: "Frank Moretti", company: "Moretti Wine & Spirits", address: "38 Church St, Cedar Falls", phone: "(555) 310-0112", email: "frank@morettiwine.example" },
  { name: "Keisha Daniels", company: "Riverside Senior Living", address: "455 River Rd, Riverside", phone: "(555) 310-0113", email: "kdaniels@riversidesenior.example" },
  { name: "Paul Anderson", company: "Anderson Law Offices", address: "18 Court St, Fairview", phone: "(555) 310-0114", email: "panderson@andersonlaw.example" },
  { name: "Maria Santos", company: "FreshMart Grocery #12", address: "1250 Center St, Lakewood", phone: "(555) 310-0115", email: "store12@freshmart.example" },
  { name: "Chris Bauer", company: "Bauer Logistics Warehouse", address: "77 Freight Rd, Cedar Falls", phone: "(555) 310-0116", email: "cbauer@bauerlogistics.example" },
  { name: "Nina Patel", company: "Patel Pharmacy", address: "210 Oak St, Oakdale", phone: "(555) 310-0117", email: "nina@patelpharmacy.example" },
  { name: "Greg Owens", company: "Iron Peak Fitness", address: "990 Gym Ln, Maple Grove", phone: "(555) 310-0118", email: "greg@ironpeakfit.example" },
] as Omit<Customer, "zone">[]).map(withZone);

const HOUR = 3600_000;

/** Builds one sample ticket. `hoursAgo` is when the request came in. */
function make(
  n: number,
  hoursAgo: number,
  status: TicketStatus,
  priority: Priority,
  category: Category,
  customerIndex: number,
  subject: string,
  description: string,
  extra: { tech?: string; review?: string; source?: TicketSource; doneHoursAfter?: number } = {},
  now = Date.now(),
): Ticket {
  const created = new Date(now - hoursAgo * HOUR);
  return {
    id: `SR-${n}`,
    createdAt: created.toISOString(),
    dueAt: dueDateFor(priority, created),
    completedAt:
      status === "Completed"
        ? new Date(created.getTime() + (extra.doneHoursAfter ?? 6) * HOUR).toISOString()
        : undefined,
    status,
    priority,
    category,
    customer: customers[customerIndex],
    subject,
    description,
    assignedTechId: extra.tech,
    needsReview: Boolean(extra.review),
    reviewReason: extra.review,
    source: extra.source ?? "Email",
    notes: [],
  };
}

/** Creates fresh demo tickets with dates relative to right now. */
export function createSeedTickets(): Ticket[] {
  return [
    // ── Brand new, waiting to be assigned ──
    make(1031, 0.5, "Pending", "Critical", "Burglar Alarm", 5, "Alarm panel showing tamper — store can't arm",
      "Our alarm panel has been beeping and shows 'TAMPER ZONE 3' since we opened. We cannot arm the system and we close at 9pm. We have a lot of inventory on site. Please send someone today.",
      { review: "Store cannot arm system tonight — high-value inventory unprotected." }),
    make(1030, 1.5, "Pending", "High", "Access Control", 10, "Front door card reader not accepting badges",
      "Staff badges are being rejected at the main lobby reader. Employees are being let in manually by the teller supervisor. Other readers seem fine."),
    make(1029, 2, "Pending", "Critical", "Fire Alarm", 12, "Fire panel trouble signal — residents worried",
      "Our fire alarm panel shows a trouble light and keeps chirping. Nurses are concerned. No smoke or fire, the building is fine, but we need it checked right away.",
      { review: "Life-safety system at a senior living facility. Confirm status with monitoring center." , source: "Phone" }),
    make(1028, 3, "Pending", "Medium", "Security Cameras", 3, "Two cameras offline at back fence",
      "Cameras 7 and 8 on the back fence line show 'no signal' on the recorder since the storm last night."),
    make(1027, 5, "Pending", "Low", "Intercom", 13, "Request quote: add video intercom at side entrance",
      "We'd like a quote to add a video intercom at our side entrance so the receptionist can buzz in clients."),
    make(1026, 7, "Pending", "Medium", "Alarm Communicator", 7, "Monitoring center says we're not checking in",
      "We got a letter that our alarm hasn't sent a test signal in a week. We switched internet providers recently, could that be it?"),

    // ── Assigned, not started yet ──
    make(1025, 10, "Assigned", "High", "Security Cameras", 14, "NVR not recording — shoplifting incident yesterday",
      "Manager tried to pull footage of a shoplifter yesterday and the recorder has nothing since last Tuesday. Need it fixed and need to know if footage can be recovered.",
      { tech: "T04" }),
    make(1024, 20, "Assigned", "Medium", "Access Control", 8, "Add 12 new tenants to access system",
      "New tenants moving into suite 300. Need 12 fobs programmed and added to the building schedule.",
      { tech: "T12" }),
    make(1023, 30, "Assigned", "Medium", "Burglar Alarm", 17, "Motion detector false alarms overnight",
      "We've had 3 false alarms this week from the motion sensor near the front desk. Police came once. We think it might be the new HVAC vent.",
      { tech: "T11" }),
    make(1022, 50, "Assigned", "Low", "Security Cameras", 1, "Adjust parking lot camera angle",
      "The new lot camera is pointed too high, mostly showing sky. Please re-aim when someone is in the area.",
      { tech: "T17" }),
    make(1021, 80, "Assigned", "Medium", "Intercom", 2, "Intercom buzzer at staff entrance intermittent",
      "Staff entrance intercom works sometimes. Volume very low when it does.",
      { tech: "T25" }),

    // ── In progress right now ──
    make(1020, 4, "In Progress", "High", "Fire Alarm", 6, "Fire alarm inspection deficiency — horn/strobe failed",
      "Annual inspection found two horn/strobes in the gym not working. Fire marshal re-inspection is Friday.",
      { tech: "T09" }),
    make(1019, 6, "In Progress", "High", "Access Control", 9, "Warehouse gate stuck open",
      "Gate controller isn't closing the gate after trucks exit. Gate is currently chained manually.",
      { tech: "T03" }),
    make(1018, 9, "In Progress", "Medium", "Security Cameras", 0, "Replace failed lobby dome camera",
      "Lobby dome camera image is blurry and flickering. Probably needs replacement.",
      { tech: "T01" }),
    make(1017, 26, "In Progress", "Medium", "Burglar Alarm", 11, "Keypad buttons unresponsive",
      "The keypad by the back door only works if you press very hard. Several buttons dead.",
      { tech: "T05" }),
    make(1016, 30, "In Progress", "High", "Alarm Communicator", 16, "3G communicator replacement — no signal to central station",
      "Monitoring company said our cellular communicator is not reporting. Phone line was removed last year so this is our only path.",
      { tech: "T19" }),
    make(1015, 75, "In Progress", "Medium", "Access Control", 4, "Program new office hours on door schedule",
      "Our hours changed. Front door should unlock 7:30am instead of 8:00am Mon–Fri.",
      { tech: "T08" }),
    make(1014, 90, "In Progress", "Low", "Other", 9, "Run cable for future camera in loading dock",
      "Prep work for camera to be added next quarter.",
      { tech: "T23", source: "Manual" }),

    // ── Completed ──
    make(1013, 8, "Completed", "High", "Burglar Alarm", 2, "Door contact failing — zone won't close", "Back door contact reports open even when closed.", { tech: "T02", doneHoursAfter: 4 }),
    make(1012, 14, "Completed", "Medium", "Security Cameras", 15, "Remote viewing app not connecting", "Owner can't see cameras on phone app since router change.", { tech: "T07", doneHoursAfter: 5 }),
    make(1011, 20, "Completed", "Critical", "Fire Alarm", 9, "Fire panel in alarm — no fire, reset needed",
      "Panel went into alarm from a dusty detector. Fire department already cleared the building. Need reset & detector replaced.", { tech: "T06", doneHoursAfter: 3 }),
    make(1010, 28, "Completed", "Medium", "Access Control", 10, "Remove access for terminated employee", "Please disable badge #4471 effective immediately.", { tech: "T18", doneHoursAfter: 2, source: "Phone" }),
    make(1009, 40, "Completed", "Low", "Intercom", 12, "Replace cracked intercom faceplate", "Faceplate at front entrance cracked.", { tech: "T25", doneHoursAfter: 30 }),
    make(1008, 52, "Completed", "High", "Burglar Alarm", 11, "Glass break sensor triggered falsely", "Glass break sensor in showroom keeps tripping.", { tech: "T21", doneHoursAfter: 10 }),
    make(1007, 70, "Completed", "Medium", "Security Cameras", 3, "Add camera view to manager's PC", "Install viewing software on new office PC.", { tech: "T20", doneHoursAfter: 26 }),
    make(1006, 96, "Completed", "Medium", "Alarm Communicator", 1, "Communicator trouble after power outage", "Trouble light on panel after weekend power outage.", { tech: "T15", doneHoursAfter: 20 }),
    make(1005, 120, "Completed", "Low", "Other", 14, "Annual system walkthrough", "Yearly walkthrough of all security equipment.", { tech: "T14", doneHoursAfter: 50, source: "Manual" }),
    make(1004, 140, "Completed", "High", "Access Control", 8, "Main entrance maglock not releasing", "Tenants trapped in vestibule briefly; door released with key switch.", { tech: "T24", doneHoursAfter: 8 }),
    make(1003, 160, "Completed", "Medium", "Fire Alarm", 6, "Smoke detector replacement — classroom 4", "Detector end-of-life warning.", { tech: "T13", doneHoursAfter: 40 }),
    make(1002, 190, "Completed", "Low", "Security Cameras", 17, "Camera lens cleaning", "Several cameras look foggy.", { tech: "T10", doneHoursAfter: 70 }),
    make(1001, 200, "Completed", "Medium", "Burglar Alarm", 4, "Add user code for new office manager", "New manager needs her own alarm code.", { tech: "T11", doneHoursAfter: 4, source: "Phone" }),
  ];
}

export const SEED_NEXT_TICKET_NUMBER = 1032;
