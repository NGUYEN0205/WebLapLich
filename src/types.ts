export interface TimeSlot {
  id: string;
  dayOfWeek: number; // 0 for Monday, 1 for Tuesday, ..., 6 for Sunday
  type: 'period' | 'time';
  startPeriod?: number; // 1 to 15
  numPeriods?: number; // 1 to 10
  startTime?: string; // "HH:MM" (e.g. "08:15")
  endTime?: string; // "HH:MM" (e.g. "10:30")
}

export interface ClassSection {
  id: string;
  className: string; // e.g. "N01", "L03", "Nhóm 1"
  teacherName?: string;
  room?: string;
  scheduleSlots: TimeSlot[];
}

export interface Subject {
  id: string;
  subjectName: string; // e.g. "Toán cao cấp A1", "Lập trình mạng"
  color: string; // Hex code or tailwind color class
  sections: ClassSection[];
}

export interface PersonalSchedule {
  id: string;
  title: string; // e.g. "Lịch học tiếng Anh", "Làm thêm Circle K"
  dayOfWeek: number; // 0 for Monday, ..., 6 for Sunday
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  isActive: boolean;
}

// Represent an overlap conflict in the timetable
export interface Conflict {
  type: 'class-class' | 'class-personal';
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  description: string;
  entities: {
    id: string;
    name: string;
    color?: string; // Color identifier if it's a subject
  }[];
}

export interface TimetableOption {
  id: string;
  // Map of subjectId -> chosen ClassSection
  selectedSections: Record<string, ClassSection>;
  conflictMinutes: number; // 0 means perfect timetable
  conflicts: Conflict[];
}

// Predefined Period Settings for Vietnamese colleges
export interface PeriodConfig {
  number: number;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export const VIET_PERIODS_CONFIG: PeriodConfig[] = [
  { number: 1, startTime: '07:00', endTime: '07:45' },
  { number: 2, startTime: '07:50', endTime: '08:35' },
  { number: 3, startTime: '08:45', endTime: '09:30' },
  { number: 4, startTime: '09:35', endTime: '10:20' },
  { number: 5, startTime: '10:30', endTime: '11:15' },
  { number: 6, startTime: '12:30', endTime: '13:15' },
  { number: 7, startTime: '13:20', endTime: '14:05' },
  { number: 8, startTime: '14:15', endTime: '15:00' },
  { number: 9, startTime: '15:05', endTime: '15:50' },
  { number: 10, startTime: '16:00', endTime: '16:45' },
  { number: 11, startTime: '17:30', endTime: '18:15' },
  { number: 12, startTime: '18:15', endTime: '19:00' },
  { number: 13, startTime: '19:00', endTime: '19:45' },
  { number: 14, startTime: '19:45', endTime: '20:30' },
  { number: 15, startTime: '20:30', endTime: '21:15' },
];
