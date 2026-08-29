/* ==========================================================================
   MOTION-U PORTALS — Mock data
   Stand-in for the real API described in the system brief (Users, Cards,
   Events, Stations, Participation, Achievements). Swap this file for real
   fetch() calls once the backend exists — every page reads through MU_DATA.
   ========================================================================== */

const MU_DEPARTMENTS = [
  { key: "mainboard",    name: "Mainboards",                    short: "Mainboard",   lead: "Sets direction, owns the calendar, signs off every event." },
  { key: "techops",      name: "Technical Operations",          short: "Tech Ops",    lead: "Builds and runs the stations, cards, and everything with a plug." },
  { key: "multimedia",   name: "Multimedia & Communications",   short: "Multimedia",  lead: "Shoots, edits, and posts — the department members actually see." },
  { key: "entrepreneur", name: "Entrepreneurship",               short: "Entrepreneur.", lead: "Runs sponsorships, merch, and anything that needs a budget." },
  { key: "internal",     name: "Internal Affairs",               short: "Internal",    lead: "Keeps members onboarded, welfare covered, and records straight." },
];

const MU_ACHIEVEMENTS = {
  "finisher-5k":   { icon: '<i class="fa-solid fa-person-running"></i>', label: "5KM Finisher",        desc: "Completed the Motion-U 5KM Run" },
  "active-member": { icon: '<i class="fa-solid fa-star"></i>',           label: "Active Member",        desc: "Attended 5+ events this season" },
  "workshop":      { icon: '<i class="fa-solid fa-laptop-code"></i>',    label: "Workshop Explorer",    desc: "Completed a Motion-U workshop" },
  "champion":      { icon: '<i class="fa-solid fa-trophy"></i>',         label: "Competition Winner",   desc: "Placed first in a Motion-U competition" },
  "founder":       { icon: '<i class="fa-solid fa-compass"></i>',        label: "Founding Cohort",      desc: "Member since Motion-U's first intake" },
  "mentor":        { icon: '<i class="fa-solid fa-handshake"></i>',      label: "Peer Mentor",          desc: "Onboarded 3+ new members" },
};

const MU_MEMBERS = [
  { id: "MU-0001", name: "Amir Zulkarnain",  initials: "AZ", dept: "techops",      role: "Head of Technical Operations", cardId: "CARD-001", achievements: ["finisher-5k", "active-member", "founder"] },
  { id: "MU-0002", name: "Nur Iman Haziq",    initials: "NH", dept: "mainboard",    role: "President",                    cardId: "CARD-002", achievements: ["active-member", "founder", "mentor"] },
  { id: "MU-0003", name: "Sofea Balqis",      initials: "SB", dept: "multimedia",   role: "Head of Multimedia",           cardId: "CARD-003", achievements: ["workshop", "active-member"] },
  { id: "MU-0004", name: "Danish Irfan",      initials: "DI", dept: "entrepreneur", role: "Head of Entrepreneurship",     cardId: "CARD-004", achievements: ["champion", "active-member"] },
  { id: "MU-0005", name: "Aisyah Ramli",      initials: "AR", dept: "internal",     role: "Head of Internal Affairs",     cardId: "CARD-005", achievements: ["mentor", "active-member", "founder"] },
  { id: "MU-0006", name: "Haziq Rahman",      initials: "HR", dept: "techops",      role: "NFC Systems Lead",             cardId: "CARD-006", achievements: ["workshop", "finisher-5k"] },
  { id: "MU-0007", name: "Qistina Aina",      initials: "QA", dept: "multimedia",   role: "Content Producer",             cardId: "CARD-007", achievements: ["active-member"] },
  { id: "MU-0008", name: "Farid Hakimi",      initials: "FH", dept: "entrepreneur", role: "Sponsorship Coordinator",      cardId: "CARD-008", achievements: [] },
  { id: "MU-0009", name: "Nurul Ain",         initials: "NA", dept: "internal",     role: "Welfare Coordinator",          cardId: "CARD-009", achievements: ["mentor"] },
  { id: "MU-0010", name: "Zulhilmi Azman",    initials: "ZA", dept: "mainboard",    role: "Vice President",               cardId: null,        achievements: ["founder"] },
  { id: "MU-0011", name: "Batrisyia Nadhirah",initials: "BN", dept: "techops",      role: "Station Technician",           cardId: null,        achievements: ["finisher-5k"] },
  { id: "MU-0012", name: "Rayyan Adha",       initials: "RA", dept: "multimedia",   role: "Photographer",                 cardId: null,        achievements: [] },
];

const MU_CARDS = [
  { cardId: "CARD-001", uid: "04:A2:9F:1C:5E:80", assignedTo: "MU-0001", lastTap: "5KM Race Finish · 12 Aug 2026" },
  { cardId: "CARD-002", uid: "04:B1:77:0A:2D:11", assignedTo: "MU-0002", lastTap: "Committee Desk · 21 Aug 2026" },
  { cardId: "CARD-003", uid: "04:C4:5B:E2:99:03", assignedTo: "MU-0003", lastTap: "Workshop Check-in · 18 Aug 2026" },
  { cardId: "CARD-004", uid: "04:D0:12:9A:6F:44", assignedTo: "MU-0004", lastTap: "Pitch Day Entry · 09 Aug 2026" },
  { cardId: "CARD-005", uid: "04:E8:34:7C:11:2A", assignedTo: "MU-0005", lastTap: "General Meeting · 23 Aug 2026" },
  { cardId: "CARD-006", uid: "04:F3:9D:20:BB:C7", assignedTo: "MU-0006", lastTap: "5KM Race Finish · 12 Aug 2026" },
  { cardId: "CARD-007", uid: "04:1A:60:88:D4:35", assignedTo: "MU-0007", lastTap: "Content Review · 15 Aug 2026" },
  { cardId: "CARD-008", uid: "04:2E:C7:41:09:9B", assignedTo: null,      lastTap: "—" },
  { cardId: "CARD-009", uid: "04:77:0F:B3:2C:6D", assignedTo: null,      lastTap: "—" },
  { cardId: "CARD-010", uid: "04:9C:E1:55:80:F0", assignedTo: null,      lastTap: "—" },
];

const MU_APPS = [
  { id: "app-checkin",   name: "Station Check-in",      desc: "Tap-to-log app committee run at stations for events, races, and workshops.",         category: "Internal", dept: "techops",      icon: "nfc" },
  { id: "app-committee", name: "Committee Dashboard",    desc: "Attendance, minutes, and task tracking for Mainboard and department heads.",          category: "Internal", dept: "mainboard",    icon: "grid" },
  { id: "app-finance",   name: "Finance Tracker",        desc: "Sponsorship inflow, event budgets, and reimbursement requests in one ledger.",        category: "Internal", dept: "entrepreneur", icon: "wallet" },
  { id: "app-content",   name: "Content Calendar",       desc: "Shoot schedules, caption drafts, and post approvals for socials.",                    category: "Internal", dept: "multimedia",   icon: "camera" },
  { id: "app-onboard",   name: "Member Onboarding",      desc: "New-intake forms, welfare check-ins, and mentor pairing.",                            category: "Internal", dept: "internal",     icon: "users" },
  { id: "app-site",      name: "Motion-U Website",       desc: "Public site with event calendar, gallery, and open recruitment.",                     category: "Public",   dept: "multimedia",   icon: "globe" },
  { id: "app-register",  name: "Event Registration",     desc: "Sign up for runs, workshops, and competitions — open to all members.",                category: "Public",   dept: "mainboard",    icon: "calendar" },
  { id: "app-merch",     name: "Merch Store",            desc: "Order Motion-U apparel and gear, sized and shipped by Entrepreneurship.",              category: "Public",   dept: "entrepreneur", icon: "shirt" },
  { id: "app-fitness",   name: "Fitness Log",            desc: "Members log training and see pace history ahead of the next race.",                   category: "Public",   dept: "techops",      icon: "activity" },
];

const MU_ACTIVITY = [
  { memberId: "MU-0006", text: "unlocked", achievement: "finisher-5k", time: "2 hours ago" },
  { memberId: "MU-0003", text: "unlocked", achievement: "workshop",    time: "1 day ago" },
  { memberId: "MU-0004", text: "unlocked", achievement: "champion",    time: "3 days ago" },
  { memberId: "MU-0009", text: "unlocked", achievement: "mentor",      time: "5 days ago" },
  { memberId: "MU-0007", text: "unlocked", achievement: "active-member", time: "6 days ago" },
];

/* ---- Local persistence ------------------------------------------------------
   Cards, members, and activity are seeded from the consts above, then stored
   in localStorage so reassignments, new cards, and taps survive reloads.
   Call MU_DATA.save() after any mutation; MU_DATA.reset() re-seeds demo data. */

const MU_STORE_KEY = "motion-u-portals:v1";

function muLoadPersisted() {
  try {
    const raw = localStorage.getItem(MU_STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || saved.v !== 1) return;
    if (Array.isArray(saved.members)) {
      MU_MEMBERS.length = 0;
      MU_MEMBERS.push(...saved.members);
    }
    if (Array.isArray(saved.cards)) {
      MU_CARDS.length = 0;
      MU_CARDS.push(...saved.cards);
    }
    if (Array.isArray(saved.activity)) {
      MU_ACTIVITY.length = 0;
      MU_ACTIVITY.push(...saved.activity);
    }
  } catch (e) {
    /* corrupted or unavailable storage — keep the seed data */
  }
}

function muPersist() {
  try {
    localStorage.setItem(MU_STORE_KEY, JSON.stringify({
      v: 1,
      members: MU_MEMBERS,
      cards: MU_CARDS,
      activity: MU_ACTIVITY,
    }));
  } catch (e) {
    /* storage unavailable — changes stay session-only */
  }
}

function muResetData() {
  try { localStorage.removeItem(MU_STORE_KEY); } catch (e) { /* noop */ }
  window.location.reload();
}

muLoadPersisted();

/* ---- Lookup helpers -------------------------------------------------------- */
const MU_DATA = {
  departments: MU_DEPARTMENTS,
  members: MU_MEMBERS,
  cards: MU_CARDS,
  apps: MU_APPS,
  achievements: MU_ACHIEVEMENTS,
  activity: MU_ACTIVITY,

  deptByKey(key) { return MU_DEPARTMENTS.find((d) => d.key === key); },
  memberById(id) { return MU_MEMBERS.find((m) => m.id === id); },
  cardById(cardId) { return MU_CARDS.find((c) => c.cardId === cardId); },
  memberByCardId(cardId) { return MU_MEMBERS.find((m) => m.cardId === cardId); },
  save: muPersist,
  reset: muResetData,
};
