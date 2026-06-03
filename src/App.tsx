import { useState, useEffect, useMemo } from 'react';
import { Subject, PersonalSchedule, TimetableOption } from './types';
import {
  findPerfectTimetables,
  findNearestTimetables,
  getOnboardingData,
} from './utils';
import SubjectManager from './components/SubjectManager';
import PersonalManager from './components/PersonalManager';
import CalendarView from './components/CalendarView';
import ConflictCenter from './components/ConflictCenter';
import SummaryStats from './components/SummaryStats';
import { Sparkles, Trash2, RefreshCw, CalendarRange, GraduationCap, Github } from 'lucide-react';

export default function App() {
  // 1. Load Initial State with localStorage support
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const stored = localStorage.getItem('STUDENT_SUBJECTS');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading subjects from localStorage', e);
    }
    return getOnboardingData().subjects;
  });

  const [personalSchedules, setPersonalSchedules] = useState<PersonalSchedule[]>(() => {
    try {
      const stored = localStorage.getItem('STUDENT_PERSONAL');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading personal schedule from localStorage', e);
    }
    return getOnboardingData().personal;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('STUDENT_SUBJECTS', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('STUDENT_PERSONAL', JSON.stringify(personalSchedules));
  }, [personalSchedules]);

  // 2. Compute Timetable Combinations (Runs instantly in native memoization!)
  const optionsStrKey = JSON.stringify(subjects) + JSON.stringify(personalSchedules);
  const { options, isPerfect } = useMemo(() => {
    // Try perfect schedules first
    let result = findPerfectTimetables(subjects, personalSchedules, 100);
    let perfect = true;

    if (result.length === 0 && subjects.length > 0 && subjects.every((s) => s.sections.length > 0)) {
      // Find nearest optimal schedules
      result = findNearestTimetables(subjects, personalSchedules, 20);
      perfect = false;
    }

    return { options: result, isPerfect: perfect };
  }, [optionsStrKey]);

  // Option Navigation State
  const [currentOptionIdx, setCurrentOptionIdx] = useState(0);

  // Clamp option index when solutions set changes
  useEffect(() => {
    setCurrentOptionIdx(0);
  }, [options.length]);

  // Tab Manager State
  const [activeTab, setActiveTab] = useState<'subject' | 'personal' | 'conflict'>('subject');

  const currentOption = options[currentOptionIdx] || null;

  // Actions
  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu hiện tại để nhập mới không?')) {
      setSubjects([]);
      setPersonalSchedules([]);
    }
  };

  const handleLoadSample = () => {
    const sample = getOnboardingData();
    setSubjects(sample.subjects);
    setPersonalSchedules(sample.personal);
  };

  const handleQuickTogglePersonal = (id: string) => {
    setPersonalSchedules((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans print:bg-white text-slate-800" id="timetable-root">
      
      {/* Visual Header Banner */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 md:px-12 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <GraduationCap className="w-5.5 h-4.5" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Web quản lý lập lịch</h1>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Tối ưu hóa thời khóa biểu tự động & giải quyết xung đột lịch học
              </p>
            </div>
          </div>

          {/* Quick utility controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
              title="Khôi phục lại dữ liệu mẫu chất lượng cao để trải nghiệm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Nạp lịch mẫu
            </button>
            <button
              onClick={handleResetData}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
              title="Xóa hết dữ liệu để tự điền lại từ đầu"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset sạch
            </button>
          </div>
        </div>
      </header>

      {/* Main Single-View Workspace Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Onboarding Empty Banner Alert if no subjects */}
        {subjects.length === 0 && (
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-left shadow-xs">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-blue-900">Chào mừng bạn đến với Web quản lý lập lịch học!</h4>
                <p className="text-xs text-blue-800 mt-1 max-w-2xl leading-relaxed">
                  Để trải nghiệm ngay cách ứng dụng tự động dàn tổ hợp lịch và né lịch bận cá nhân, bấm nút <span className="font-bold">"Nạp lịch mẫu"</span> ở góc trên bên phải. Bạn cũng có thể bắt đầu tự khai báo môn học bên dưới!
                </p>
              </div>
            </div>
            <button
              onClick={handleLoadSample}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              Nạp dữ liệu mẫu nhanh
            </button>
          </div>
        )}

        {/* Dynamic Timetable Quality Indicators stats */}
        {options.length > 0 && (
          <SummaryStats currentOption={currentOption} subjects={subjects} />
        )}

        {/* Workspace Dual-Split Structure */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Calendar View Taking Visual Lead (XL Screen 7/12 width) */}
          <div className="xl:col-span-7 h-full">
            <CalendarView
              subjects={subjects}
              personalSchedules={personalSchedules}
              options={options}
              currentOptionIdx={currentOptionIdx}
              onChangeOptionIdx={setCurrentOptionIdx}
            />
          </div>

          {/* Interactive Control Workspace Tabs (XL Screen 5/12 width) */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            
            {/* Tab Toggler Bar */}
            <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-xs">
              <button
                onClick={() => setActiveTab('subject')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'subject'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                📚 Môn học & LHP
              </button>
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'personal'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ⏰ Lịch bận cá nhân
              </button>
              <button
                onClick={() => setActiveTab('conflict')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition relative ${
                  activeTab === 'conflict'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ⚠️ Điểm nghẽn xung đột
                {!isPerfect && options.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                )}
              </button>
            </div>

            {/* Render selected active workspace tab body */}
            <div className="min-h-[520px]">
              {activeTab === 'subject' && (
                <SubjectManager subjects={subjects} onUpdateSubjects={setSubjects} />
              )}
              {activeTab === 'personal' && (
                <PersonalManager
                  personalSchedules={personalSchedules}
                  onUpdatePersonalSchedules={setPersonalSchedules}
                />
              )}
              {activeTab === 'conflict' && (
                <ConflictCenter
                  currentOption={currentOption}
                  subjects={subjects}
                  personalSchedules={personalSchedules}
                  onQuickTogglePersonal={handleQuickTogglePersonal}
                />
              )}
            </div>

          </div>

        </div>

      </main>

      {/* Decorative and Minimal Footer */}
      <footer className="py-6 mt-12 bg-white border-t border-slate-100 text-xs text-slate-400 text-center shrink-0 print:hidden">
        <p className="font-medium">© 2026 Web quản lý lập lịch học tự động. Thiết kế đồng hành cùng sinh viên Việt Nam.</p>
        <p className="text-[10px] mt-1 text-slate-400">Ứng dụng sắp xếp tổ hợp tối ưu hóa thuật toán đệ quy mượt mà.</p>
      </footer>

    </div>
  );
}
