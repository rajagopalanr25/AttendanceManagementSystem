import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck2, Edit3, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import dayjs from 'dayjs';

export const TeacherAttendanceHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/teacher');
      if (res.data.success) {
        setSessions(res.data.recentSessions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSession = (session) => {
    const classId = session.class?._id || session._id.class;
    const subjectId = session.subject?._id || session._id.subject;
    const date = dayjs(session.date).format('YYYY-MM-DD');
    navigate(`/teacher/mark?classId=${classId}&subjectId=${subjectId}&date=${date}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Attendance History & Modifiable Sessions
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review all conducted class sessions and modify records within the allowed editing policy window
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Session Date</th>
                <th className="py-3 px-4">Subject Course</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Total Students</th>
                <th className="py-3 px-4">Present</th>
                <th className="py-3 px-4">Absent</th>
                <th className="py-3 px-4">On Duty</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8">
                    <EmptyState
                      title="No attendance sessions recorded yet"
                      description="Use the Mark Attendance interface to record class attendance."
                    />
                  </td>
                </tr>
              ) : (
                sessions.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {dayjs(s.date).format('YYYY-MM-DD (ddd)')}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {s.subject?.name} ({s.subject?.code})
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.class?.name}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{s.totalMarked}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{s.present}</td>
                    <td className="py-3 px-4 font-semibold text-rose-600">{s.absent}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{s.onDuty}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleEditSession(s)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Session
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

