import React, { useState } from 'react';
import { Subject, ClassSection, TimeSlot } from '../types';
import { Plus, Trash2, Calendar, BookOpen, Clock, AlertCircle } from 'lucide-react';

interface SubjectManagerProps {
  subjects: Subject[];
  onUpdateSubjects: (subjects: Subject[]) => void;
}

// Preset modern colors
const SUBJECT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ef4444', // red
  '#14b8a6', // teal
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Thứ 2' },
  { value: 1, label: 'Thứ 3' },
  { value: 2, label: 'Thứ 4' },
  { value: 3, label: 'Thứ 5' },
  { value: 4, label: 'Thứ 6' },
  { value: 5, label: 'Thứ 7' },
  { value: 6, label: 'Chủ nhật' },
];

export default function SubjectManager({ subjects, onUpdateSubjects }: SubjectManagerProps) {
  const [newSubName, setNewSubName] = useState('');
  const [subColor, setSubColor] = useState(SUBJECT_COLORS[0]);

  // Editing states
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  
  // Section form states (inside a selected subject)
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [room, setRoom] = useState('');
  const [slots, setSlots] = useState<Omit<TimeSlot, 'id'>[]>([
    { dayOfWeek: 0, type: 'period', startPeriod: 1, numPeriods: 3 },
  ]);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const newSubject: Subject = {
      id: 'sub-' + Date.now(),
      subjectName: newSubName.trim(),
      color: subColor,
      sections: [],
    };

    const updated = [...subjects, newSubject];
    onUpdateSubjects(updated);
    setNewSubName('');
    // Cycle color
    const nextColorIdx = (SUBJECT_COLORS.indexOf(subColor) + 1) % SUBJECT_COLORS.length;
    setSubColor(SUBJECT_COLORS[nextColorIdx]);
    setSelectedSubId(newSubject.id);
  };

  const handleDeleteSubject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = subjects.filter((s) => s.id !== id);
    onUpdateSubjects(updated);
    if (selectedSubId === id) {
      setSelectedSubId(null);
    }
  };

  const handleAddSlotField = () => {
    setSlots([...slots, { dayOfWeek: 0, type: 'period', startPeriod: 1, numPeriods: 3 }]);
  };

  const handleRemoveSlotField = (idx: number) => {
    if (slots.length <= 1) return;
    setSlots(slots.filter((_, i) => i !== idx));
  };

  const handleSlotChange = (idx: number, field: keyof Omit<TimeSlot, 'id'>, value: any) => {
    const updated = slots.map((slot, i) => {
      if (i !== idx) return slot;
      
      const newSlot = { ...slot, [field]: value };
      
      // Provide defaults if switching types
      if (field === 'type') {
        if (value === 'period') {
          newSlot.startPeriod = 1;
          newSlot.numPeriods = 3;
          delete newSlot.startTime;
          delete newSlot.endTime;
        } else {
          newSlot.startTime = '08:00';
          newSlot.endTime = '11:15';
          delete newSlot.startPeriod;
          delete newSlot.numPeriods;
        }
      }
      return newSlot;
    });
    setSlots(updated);
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId || !className.trim()) return;

    const newSec: ClassSection = {
      id: 'sec-' + Date.now(),
      className: className.trim(),
      teacherName: teacherName.trim() || undefined,
      room: room.trim() || undefined,
      scheduleSlots: slots.map((s, i) => ({
        ...s,
        id: `slot-${Date.now()}-${i}`,
      })) as TimeSlot[],
    };

    const updated = subjects.map((sub) => {
      if (sub.id !== selectedSubId) return sub;
      return {
        ...sub,
        sections: [...sub.sections, newSec],
      };
    });

    onUpdateSubjects(updated);
    // Reset form
    setClassName('');
    setTeacherName('');
    setRoom('');
    setSlots([{ dayOfWeek: 0, type: 'period', startPeriod: 1, numPeriods: 3 }]);
  };

  const handleDeleteSection = (subId: string, secId: string) => {
    const updated = subjects.map((sub) => {
      if (sub.id !== subId) return sub;
      return {
        ...sub,
        sections: sub.sections.filter((sec) => sec.id !== secId),
      };
    });
    onUpdateSubjects(updated);
  };

  const activeSubject = subjects.find((s) => s.id === selectedSubId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-1 gap-6" id="subject-manager">
      {/* Subject List Panel */}
      <div className="lg:col-span-5 xl:col-span-1 bg-white shadow-sm border border-slate-100 rounded-xl p-5 flex flex-col h-[520px] xl:h-[350px]">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          Danh sách môn dự kiến ({subjects.length})
        </h3>

        {/* Quick Add Subject Form */}
        <form onSubmit={handleAddSubject} className="mb-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tên môn học</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="VD: Cơ sở dữ liệu, Mỹ thuật học..."
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" /> Thêm
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Màu nhận diện</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSubColor(c)}
                  className={`w-6 h-6 rounded-full transition-all duration-150 ${
                    subColor === c ? 'ring-2 ring-slate-800 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  title="Chọn màu"
                />
              ))}
            </div>
          </div>
        </form>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {subjects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 border border-dashed border-slate-200 rounded-lg">
              <AlertCircle className="w-8 h-8 text-slate-300" />
              <p className="text-xs text-center">Chưa có môn học nào. Nhập tên môn ở trên để bắt đầu!</p>
            </div>
          ) : (
            subjects.map((sub) => (
              <div
                key={sub.id}
                onClick={() => setSelectedSubId(sub.id)}
                className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                  selectedSubId === sub.id
                    ? 'border-slate-800 bg-slate-50'
                    : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                  <div className="text-left truncate">
                    <p className="text-sm font-medium text-slate-800 truncate">{sub.subjectName}</p>
                    <p className="text-xs text-slate-500">
                      {sub.sections.length} lớp học phần (LHP)
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteSubject(sub.id, e)}
                  className="p-1 px-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition shrink-0"
                  title="Xóa môn học này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Class Section Panel of current selected subject */}
      <div className="lg:col-span-7 xl:col-span-1 bg-white shadow-sm border border-slate-100 rounded-xl p-5 flex flex-col h-[520px] xl:h-[620px]">
        {activeSubject ? (
          <>
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeSubject.color }} />
              <h3 className="text-base font-semibold text-slate-800">
                Lớp học phần của: <span className="text-blue-600">{activeSubject.subjectName}</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 flex-1 min-h-0 overflow-y-auto">
              {/* Form to Add Section */}
              <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl flex flex-col justify-between overflow-y-auto">
                <form onSubmit={handleAddSection} className="space-y-3">
                  <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    Thêm lớp học phần mới
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Mã/Tên lớp</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Nhóm 1, L02"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Phòng (tùy chọn)</label>
                      <input
                        type="text"
                        placeholder="VD: 301-A2, Lab 2"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Giảng viên (tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="VD: TS. Nguyễn Văn A"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2 border-t border-slate-200/60 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Lịch học trong tuần
                      </label>
                      <button
                        type="button"
                        onClick={handleAddSlotField}
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Thêm buổi học
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {slots.map((slot, index) => (
                        <div key={index} className="bg-white p-2 rounded-lg border border-slate-200/80 space-y-2 text-left relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400">Buổi {index + 1}</span>
                            {slots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSlotField(index)}
                                className="text-red-500 hover:text-red-700 text-xs p-0.5"
                              >
                                Xóa buổi
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="block text-[9px] text-slate-400 font-medium uppercase">Thứ</label>
                              <select
                                value={slot.dayOfWeek}
                                onChange={(e) => handleSlotChange(index, 'dayOfWeek', Number(e.target.value))}
                                className="w-full p-1 text-xs border border-slate-200 rounded bg-slate-50"
                              >
                                {DAYS_OF_WEEK.map((d) => (
                                  <option key={d.value} value={d.value}>
                                    {d.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] text-slate-400 font-medium uppercase">Hình thức</label>
                              <select
                                value={slot.type}
                                onChange={(e) => handleSlotChange(index, 'type', e.target.value)}
                                className="w-full p-1 text-xs border border-slate-200 rounded bg-slate-50"
                              >
                                <option value="period">Tiết học</option>
                                <option value="time">Khung giờ</option>
                              </select>
                            </div>
                          </div>

                          {slot.type === 'period' ? (
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="block text-[9px] text-slate-400 font-medium uppercase">Tiết bắt đầu</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={15}
                                  value={slot.startPeriod}
                                  onChange={(e) => handleSlotChange(index, 'startPeriod', Number(e.target.value))}
                                  className="w-full p-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-slate-400 font-medium uppercase">Số tiết</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={slot.numPeriods}
                                  onChange={(e) => handleSlotChange(index, 'numPeriods', Number(e.target.value))}
                                  className="w-full p-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="block text-[9px] text-slate-400 font-medium uppercase">Từ (Giờ)</label>
                                <input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                                  className="w-full p-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-slate-400 font-medium uppercase">Đến (Giờ)</label>
                                <input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                                  className="w-full p-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-950 text-white rounded-lg text-xs font-semibold transition mt-2"
                  >
                    Lưu lớp học phần
                  </button>
                </form>
              </div>

              {/* View currently created sections */}
              <div className="flex flex-col h-full overflow-y-auto">
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 text-left">
                  Lớp đã tạo ({activeSubject.sections.length})
                </p>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {activeSubject.sections.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 border border-dashed border-slate-200 rounded-lg">
                      <Clock className="w-8 h-8 text-slate-300 mb-1" />
                      <p className="text-xs text-center">Chưa có lớp học phần nào cho môn này.</p>
                    </div>
                  ) : (
                    activeSubject.sections.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-3 bg-white border border-slate-100 rounded-lg hover:shadow-sm transition text-left relative group"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <div>
                            <h4 className="text-xs font-bold text-slate-700">{sec.className}</h4>
                            {sec.teacherName && (
                              <p className="text-[10px] text-slate-500">GV: {sec.teacherName}</p>
                            )}
                            {sec.room && (
                              <p className="text-[10px] text-slate-500">Phòng: {sec.room}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteSection(activeSubject.id, sec.id)}
                            className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Xóa nhóm này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Schedule detail */}
                        <div className="mt-2 space-y-1 border-t border-slate-50 pt-1.5">
                          {sec.scheduleSlots.map((slot, index) => (
                            <div key={slot.id} className="text-[10px] text-slate-600 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded">
                              <Calendar className="w-2.5 h-2.5 text-blue-500" />
                              <span className="font-medium">Thứ {slot.dayOfWeek === 6 ? 'Nhật' : slot.dayOfWeek + 2}: </span>
                              {slot.type === 'period' ? (
                                <span>Tiết {slot.startPeriod} - {slot.startPeriod! + slot.numPeriods! - 1}</span>
                              ) : (
                                <span>{slot.startTime} - {slot.endTime}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <BookOpen className="w-12 h-12 text-slate-200" />
            <p className="text-sm font-medium text-slate-500">Hãy chọn một môn học từ danh sách bên trái</p>
            <p className="text-xs text-slate-400 max-w-sm text-center">
              Sau khi chọn môn, bạn có thể tạo các mã nhóm lớp có ngày học, ca học khác nhau của môn đó.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
