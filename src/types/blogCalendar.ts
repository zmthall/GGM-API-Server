export type BlogCalendar = {
  id: string;        // Firestore document ID (auto-generated)
  key: string;       // e.g. "2026-04" (your uniqueness key)
  csv: string;       // raw CSV
  createdAt: string; // ISO
  updatedAt: string; // ISO
};
