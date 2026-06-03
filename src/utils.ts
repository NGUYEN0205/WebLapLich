import {
  TimeSlot,
  ClassSection,
  Subject,
  PersonalSchedule,
  Conflict,
  TimetableOption,
  VIET_PERIODS_CONFIG,
} from './types';

// Convert string time "HH:MM" to minutes of day
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

// Convert minutes of day to "HH:MM"
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const padH = String(hours).padStart(2, '0');
  const padM = String(mins).padStart(2, '0');
  return `${padH}:${padM}`;
}

// Get the start and end minutes of a day for a TimeSlot
export function getSlotMinutesOfDay(slot: TimeSlot): { start: number; end: number } {
  if (slot.type === 'time') {
    const start = timeStringToMinutes(slot.startTime || '07:00');
    const end = timeStringToMinutes(slot.endTime || '08:00');
    return { start, end };
  } else {
    // period-based
    const startP = slot.startPeriod || 1;
    const numP = slot.numPeriods || 1;
    const endP = Math.min(15, startP + numP - 1);

    const startConfig = VIET_PERIODS_CONFIG.find((p) => p.number === startP) || VIET_PERIODS_CONFIG[0];
    const endConfig = VIET_PERIODS_CONFIG.find((p) => p.number === endP) || VIET_PERIODS_CONFIG[startConfig.number - 1] || startConfig;

    const start = timeStringToMinutes(startConfig.startTime);
    const end = timeStringToMinutes(endConfig.endTime);
    return { start, end };
  }
}

// Get interval in minutes of the WEEK
// Week minutes start from 0 (Monday 00:00) to 10079 (Sunday 23:59)
export function getSlotMinutesOfWeek(dayOfWeek: number, startMin: number, endMin: number): { start: number; end: number } {
  const dayOffset = dayOfWeek * 24 * 60;
  return {
    start: dayOffset + startMin,
    end: dayOffset + endMin,
  };
}

// Check if two time intervals overlap (open interval comparison)
export function isOverlapping(s1: number, e1: number, s2: number, e2: number): boolean {
  return Math.max(s1, s2) < Math.min(e1, e2);
}

// Calculate overlap length in minutes between two intervals
export function getOverlapMinutes(s1: number, e1: number, s2: number, e2: number): number {
  const start = Math.max(s1, s2);
  const end = Math.min(e1, e2);
  return Math.max(0, end - start);
}

// Build list of active intervals (in week minutes) for a ClassSection
interface ActiveInterval {
  dayOfWeek: number;
  start: number; // week minutes
  end: number;   // week minutes
  slot: TimeSlot;
}

function getSectionIntervals(section: ClassSection): ActiveInterval[] {
  return section.scheduleSlots.map((slot) => {
    const { start, end } = getSlotMinutesOfDay(slot);
    const { start: wStart, end: wEnd } = getSlotMinutesOfWeek(slot.dayOfWeek, start, end);
    return {
      dayOfWeek: slot.dayOfWeek,
      start: wStart,
      end: wEnd,
      slot,
    };
  });
}

// Build list of active intervals (in week minutes) for active personal schedules
interface PersonalInterval {
  id: string;
  title: string;
  dayOfWeek: number;
  start: number; // week minutes
  end: number;   // week minutes
}

function getPersonalIntervals(personalSchedules: PersonalSchedule[]): PersonalInterval[] {
  return personalSchedules
    .filter((p) => p.isActive)
    .map((p) => {
      const startMin = timeStringToMinutes(p.startTime);
      const endMin = timeStringToMinutes(p.endTime);
      const { start: wStart, end: wEnd } = getSlotMinutesOfWeek(p.dayOfWeek, startMin, endMin);
      return {
        id: p.id,
        title: p.title,
        dayOfWeek: p.dayOfWeek,
        start: wStart,
        end: wEnd,
      };
    });
}

/**
 * Searches for perfect combinations (0 minutes conflict)
 */
export function findPerfectTimetables(
  subjects: Subject[],
  personalSchedules: PersonalSchedule[],
  maxResults = 100
): TimetableOption[] {
  if (subjects.length === 0) return [];
  // Verify that all subjects have at least one section. If any subject has 0 sections, no perfect timetable is possible.
  if (subjects.some((sub) => sub.sections.length === 0)) return [];

  const results: TimetableOption[] = [];
  const personalIntervals = getPersonalIntervals(personalSchedules);

  // Helper backtrack function
  function backtrack(
    subjectIndex: number,
    currentSelection: Record<string, ClassSection>,
    occupiedIntervals: { start: number; end: number; label: string }[]
  ) {
    if (results.length >= maxResults) return;

    if (subjectIndex === subjects.length) {
      // Form a valid solution
      results.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        selectedSections: { ...currentSelection },
        conflictMinutes: 0,
        conflicts: [],
      });
      return;
    }

    const currentSubject = subjects[subjectIndex];
    for (const section of currentSubject.sections) {
      const sectionIntervals = getSectionIntervals(section);
      let conflictDetected = false;

      // 1. Check conflict with previously selected sections
      for (const sectInt of sectionIntervals) {
        for (const occ of occupiedIntervals) {
          if (isOverlapping(sectInt.start, sectInt.end, occ.start, occ.end)) {
            conflictDetected = true;
            break;
          }
        }
        if (conflictDetected) break;

        // 2. Check conflict with personal busy schedule
        for (const pers of personalIntervals) {
          if (isOverlapping(sectInt.start, sectInt.end, pers.start, pers.end)) {
            conflictDetected = true;
            break;
          }
        }
        if (conflictDetected) break;
      }

      if (!conflictDetected) {
        // Choose
        currentSelection[currentSubject.id] = section;
        const newOccupied = [
          ...occupiedIntervals,
          ...sectionIntervals.map((si) => ({
            start: si.start,
            end: si.end,
            label: `${currentSubject.subjectName} (${section.className})`,
          })),
        ];

        // Recurse
        backtrack(subjectIndex + 1, currentSelection, newOccupied);

        // Undo choose
        delete currentSelection[currentSubject.id];
      }
    }
  }

  backtrack(0, {}, []);
  return results;
}

/**
 * Searches for combinations and sorts them by conflict minutes.
 * Used when no perfect timetable can be found.
 */
export function findNearestTimetables(
  subjects: Subject[],
  personalSchedules: PersonalSchedule[],
  maxResults = 20
): TimetableOption[] {
  if (subjects.length === 0) return [];
  if (subjects.some((sub) => sub.sections.length === 0)) return [];

  const personalIntervals = getPersonalIntervals(personalSchedules);

  // Generate all possible combinations
  // Let's protect memory by calculating total combinations first
  let totalCombinations = 1;
  for (const sub of subjects) {
    totalCombinations *= sub.sections.length;
  }

  // If combinations are incredibly astronomical, let's limit branching
  // We want to be careful. Let's do a complete search if total combinations <= 15000.
  // Otherwise, we cap we can fetch up to 15000 combinations to check.
  const combinations: Record<string, ClassSection>[] = [];
  
  function generateCombinations(subjIdx: number, current: Record<string, ClassSection>) {
    if (combinations.length >= 15000) return;
    if (subjIdx === subjects.length) {
      combinations.push({ ...current });
      return;
    }
    const sub = subjects[subjIdx];
    for (const sec of sub.sections) {
      current[sub.id] = sec;
      generateCombinations(subjIdx + 1, current);
      delete current[sub.id];
    }
  }

  generateCombinations(0, {});

  // Now, calculate conflict cost for each option
  const options: TimetableOption[] = [];

  for (const combo of combinations) {
    let totalConflictMinutes = 0;
    const conflicts: Conflict[] = [];

    // Get all sections in this combination
    const sectionsWithSubjects = Object.entries(combo).map(([subjectId, section]) => {
      const subject = subjects.find((s) => s.id === subjectId)!;
      return {
        subject,
        section,
        intervals: getSectionIntervals(section),
      };
    });

    // 1. Check class-to-class conflicts
    for (let i = 0; i < sectionsWithSubjects.length; i++) {
      for (let j = i + 1; j < sectionsWithSubjects.length; j++) {
        const itemA = sectionsWithSubjects[i];
        const itemB = sectionsWithSubjects[j];

        for (const intA of itemA.intervals) {
          for (const intB of itemB.intervals) {
            if (isOverlapping(intA.start, intA.end, intB.start, intB.end)) {
              const overlap = getOverlapMinutes(intA.start, intA.end, intB.start, intB.end);
              if (overlap > 0) {
                totalConflictMinutes += overlap;
                
                // Formulate a clean description in Vietnamese
                const startTimeStr = minutesToTimeString(Math.max(intA.start % 1440, intB.start % 1440));
                const endTimeStr = minutesToTimeString(Math.min(intA.end % 1440, intB.end % 1440));
                const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
                const dayName = dayNames[intA.dayOfWeek];

                conflicts.push({
                  type: 'class-class',
                  dayOfWeek: intA.dayOfWeek,
                  startMinutes: Math.max(intA.start, intB.start),
                  endMinutes: Math.min(intA.end, intB.end),
                  description: `Trùng lịch giữa môn ${itemA.subject.subjectName} (${itemA.section.className}) và ${itemB.subject.subjectName} (${itemB.section.className}) vào ${dayName} (${startTimeStr} - ${endTimeStr})`,
                  entities: [
                    { id: itemA.section.id, name: `${itemA.subject.subjectName} (${itemA.section.className})`, color: itemA.subject.color },
                    { id: itemB.section.id, name: `${itemB.subject.subjectName} (${itemB.section.className})`, color: itemB.subject.color },
                  ],
                });
              }
            }
          }
        }
      }
    }

    // 2. Check class-to-personal conflicts
    for (const item of sectionsWithSubjects) {
      for (const intS of item.intervals) {
        for (const p of personalIntervals) {
          if (isOverlapping(intS.start, intS.end, p.start, p.end)) {
            const overlap = getOverlapMinutes(intS.start, intS.end, p.start, p.end);
            if (overlap > 0) {
              totalConflictMinutes += overlap;

              const startTimeStr = minutesToTimeString(Math.max(intS.start % 1440, p.start % 1440));
              const endTimeStr = minutesToTimeString(Math.min(intS.end % 1440, p.end % 1440));
              const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
              const dayName = dayNames[intS.dayOfWeek];

              conflicts.push({
                type: 'class-personal',
                dayOfWeek: intS.dayOfWeek,
                startMinutes: Math.max(intS.start, p.start),
                endMinutes: Math.min(intS.end, p.end),
                description: `Trùng lớp môn ${item.subject.subjectName} (${item.section.className}) với Lịch bận "${p.title}" vào ${dayName} (${startTimeStr} - ${endTimeStr})`,
                entities: [
                  { id: item.section.id, name: `${item.subject.subjectName} (${item.section.className})`, color: item.subject.color },
                  { id: p.id, name: `Lịch bận: ${p.title}` },
                ],
              });
            }
          }
        }
      }
    }

    options.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      selectedSections: combo,
      conflictMinutes: totalConflictMinutes,
      conflicts,
    });
  }

  // Sort by conflict minutes ascending, then filter/sort to keep the best options
  options.sort((a, b) => a.conflictMinutes - b.conflictMinutes);

  // Return the top N options
  return options.slice(0, maxResults);
}

// Generate high quality mock data in Vietnamese for a great onboarding experience
export function getOnboardingData(): { subjects: Subject[]; personal: PersonalSchedule[] } {
  return {
    subjects: [
      {
        id: 'sub-1',
        subjectName: 'Cơ sở dữ liệu',
        color: '#3b82f6', // blue
        sections: [
          {
            id: 'sec-1-1',
            className: 'LHP CSDL - Nhóm 1',
            teacherName: 'TS. Nguyễn Văn A',
            room: 'Phòng 403-A2',
            scheduleSlots: [
              { id: 'slot-1-1-1', dayOfWeek: 0, type: 'period', startPeriod: 1, numPeriods: 3 }, // Mon T1-3
            ],
          },
          {
            id: 'sec-1-2',
            className: 'LHP CSDL - Nhóm 2',
            teacherName: 'ThS. Trần Thị B',
            room: 'Phòng 102-C1',
            scheduleSlots: [
              { id: 'slot-1-2-1', dayOfWeek: 2, type: 'period', startPeriod: 3, numPeriods: 3 }, // Wed T3-5
            ],
          },
        ],
      },
      {
        id: 'sub-2',
        subjectName: 'Lập trình Web',
        color: '#10b981', // green
        sections: [
          {
            id: 'sec-2-1',
            className: 'LHP Web - Nhóm 1',
            teacherName: 'TS. Lê Hoàng C',
            room: 'Lab 3-B4',
            scheduleSlots: [
              { id: 'slot-2-1-1', dayOfWeek: 0, type: 'period', startPeriod: 3, numPeriods: 3 }, // Mon T3-5 (Conflicts with Nhóm 1 CSDL on Mon T1-3 overlap)
            ],
          },
          {
            id: 'sec-2-2',
            className: 'LHP Web - Nhóm 2',
            teacherName: 'TS. Lê Hoàng C',
            room: 'Lab 5-B4',
            scheduleSlots: [
              { id: 'slot-2-2-1', dayOfWeek: 3, type: 'period', startPeriod: 6, numPeriods: 3 }, // Thu T6-8
            ],
          },
        ],
      },
      {
        id: 'sub-3',
        subjectName: 'Toán chuyên đề',
        color: '#f59e0b', // amber / orange
        sections: [
          {
            id: 'sec-3-1',
            className: 'LHP Toán - Nhóm 1',
            teacherName: 'PGS. TS. Vũ Văn D',
            room: 'Phòng 502-A1',
            scheduleSlots: [
              { id: 'slot-3-1-1', dayOfWeek: 2, type: 'time', startTime: '09:00', endTime: '11:15' }, // Wed 09:00 - 11:15 (Overlaps with CSDL Nhóm 2 T3-5)
            ],
          },
          {
            id: 'sec-3-2',
            className: 'LHP Toán - Nhóm 2',
            teacherName: 'PGS. TS. Vũ Văn D',
            room: 'Phòng 201-A1',
            scheduleSlots: [
              { id: 'slot-3-2-1', dayOfWeek: 4, type: 'period', startPeriod: 2, numPeriods: 3 }, // Fri T2-4
            ],
          },
        ],
      },
    ],
    personal: [
      {
        id: 'pers-1',
        title: 'Học IELTS tại trung tâm',
        dayOfWeek: 4, // Friday
        startTime: '08:00',
        endTime: '10:00', // Overlaps with Toán Nhóm 2 Fri T2-4
        isActive: true,
      },
      {
        id: 'pers-2',
        title: 'Làm thêm ca tối',
        dayOfWeek: 5, // Saturday
        startTime: '18:00',
        endTime: '22:00',
        isActive: false,
      },
    ],
  };
}
