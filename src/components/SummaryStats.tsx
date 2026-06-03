import { TimetableOption, Subject } from '../types';
import { CalendarRange, Info, Award, Heart, HelpCircle, CheckCircle2 } from 'lucide-react';
import { getSlotMinutesOfDay } from '../utils';

interface SummaryStatsProps {
  currentOption: TimetableOption | null;
  subjects: Subject[];
}

export default function SummaryStats({ currentOption, subjects }: SummaryStatsProps) {
  if (!currentOption) {
    return null;
  }

  const selectedEntries = Object.entries(currentOption.selectedSections);
  const totalSubjects = selectedEntries.length;

  // Calculate total periods and active days of class
  let totalPeriods = 0;
  const activeClassDays = new Set<number>();

  selectedEntries.forEach(([_, section]) => {
    section.scheduleSlots.forEach((slot) => {
      activeClassDays.add(slot.dayOfWeek);
      if (slot.type === 'period') {
        totalPeriods += slot.numPeriods || 0;
      } else {
        // Approximate time-based slots as 3 periods if not specified
        const start = slot.startTime ? slot.startTime.split(':').map(Number) : [8, 0];
        const end = slot.endTime ? slot.endTime.split(':').map(Number) : [11, 0];
        const durationMins = (end[0]*60 + end[1]) - (start[0]*60 + start[1]);
        totalPeriods += Math.ceil(durationMins / 45);
      }
    });
  });

  // Calculate days off
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const daysOffIndices = [0, 1, 2, 3, 4, 5, 6].filter((d) => !activeClassDays.has(d));
  const daysOffNames = daysOffIndices.map((i) => dayNames[i]);

  // Longest day off run or interesting quality metrics
  const hasWeekendFree = !activeClassDays.has(5) && !activeClassDays.has(6);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="summary-stats">
      {/* Stat 1: Total Credits / Subjects */}
      <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-xs flex items-center gap-3.5 text-left">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
          <CalendarRange className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng số môn xếp lịch</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{totalSubjects} môn học</p>
          <p className="text-[10px] text-slate-500 font-medium">Khoảng {totalPeriods} tiết / tuần</p>
        </div>
      </div>

      {/* Stat 2: Days Off list */}
      <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-xs flex items-center gap-3.5 text-left">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Số ngày trống lịch (Off)</p>
          <p className="text-sm font-bold text-emerald-700 mt-0.5 truncate">
            {daysOffNames.length > 0 ? `${daysOffNames.length} ngày` : 'Không có ngày trống'}
          </p>
          <p className="text-[10px] text-slate-500 font-semibold truncate" title={daysOffNames.join(', ')}>
            {daysOffNames.length > 0 ? `Trống: ${daysOffNames.join(', ')}` : 'Học kín cả tuần'}
          </p>
        </div>
      </div>

      {/* Stat 3: Timetable Health Score */}
      <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-xs flex items-center gap-3.5 text-left">
        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đánh giá chất lượng</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">
            {currentOption.conflictMinutes === 0 ? 'Lịch học hoàn hảo ✨' : 'Cần đổi lớp ⚠️'}
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            {hasWeekendFree ? 'Nghỉ trọn vẹn Cuối tuần!' : 'Chân chạy cả tuần'}
          </p>
        </div>
      </div>
    </div>
  );
}
