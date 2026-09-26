import { Timestamp } from 'firebase/firestore';

export interface DiaryEntry {
  date: string;          // YYYY-MM-DD (document ID)
  title: string;         // Entry title (e.g. "Today at the Lab")
  content: string;       // Plain text journal content
  imageUrl?: string;     // Download URL for doodle image in Firebase Storage
  imagePath?: string;    // Storage path (e.g. doodles/2026-09-26.webp)
  createdAt: Timestamp | Date | any;
  updatedAt: Timestamp | Date | any;
}

export interface UserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
}

export interface MonthSummary {
  month: number;         // 1 - 12
  monthName: string;     // e.g. "January"
  count: number;
}

export interface YearSummary {
  year: number;
  months: MonthSummary[];
}
