"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Clock, Calendar, AlertCircle } from "lucide-react";

interface TimetableData {
  schedule: Record<string, any[]>;
  periodTimings: any[];
  message?: string;
}

export default function StudentTimetablePage() {
  const [scheduleData, setScheduleData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/institution/timetable/my-schedule?weekly=true');
      const data = await response.json();
      
      if (data.success && data.data) {
        setScheduleData(data.data);
      } else if (data.data?.message) {
        setError(data.data.message);
      } else {
        setError('Failed to load timetable');
      }
    } catch (error) {
      console.error("Error fetching timetable:", error);
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              My Timetable
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View your weekly class schedule
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
              <p className="text-yellow-600 dark:text-yellow-400">{error}</p>
            </div>
          ) : !scheduleData || !scheduleData.periodTimings || scheduleData.periodTimings.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No timetable available</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Period
                      </th>
                      {days.map((day) => (
                        <th
                          key={day}
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                        >
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {scheduleData.periodTimings.map((timing: any) => (
                      <tr key={timing.periodNumber}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Period {timing.periodNumber}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {timing.startTime} - {timing.endTime}
                          </div>
                        </td>
                        {days.map((day) => {
                          const slot = scheduleData.schedule?.[day]?.find((s: any) => s.periodNumber === timing.periodNumber);
                          return (
                            <td
                              key={`${day}-${timing.periodNumber}`}
                              className="px-2 py-2"
                            >
                              {timing.isBreak ? (
                                <div className="p-3 bg-gray-100 dark:bg-dark-700 rounded text-center text-xs text-gray-500 italic">
                                  Break
                                </div>
                              ) : slot?.subject ? (
                                <div 
                                  className="p-3 rounded-lg border-l-4"
                                  style={{
                                    backgroundColor: (slot.subject.color || '#3B82F6') + '20',
                                    borderLeftColor: slot.subject.color || '#3B82F6'
                                  }}
                                >
                                  <div className="text-xs font-semibold" style={{ color: slot.subject.color || '#3B82F6' }}>
                                    {slot.subject.code}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {slot.subject.name}
                                  </div>
                                  {slot.teacher && (
                                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                      {slot.teacher.fullName}
                                    </div>
                                  )}
                                  {slot.room && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      Room: {slot.room}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-3 bg-gray-50 dark:bg-dark-700/30 rounded text-center text-xs text-gray-400">
                                  Free
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
