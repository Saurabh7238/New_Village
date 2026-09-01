'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AppointmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(false);

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const res = await fetch('/api/admin/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters: {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setAppointments(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [currentDate]);

  const getAppointmentsForDay = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return appointments.filter((apt) => apt.appointmentDate?.split('T')[0] === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const days = [];
  const firstDay = firstDayOfMonth(currentDate);
  const monthDays = daysInMonth(currentDate);

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of month
  for (let i = 1; i <= monthDays; i++) {
    days.push(i);
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-lg bg-white p-6 dark:bg-slate-800">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{monthName}</h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="rounded bg-slate-200 p-2 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextMonth}
              className="rounded bg-slate-200 p-2 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-slate-100 p-2 text-center font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, idx) => {
          const dayAppointments = day ? getAppointmentsForDay(day) : [];
          const isToday =
            day &&
            new Date().getDate() === day &&
            new Date().getMonth() === currentDate.getMonth() &&
            new Date().getFullYear() === currentDate.getFullYear();

          return (
            <div
              key={idx}
              onClick={() => day && setSelectedDay(day)}
              className={`min-h-20 border p-2 cursor-pointer transition ${
                day
                  ? isToday
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : selectedDay === day
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700'
                  : 'bg-slate-50 dark:bg-slate-700'
              }`}
            >
              {day && (
                <>
                  <div className="font-bold text-slate-900 dark:text-white">{day}</div>
                  <div className="mt-1 space-y-1">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt._id}
                        className="truncate rounded bg-blue-100 px-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {apt.serviceType}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        +{dayAppointments.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
            Appointments for {currentDate.toLocaleString('default', { month: 'long' })} {selectedDay}
          </h3>
          {getAppointmentsForDay(selectedDay).length > 0 ? (
            <div className="space-y-2">
              {getAppointmentsForDay(selectedDay).map((apt) => (
                <div
                  key={apt._id}
                  className="rounded border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-800"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{apt.serviceType}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{apt.citizenInfo?.name}</p>
                    </div>
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-bold ${
                        apt.status === 'Approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : apt.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(apt.appointmentDate).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-400">No appointments scheduled for this day</p>
          )}
        </div>
      )}
    </div>
  );
}
