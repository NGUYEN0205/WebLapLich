import React, { useState } from 'react';
import { PersonalSchedule } from '../types';
import { Trash2, Plus, Clock, ShieldAlert, ToggleLeft, ToggleRight } from 'lucide-react';

interface PersonalManagerProps {
  personalSchedules: PersonalSchedule[];
  onUpdatePersonalSchedules: (schedules: PersonalSchedule[]) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Thứ 2' },
  { value: 1, label: 'Thứ 3' },
  { value: 2, label: 'Thứ 4' },
  { value: 3, label: 'Thứ 5' },
  { value: 4, label: 'Thứ 6' },
  { value: 5, label: 'Thứ 7' },
  { value: 6, label: 'Chủ nhật' },
];

export default function PersonalManager({ personalSchedules, onUpdatePersonalSchedules }: PersonalManagerProps) {
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;

    const newPersonal: PersonalSchedule = {
      id: 'pers-' + Date.now(),
      title: title.trim(),
      dayOfWeek,
      startTime,
      endTime,
      isActive: true, // Active by default
    };

    onUpdatePersonalSchedules([...personalSchedules, newPersonal]);
    setTitle('');
  };

  const handleDelete = (id: string) => {
    onUpdatePersonalSchedules(personalSchedules.filter((p) => p.id !== id));
  };

  const handleToggleActive = (id: string) => {
    onUpdatePersonalSchedules(
      personalSchedules.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  return (
    <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-5 h-[520px] flex flex-col" id="personal-manager">
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2 shrink-0">
        <Clock className="w-5 h-5 text-indigo-500" />
        Lịch bận cá nhân ({personalSchedules.length})
      </h3>

      <form onSubmit={handleAdd} className="space-y-3 mb-5 shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Thêm lịch bận ngoài giờ
        </p>
        
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Tên hoạt động/lịch bận</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Đi làm thêm, Học IELTS, Phòng Gym..."
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Thứ</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Từ (Giờ)</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Đến (Giờ)</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" /> Thêm lịch bận
        </button>
      </form>

      {/* List of personal busy schedules */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {personalSchedules.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4 border border-dashed border-slate-200 rounded-lg">
            <ShieldAlert className="w-8 h-8 text-slate-300" />
            <p className="text-xs text-center">Chưa chọn lịch bận cá nhân nào.</p>
            <p className="text-[10px] text-center text-slate-400">
              Bạn có thể khai báo giờ làm thêm hay học thêm để thuật toán né đi giúp bạn.
            </p>
          </div>
        ) : (
          personalSchedules.map((p) => {
            const dayName = DAYS_OF_WEEK.find((d) => d.value === p.dayOfWeek)?.label || '';
            return (
              <div
                key={p.id}
                className={`p-3 rounded-lg border transition text-left flex items-center justify-between ${
                  p.isActive
                    ? 'border-indigo-100 bg-indigo-50/20'
                    : 'border-slate-100 bg-slate-50/50 opacity-60'
                }`}
              >
                <div>
                  <h4 className={`text-xs font-bold ${p.isActive ? 'text-indigo-950' : 'text-slate-600 line-through'}`}>
                    {p.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {dayName}: {p.startTime} - {p.endTime}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(p.id)}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition"
                    title={p.isActive ? 'Tạm tắt lịch bận này' : 'Bật lịch bận này'}
                  >
                    {p.isActive ? (
                      <ToggleRight className="w-6 h-6 text-indigo-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition"
                    title="Xóa lịch bận này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
