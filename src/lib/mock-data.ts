export type Priority = "urgent" | "important" | "general";
export type AssignmentStatus = "pending" | "in-progress" | "submitted" | "graded" | "overdue";

export const subjects = [
  { id: "math", name: "Mathematics", color: "#3b82f6" },
  { id: "phys", name: "Physics", color: "#8b5cf6" },
  { id: "chem", name: "Chemistry", color: "#10b981" },
  { id: "bio", name: "Biology", color: "#f59e0b" },
  { id: "eng", name: "English", color: "#ef4444" },
  { id: "hist", name: "History", color: "#06b6d4" },
];

export const assignments = [
  { id: "a1", title: "Calculus: Integration Worksheet", subject: "math", dueDate: "2026-06-19", status: "pending" as AssignmentStatus, description: "Complete problems 1-25 from chapter 8. Show all working.", grade: null },
  { id: "a2", title: "Physics Lab Report — Pendulum", subject: "phys", dueDate: "2026-06-20", status: "in-progress" as AssignmentStatus, description: "Write-up for the simple pendulum experiment performed last week.", grade: null },
  { id: "a3", title: "Essay: Macbeth Themes", subject: "eng", dueDate: "2026-06-22", status: "pending" as AssignmentStatus, description: "1500 words analyzing the theme of ambition in Macbeth.", grade: null },
  { id: "a4", title: "Organic Chemistry Problem Set", subject: "chem", dueDate: "2026-06-17", status: "overdue" as AssignmentStatus, description: "Nomenclature and reaction mechanisms.", grade: null },
  { id: "a5", title: "Cell Division Diagrams", subject: "bio", dueDate: "2026-06-15", status: "graded" as AssignmentStatus, description: "Labeled diagrams of mitosis and meiosis.", grade: "A-" },
  { id: "a6", title: "WW2 Source Analysis", subject: "hist", dueDate: "2026-06-14", status: "submitted" as AssignmentStatus, description: "Primary source analysis paper.", grade: null },
  { id: "a7", title: "Statistics Quiz Prep", subject: "math", dueDate: "2026-06-25", status: "pending" as AssignmentStatus, description: "Review chapters 10-12 for quiz.", grade: null },
];

export const notices = [
  { id: "n1", title: "Parent–Teacher Conferences next Friday", body: "Please book a slot via the portal before Wednesday.", priority: "urgent" as Priority, sender: "Principal Adeyemi", timestamp: "2h ago", read: false },
  { id: "n2", title: "Science Fair submissions open", body: "Submit project proposals by June 30th.", priority: "important" as Priority, sender: "Ms. Chen", timestamp: "5h ago", read: false },
  { id: "n3", title: "Library hours extended for exam week", body: "Open until 9pm Mon–Fri.", priority: "general" as Priority, sender: "Library Admin", timestamp: "1d ago", read: true },
  { id: "n4", title: "Bus route 7 changed", body: "New stop at Maple & 4th from Monday.", priority: "important" as Priority, sender: "Transport Office", timestamp: "2d ago", read: true },
];

export const schedule = [
  { time: "08:00", subject: "Mathematics", room: "Room 204", teacher: "Mr. Okafor" },
  { time: "09:00", subject: "Physics", room: "Lab 3", teacher: "Dr. Patel" },
  { time: "10:15", subject: "English", room: "Room 112", teacher: "Ms. Rivera" },
  { time: "11:15", subject: "Chemistry", room: "Lab 1", teacher: "Mr. Tanaka" },
  { time: "13:00", subject: "History", room: "Room 308", teacher: "Mrs. Kowalski" },
  { time: "14:00", subject: "Biology", room: "Lab 2", teacher: "Ms. Chen" },
];

export const resources = [
  { id: "r1", title: "Integration techniques — full notes", subject: "math", topic: "Calculus", type: "Notes", date: "2026-06-10", syllabus: true },
  { id: "r2", title: "Pendulum experiment guide", subject: "phys", topic: "Mechanics", type: "Worksheet", date: "2026-06-12", syllabus: true },
  { id: "r3", title: "Macbeth annotated text", subject: "eng", topic: "Shakespeare", type: "Notes", date: "2026-06-08", syllabus: true },
  { id: "r4", title: "Organic chem cheat sheet", subject: "chem", topic: "Organic", type: "Notes", date: "2026-06-05", syllabus: true },
  { id: "r5", title: "Past paper 2024", subject: "math", topic: "Exam prep", type: "Past Paper", date: "2026-05-28", syllabus: false },
  { id: "r6", title: "Cell division video lecture", subject: "bio", topic: "Cytology", type: "Video", date: "2026-06-01", syllabus: true },
  { id: "r7", title: "WW2 timeline reference", subject: "hist", topic: "Modern Era", type: "Notes", date: "2026-05-30", syllabus: true },
];

export const messages = [
  { id: "m1", from: "Mr. Okafor", subject: "Re: Question on problem 14", preview: "Good question — try substitution u = x² + 1 first…", time: "30m", unread: true },
  { id: "m2", from: "Study group: Physics", subject: "Lab tomorrow", preview: "Can we meet at 4pm in the library?", time: "2h", unread: true },
  { id: "m3", from: "Ms. Rivera", subject: "Essay feedback", preview: "Great progress on the draft. A few notes attached.", time: "1d", unread: false },
];

export const events = [
  { date: "2026-06-19", title: "Calculus assignment due", type: "assignment" },
  { date: "2026-06-20", title: "Physics lab report due", type: "assignment" },
  { date: "2026-06-22", title: "Macbeth essay due", type: "assignment" },
  { date: "2026-06-24", title: "Chemistry midterm", type: "exam" },
  { date: "2026-06-26", title: "Science fair", type: "event" },
  { date: "2026-06-28", title: "Soccer practice", type: "personal" },
];

export function subjectById(id: string) {
  return subjects.find((s) => s.id === id) ?? subjects[0];
}

export function daysUntil(date: string) {
  const ms = new Date(date).getTime() - new Date("2026-06-19").getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
