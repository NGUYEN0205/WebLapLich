import { TimetableOption, Subject, PersonalSchedule } from '../types';
import { ShieldX, AlertTriangle, ArrowRight, Lightbulb, UserCheck, RefreshCw } from 'lucide-react';
import { minutesToTimeString } from '../utils';

interface ConflictCenterProps {
  currentOption: TimetableOption | null;
  subjects: Subject[];
  personalSchedules: PersonalSchedule[];
  onQuickTogglePersonal: (id: string) => void;
}

export default function ConflictCenter({
  currentOption,
  subjects,
  personalSchedules,
  onQuickTogglePersonal,
}: ConflictCenterProps) {
  if (!currentOption || currentOption.conflictMinutes === 0) {
    return (
      <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-5 text-center flex flex-col items-center justify-center h-full min-h-[140px]" id="conflict-center">
        <UserCheck className="w-8 h-8 text-emerald-500 mb-1" />
        <h4 className="text-sm font-bold text-slate-800">Không có xung đột</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Thời khóa biểu này hoàn hảo, không trùng môn và không trùng bất cứ lịch bận cá nhân nào!
        </p>
      </div>
    );
  }

  // Convert conflict minutes to hours/periods
  const totalConflictHours = (currentOption.conflictMinutes / 60).toFixed(1);
  const totalPeriods = Math.ceil(currentOption.conflictMinutes / 45);

  const activePersonalIntervals = personalSchedules.filter((p) => p.isActive);

  return (
    <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-5 flex flex-col overflow-hidden text-left" id="conflict-center">
      {/* Visual warning header */}
      <div className="flex items-center gap-2.5 mb-4 shrink-0 border-b border-rose-50 pb-3">
        <ShieldX className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-red-700">Điểm nghẽn thời biểu (Trùng chéo lịch)</h3>
          <p className="text-[11px] text-slate-500">
            Tổ hợp này bị trùng khoảng <span className="font-bold text-slate-800">{totalConflictHours} giờ</span> (~ {totalPeriods} tiết học).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
        {/* List of Bottlenecks */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Danh sách trùng chéo cụ thể ({currentOption.conflicts.length})
          </p>

          {currentOption.conflicts.map((conflict, idx) => {
            const startStr = minutesToTimeString(conflict.startMinutes % 1440);
            const endStr = minutesToTimeString(conflict.endMinutes % 1440);
            const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
            const dayName = dayNames[conflict.dayOfWeek];

            return (
              <div
                key={idx}
                className="p-3 bg-red-50/50 border border-red-100 rounded-lg flex items-start gap-2 text-left"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold bg-red-100 text-red-800 px-1.5 py-0.5 rounded uppercase">
                    {dayName} ({startStr} - {endStr})
                  </span>
                  <p className="text-xs text-red-950 font-medium mt-1 leading-relaxed">
                    {conflict.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Recommendations */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Đề xuất xử lý xung đột
            </h4>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <div className="flex gap-1.5 items-start">
                <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <p>
                  Có <span className="font-bold text-slate-800">{currentOption.conflicts.filter(c => c.type === 'class-class').length} cặp môn trùng nhau</span>. Bạn có thể chọn cách đổi nhóm lớp học phần khác của một trong hai môn này.
                </p>
              </div>

              {currentOption.conflicts.some((c) => c.type === 'class-personal') && (
                <div className="flex gap-1.5 items-start">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <p>
                    Có môn học bị kẹt vào <span className="font-bold text-indigo-700">lịch bận cá nhân</span> của bạn. Hãy cân nhắc tạm tắt lịch cá nhân dưới đây để tìm phương án không trùng môn:
                  </p>
                </div>
              )}
            </div>

            {/* Quick toggle list of personal schedules to free up time */}
            {activePersonalIntervals.length > 0 && (
              <div className="mt-3 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Click để tắt nhanh lịch bận:</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {activePersonalIntervals.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onQuickTogglePersonal(p.id)}
                      className="px-2 py-1 text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-100 transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-200/55 pt-2 mt-2">
            💡 <span className="italic">Mẹo: Hệ thống sắp xếp các phương án thất bại theo chỉ số trùng khớp tăng dần (phương án ít tốn tiết trùng nhất tự động hiển thị trước).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
