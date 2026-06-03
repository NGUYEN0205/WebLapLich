import { Subject, ClassSection, PersonalSchedule, TimetableOption, Conflict, VIET_PERIODS_CONFIG } from '../types';
import { ChevronLeft, ChevronRight, AlertTriangle, Printer, CalendarRange } from 'lucide-react';
import { getSlotMinutesOfDay } from '../utils';

interface CalendarViewProps {
  subjects: Subject[];
  personalSchedules: PersonalSchedule[];
  options: TimetableOption[];
  currentOptionIdx: number;
  onChangeOptionIdx: (idx: number) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 to 22:00
const DAYS = [
  { value: 0, label: 'Thứ 2' },
  { value: 1, label: 'Thứ 3' },
  { value: 2, label: 'Thứ 4' },
  { value: 3, label: 'Thứ 5' },
  { value: 4, label: 'Thứ 6' },
  { value: 5, label: 'Thứ 7' },
  { value: 6, label: 'Chủ nhật' },
];

export default function CalendarView({
  subjects,
  personalSchedules,
  options,
  currentOptionIdx,
  onChangeOptionIdx,
}: CalendarViewProps) {
  const currentOption = options[currentOptionIdx] || null;

  // Print timetable handler
  const handlePrint = () => {
    window.print();
  };

  // Convert hours to absolute top percentage
  // Calendar bounds: 07:00 (420 mins) to 22:00 (1320 mins) -> 900 minutes total
  const START_CALENDAR_MINS = 7 * 60; // 420
  const TOTAL_CALENDAR_MINS = 15 * 60; // 900

  const getPositionStyles = (dayOfWeek: number, startMin: number, endMin: number) => {
    const startOffset = Math.max(0, startMin - START_CALENDAR_MINS);
    const endOffset = Math.min(TOTAL_CALENDAR_MINS, endMin - START_CALENDAR_MINS);
    const top = (startOffset / TOTAL_CALENDAR_MINS) * 100;
    const height = ((endOffset - startOffset) / TOTAL_CALENDAR_MINS) * 100;
    const left = (dayOfWeek * (100 / 7));
    const width = (100 / 7);

    return {
      top: `${top}%`,
      height: `${height}%`,
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  // Check if a section is in direct conflict in current choice
  const isSectionInConflict = (sectionId: string): { conflict: Conflict; color: string } | null => {
    if (!currentOption) return null;
    const c = currentOption.conflicts.find((conflict) =>
      conflict.entities.some((e) => e.id === sectionId)
    );
    if (c) {
      return { conflict: c, color: 'rgba(239, 68, 68, 0.15)' };
    }
    return null;
  };

  // Check if personal schedule is in conflict
  const isPersonalInConflict = (scheduleId: string): Conflict | null => {
    if (!currentOption) return null;
    return currentOption.conflicts.find((conflict) =>
      conflict.type === 'class-personal' && conflict.entities.some((e) => e.id === scheduleId)
    ) || null;
  };

  // Gather all items to render
  const renderItems: {
    id: string;
    type: 'class' | 'personal' | 'conflict-overlay';
    title: string;
    subtitle?: string;
    room?: string;
    dayOfWeek: number;
    startMin: number;
    endMin: number;
    color: string;
    textColor: string;
    borderColor: string;
    conflictInfo?: any;
    originalSection?: ClassSection;
    originalSubjectName?: string;
  }[] = [];

  if (currentOption) {
    // 1. Render class sections
    Object.entries(currentOption.selectedSections).forEach(([subjectId, section]) => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) return;

      section.scheduleSlots.forEach((slot) => {
        const { start: startMin, end: endMin } = getSlotMinutesOfDay(slot);
        const conflictStatus = isSectionInConflict(section.id);

        renderItems.push({
          id: `render-sec-${section.id}-${slot.id}`,
          type: 'class',
          title: subject.subjectName,
          subtitle: `${section.className}${section.teacherName ? ` - ${section.teacherName}` : ''}`,
          room: slot.type === 'period' ? `Tiết ${slot.startPeriod}-${slot.startPeriod! + slot.numPeriods! - 1} • Phòng: ${section.room || 'N/A'}` : `${slot.startTime} - ${slot.endTime} • Phòng: ${section.room || 'N/A'}`,
          dayOfWeek: slot.dayOfWeek,
          startMin,
          endMin,
          color: conflictStatus ? '#fee2e2' : subject.color + '20', // transparent color or light red if conflict
          textColor: conflictStatus ? '#991b1b' : '#1e293b',
          borderColor: conflictStatus ? '#ef4444' : subject.color,
          conflictInfo: conflictStatus ? conflictStatus.conflict : undefined,
          originalSection: section,
          originalSubjectName: subject.subjectName,
        });
      });
    });

    // 2. Render active personal schedules
    personalSchedules
      .filter((p) => p.isActive)
      .forEach((p) => {
        const startMin = p.startTime.split(':').map(Number)[0] * 60 + p.startTime.split(':').map(Number)[1];
        const endMin = p.endTime.split(':').map(Number)[0] * 60 + p.endTime.split(':').map(Number)[1];
        const hasConflict = isPersonalInConflict(p.id);

        renderItems.push({
          id: `render-pers-${p.id}`,
          type: 'personal',
          title: `Lịch bận: ${p.title}`,
          subtitle: 'Lập trình cá nhân',
          dayOfWeek: p.dayOfWeek,
          startMin,
          endMin,
          color: hasConflict ? '#fef3c7' : '#f1f5f9', // light orange if conflict, else gray
          textColor: hasConflict ? '#92400e' : '#475569',
          borderColor: hasConflict ? '#f59e0b' : '#cbd5e1',
          conflictInfo: hasConflict,
        });
      });

    // 3. Render exact conflict overlay (blinking red neon)
    currentOption.conflicts.forEach((conflict, i) => {
      const startMin = conflict.startMinutes % 1440;
      const endMin = conflict.endMinutes % 1440;

      renderItems.push({
        id: `conflict-overlay-${i}`,
        type: 'conflict-overlay',
        title: '⚠️ ĐIỂM XUNG ĐỘT',
        subtitle: conflict.description,
        dayOfWeek: conflict.dayOfWeek,
        startMin,
        endMin,
        color: 'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.15) 10px, rgba(239, 68, 68, 0.25) 10px, rgba(239, 68, 68, 0.25) 20px)',
        textColor: '#dc2626',
        borderColor: '#ef4444',
      });
    });
  }

  return (
    <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-5 flex flex-col h-full print:border-none print:shadow-none" id="calendar-view">
      {/* Calendar Header with togglers */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-800">
            Xem lịch phương án {options.length > 0 ? `(${currentOptionIdx + 1}/${options.length})` : ''}
          </h3>
        </div>

        {options.length > 0 ? (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => onChangeOptionIdx(Math.max(0, currentOptionIdx - 1))}
              disabled={currentOptionIdx === 0}
              className="p-1 text-slate-600 hover:bg-white rounded transition disabled:opacity-40"
              title="Phương án trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 min-w-[100px] text-center">
              Phương án {currentOptionIdx + 1}
            </span>
            <button
              onClick={() => onChangeOptionIdx(Math.min(options.length - 1, currentOptionIdx + 1))}
              disabled={currentOptionIdx === options.length - 1}
              className="p-1 text-slate-600 hover:bg-white rounded transition disabled:opacity-40"
              title="Phương án sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        <button
          onClick={handlePrint}
          disabled={options.length === 0}
          className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1 disabled:opacity-50"
        >
          <Printer className="w-3.5 h-3.5" /> In thời khóa biểu
        </button>
      </div>

      {options.length === 0 ? (
        <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl p-6">
          <CalendarRange className="w-12 h-12 text-slate-200" />
          <p className="text-sm font-medium">Chưa có phương án thời khóa biểu nào khả dụng.</p>
          <p className="text-xs text-slate-400 text-center max-w-sm">
            Vui lòng nhập môn học cùng các lớp học phần và lịch bận cá nhân ở các tab phía dưới để thuận toán tự động chạy.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto print:overflow-visible">
          {/* Main Calendar Body */}
          <div className="min-w-[800px] border border-slate-100 rounded-lg bg-slate-50/20 relative" style={{ height: '700px' }}>
            
            {/* Header: Days of the week */}
            <div className="grid grid-cols-12 border-b border-slate-100 bg-white sticky top-0 z-25 py-2.5 shadow-sm text-center">
              <div className="col-span-1 border-r border-slate-50 text-[11px] font-bold text-slate-400 flex items-center justify-center uppercase">
                Giờ
              </div>
              <div className="col-span-11 grid grid-cols-7">
                {DAYS.map((d) => (
                  <div key={d.value} className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {d.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Scrolling Grid Area */}
            <div className="absolute inset-x-0 bottom-0 top-[38px] grid grid-cols-12 overflow-hidden">
              
              {/* Hour Columns Labels */}
              <div className="col-span-1 bg-white border-r border-slate-100 flex flex-col justify-between relative h-full py-0">
                {HOURS.map((hr, idx) => {
                  const percentTop = (idx / HOURS.length) * 100;
                  return (
                    <div
                      key={hr}
                      className="absolute left-0 right-0 text-center border-t border-dotted border-slate-100 text-[10px] font-medium text-slate-400 py-1"
                      style={{ top: `${percentTop}%` }}
                    >
                      {String(hr).padStart(2, '0')}:00
                    </div>
                  );
                })}
              </div>

              {/* Day Grid lines + Absolute scheduled boxes */}
              <div className="col-span-11 relative h-full bg-white select-none">
                
                {/* Horizontal time grids */}
                {HOURS.map((hr, idx) => {
                  const percentTop = (idx / HOURS.length) * 100;
                  return (
                    <div
                      key={`grid-${hr}`}
                      className="absolute left-0 right-0 border-t border-slate-100/70"
                      style={{ top: `${percentTop}%` }}
                    />
                  );
                })}

                {/* Vertical day guides */}
                {Array.from({ length: 6 }).map((_, idx) => {
                  const percentLeft = ((idx + 1) / 7) * 100;
                  return (
                    <div
                      key={`guide-${idx}`}
                      className="absolute top-0 bottom-0 border-r border-slate-100/70"
                      style={{ left: `${percentLeft}%` }}
                    />
                  );
                })}

                {/* Render classes, personal, and conflict overlay blocks */}
                <div className="absolute inset-0 z-10">
                  {renderItems.map((item) => {
                    const pos = getPositionStyles(item.dayOfWeek, item.startMin, item.endMin);

                    if (item.type === 'conflict-overlay') {
                      return (
                        <div
                          key={item.id}
                          className="absolute z-20 border border-dashed rounded-md flex items-center justify-center p-1 overflow-hidden pointer-events-none animate-pulse"
                          style={{
                            ...pos,
                            background: item.color,
                            borderColor: item.borderColor,
                            color: item.textColor,
                          }}
                        >
                          <div className="text-[9px] font-bold text-center tracking-tight truncate px-1 bg-white/90 backdrop-blur-[1px] border border-red-200 rounded">
                            {item.title}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        className="absolute p-2.5 border-l-4 rounded bg-white shadow-sm hover:shadow transition-all text-left flex flex-col justify-between overflow-hidden"
                        style={{
                          top: pos.top,
                          height: pos.height,
                          left: `calc(${pos.left} + 2px)`,
                          width: `calc(${pos.width} - 4px)`,
                          borderColor: item.borderColor,
                          backgroundColor: item.color,
                        }}
                      >
                        {/* Box Details */}
                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-start justify-between gap-1">
                            <span
                              className="text-[10px] font-black truncate leading-tight tracking-tight"
                              style={{ color: item.textColor }}
                            >
                              {item.title}
                            </span>
                            {item.conflictInfo && (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-bounce shrink-0" />
                            )}
                          </div>
                          
                          {item.subtitle && (
                            <span className="text-[9px] text-slate-500 font-semibold truncate leading-normal mt-0.5">
                              {item.subtitle}
                            </span>
                          )}
                        </div>

                        {item.room && (
                          <div className="text-[8px] font-medium text-slate-400 mt-1 truncate border-t border-slate-200/40 pt-1">
                            {item.room}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
