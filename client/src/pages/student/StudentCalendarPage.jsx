import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Check,
  X,
  Clock,
  Info
} from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import dayjs from 'dayjs';

export const StudentCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [calendarData, setCalendarData] = useState({});
  const [monthSummary, setMonthSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Subject filter
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  // Selected date dialog details
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [dayDetailsModal, setDayDetailsModal] = useState(false);

  useEffect(() => {
    fetchStudentSubjects();
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, selectedSubject]);

  const fetchStudentSubjects = async () => {
    try {
      const res = await api.get('/dashboard/student');
      if (res.data.success) {
        setSubjects(res.data.subjects || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const params = {
        month: currentDate.month() + 1,
        year: currentDate.year(),
        subjectId: selectedSubject || undefined
      };
      const res = await api.get('/attendance/calendar', { params });
      if (res.data.success) {
        setCalendarData(res.data.calendar || {});
        setMonthSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => setCurrentDate((d) => d.subtract(1, 'month'));
  const nextMonth = () => setCurrentDate((d) => d.add(1, 'month'));

  // Calendar Day Generation
  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const daysInMonth = currentDate.daysInMonth();
  const startDayOfWeek = startOfMonth.day(); // 0 is Sunday

  const daysArray = [];
  // Add empty filler slots for previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }
  // Add actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = currentDate.date(d).format('YYYY-MM-DD');
    daysArray.push({
      dayNumber: d,
      dateKey: dayStr,
      sessions: calendarData[dayStr] || []
    });
  }

  const handleDayClick = (dayObj) => {
    if (!dayObj || !dayObj.sessions || dayObj.sessions.length === 0) return;
    setSelectedDayKey(dayObj.dateKey);
    setDayDetailsModal(true);
  };

  const selectedDaySessions = selectedDayKey ? calendarData[selectedDayKey] || [] : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Attendance Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Color-coded interactive monthly attendance calendar with detailed lecture session inspections
          </p>
        </div>

        {/* Course Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
          >
            <option value="">All Courses</option>
            {subjects.map((s) => (
              <option key={s.subjectId} value={s.subjectId}>
                {s.subjectCode} - {s.subjectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Summary Bar & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm font-bold text-slate-900">
            {currentDate.format('MMMM YYYY')}
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-600">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600">On Duty</span>
          </div>
        </div>

        {/* Month Score */}
        {monthSummary && (
          <div className="text-xs font-semibold text-slate-800">
            Month Rate:{' '}
            <strong className="text-blue-700">
              {monthSummary.percentage !== null ? `${monthSummary.percentage}%` : 'N/A'}
            </strong>{' '}
            ({monthSummary.attended || 0}/{monthSummary.total || 0} classes)
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Month Cells Grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysArray.map((dayObj, idx) => {
            if (!dayObj) {
              return <div key={`empty-${idx}`} className="h-24 rounded-xl bg-slate-50/50" />;
            }

            const hasSessions = dayObj.sessions.length > 0;
            const hasAbsent = dayObj.sessions.some((s) => s.status === 'Absent');
            const hasOnDuty = dayObj.sessions.some((s) => s.status === 'On Duty');
            const allPresent = dayObj.sessions.every((s) => s.status === 'Present');

            return (
              <div
                key={dayObj.dateKey}
                onClick={() => handleDayClick(dayObj)}
                className={`h-24 p-2 rounded-xl border flex flex-col justify-between transition-all ${
                  hasSessions
                    ? 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs cursor-pointer'
                    : 'border-slate-100 bg-slate-50/40 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${hasSessions ? 'text-slate-800' : 'text-slate-400'}`}>
                    {dayObj.dayNumber}
                  </span>
                  {hasSessions && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dayObj.sessions.length} class{dayObj.sessions.length > 1 ? 'es' : ''}
                    </span>
                  )}
                </div>

                {/* Session Badges / Dots */}
                <div className="space-y-1">
                  {dayObj.sessions.slice(0, 2).map((s, sIdx) => {
                    const dotColor =
                      s.status === 'Present'
                        ? 'bg-emerald-500 text-emerald-800 border-emerald-200'
                        : s.status === 'On Duty'
                        ? 'bg-blue-500 text-blue-800 border-blue-200'
                        : 'bg-rose-500 text-rose-800 border-rose-200';

                    return (
                      <div
                        key={sIdx}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold truncate bg-slate-100/70"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor.split(' ')[0]}`} />
                        <span className="truncate">{s.subjectCode || 'Class'}</span>
                      </div>
                    );
                  })}
                  {dayObj.sessions.length > 2 && (
                    <div className="text-[9px] text-slate-400 font-semibold pl-1">
                      +{dayObj.sessions.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Details Modal */}
      <Modal
        isOpen={dayDetailsModal}
        onClose={() => setDayDetailsModal(false)}
        title={`Attendance Log: ${selectedDayKey ? dayjs(selectedDayKey).format('MMMM DD, YYYY') : ''}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-3">
          {selectedDaySessions.map((session, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs"
            >
              <div>
                <span className="font-mono text-[11px] font-bold text-blue-700">
                  {session.subjectCode}
                </span>
                <p className="font-semibold text-slate-900 mt-0.5">{session.subjectName}</p>
                {session.remarks && (
                  <p className="text-[11px] text-slate-500 italic mt-0.5">
                    Note: {session.remarks}
                  </p>
                )}
              </div>

              <Badge
                variant={
                  session.status === 'Present'
                    ? 'present'
                    : session.status === 'On Duty'
                    ? 'onDuty'
                    : 'absent'
                }
              >
                {session.status}
              </Badge>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setDayDetailsModal(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

