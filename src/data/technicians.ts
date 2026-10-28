import type { Technician } from "@/lib/types";

// 25 FICTIONAL technicians. Names, phones and certifications are made up.
// To add a technician, copy one block and give it a new id (e.g. "T26").

export const seedTechnicians: Technician[] = [
  { id: "T01", name: "Marcus Reyes", phone: "(555) 201-1101", zone: "North", skills: ["Security Cameras", "Access Control", "Intercom"], certifications: ["Axis Certified Professional", "Genetec Security Center", "OSHA 10"], duty: "On Duty", vanNumber: 1, yearsExperience: 12 },
  { id: "T02", name: "Dana Kowalski", phone: "(555) 201-1102", zone: "North", skills: ["Burglar Alarm", "Fire Alarm", "Alarm Communicator"], certifications: ["NICET Fire Alarm Level III", "ESA Certified Alarm Technician"], duty: "On Duty", yearsExperience: 15 },
  { id: "T03", name: "Jamal Whitaker", phone: "(555) 201-1103", zone: "South", skills: ["Access Control", "Intercom"], certifications: ["Lenel OnGuard Certified", "Software House C•CURE 9000"], duty: "On Duty", vanNumber: 2, yearsExperience: 8 },
  { id: "T04", name: "Priya Natarajan", phone: "(555) 201-1104", zone: "Central", skills: ["Security Cameras", "Other"], certifications: ["Milestone XProtect Certified", "Avigilon Certified"], duty: "On Duty", yearsExperience: 6 },
  { id: "T05", name: "Tom Brennan", phone: "(555) 201-1105", zone: "East", skills: ["Burglar Alarm", "Alarm Communicator"], certifications: ["DMP Certified Technician", "Honeywell Vista Certified"], duty: "On Duty", yearsExperience: 20 },
  { id: "T06", name: "Sofia Alvarez", phone: "(555) 201-1106", zone: "West", skills: ["Fire Alarm", "Burglar Alarm"], certifications: ["NICET Fire Alarm Level II", "Fire-Lite Certified"], duty: "On Duty", vanNumber: 3, yearsExperience: 9 },
  { id: "T07", name: "Kevin O'Malley", phone: "(555) 201-1107", zone: "Central", skills: ["Security Cameras", "Access Control"], certifications: ["Hanwha Vision Certified", "Brivo Certified"], duty: "On Duty", yearsExperience: 4 },
  { id: "T08", name: "Aisha Mensah", phone: "(555) 201-1108", zone: "South", skills: ["Access Control", "Security Cameras", "Intercom"], certifications: ["Genetec Security Center", "Aiphone Certified"], duty: "On Duty", yearsExperience: 7 },
  { id: "T09", name: "Ryan Fitzgerald", phone: "(555) 201-1109", zone: "East", skills: ["Fire Alarm"], certifications: ["NICET Fire Alarm Level IV", "Notifier Certified"], duty: "On Duty", vanNumber: 4, yearsExperience: 22 },
  { id: "T10", name: "Lena Petrova", phone: "(555) 201-1110", zone: "West", skills: ["Security Cameras", "Other"], certifications: ["Axis Certified Professional"], duty: "Off Today", yearsExperience: 3 },
  { id: "T11", name: "Carlos Mendes", phone: "(555) 201-1111", zone: "North", skills: ["Burglar Alarm", "Alarm Communicator", "Intercom"], certifications: ["DMP Certified Technician", "ESA Certified Alarm Technician"], duty: "On Duty", yearsExperience: 11 },
  { id: "T12", name: "Hannah Brooks", phone: "(555) 201-1112", zone: "Central", skills: ["Access Control"], certifications: ["Lenel OnGuard Certified", "OSHA 10"], duty: "On Duty", yearsExperience: 5 },
  { id: "T13", name: "Derek Johnson", phone: "(555) 201-1113", zone: "South", skills: ["Burglar Alarm", "Fire Alarm"], certifications: ["NICET Fire Alarm Level II", "Bosch B-Series Certified"], duty: "On Duty", yearsExperience: 10 },
  { id: "T14", name: "Mei Lin Chen", phone: "(555) 201-1114", zone: "East", skills: ["Security Cameras", "Access Control", "Other"], certifications: ["Avigilon Certified", "Genetec Security Center"], duty: "On Duty", vanNumber: 5, yearsExperience: 9 },
  { id: "T15", name: "Bobby Tran", phone: "(555) 201-1115", zone: "West", skills: ["Alarm Communicator", "Burglar Alarm"], certifications: ["Honeywell Vista Certified", "Telguard Certified"], duty: "On Duty", yearsExperience: 2 },
  { id: "T16", name: "Natalie Ortiz", phone: "(555) 201-1116", zone: "Central", skills: ["Fire Alarm", "Intercom"], certifications: ["NICET Fire Alarm Level II"], duty: "On Leave", yearsExperience: 8 },
  { id: "T17", name: "Greg Hollister", phone: "(555) 201-1117", zone: "North", skills: ["Security Cameras"], certifications: ["Milestone XProtect Certified", "Axis Certified Professional"], duty: "On Duty", yearsExperience: 14 },
  { id: "T18", name: "Fatima Rahman", phone: "(555) 201-1118", zone: "South", skills: ["Access Control", "Intercom"], certifications: ["Brivo Certified", "Aiphone Certified"], duty: "On Duty", yearsExperience: 6 },
  { id: "T19", name: "Steve Novak", phone: "(555) 201-1119", zone: "East", skills: ["Burglar Alarm", "Alarm Communicator", "Fire Alarm"], certifications: ["ESA Certified Alarm Technician", "NICET Fire Alarm Level I"], duty: "On Duty", yearsExperience: 18 },
  { id: "T20", name: "Olivia Grant", phone: "(555) 201-1120", zone: "West", skills: ["Security Cameras", "Access Control"], certifications: ["Hanwha Vision Certified", "Software House C•CURE 9000"], duty: "On Duty", yearsExperience: 5 },
  { id: "T21", name: "Andre Baptiste", phone: "(555) 201-1121", zone: "Central", skills: ["Burglar Alarm", "Security Cameras"], certifications: ["DMP Certified Technician", "Avigilon Certified"], duty: "On Duty", yearsExperience: 7 },
  { id: "T22", name: "Rachel Stein", phone: "(555) 201-1122", zone: "North", skills: ["Fire Alarm", "Alarm Communicator"], certifications: ["NICET Fire Alarm Level III", "Notifier Certified"], duty: "Off Today", yearsExperience: 13 },
  { id: "T23", name: "Victor Huang", phone: "(555) 201-1123", zone: "South", skills: ["Security Cameras", "Other"], certifications: ["Genetec Security Center", "OSHA 30"], duty: "On Duty", yearsExperience: 10 },
  { id: "T24", name: "Jess Lindqvist", phone: "(555) 201-1124", zone: "East", skills: ["Access Control", "Burglar Alarm"], certifications: ["Lenel OnGuard Certified", "Honeywell Vista Certified"], duty: "On Duty", yearsExperience: 4 },
  { id: "T25", name: "Omar Haddad", phone: "(555) 201-1125", zone: "West", skills: ["Intercom", "Access Control", "Other"], certifications: ["Aiphone Certified", "Brivo Certified"], duty: "On Duty", yearsExperience: 3 },
];
