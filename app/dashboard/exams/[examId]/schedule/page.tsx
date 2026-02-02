"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { ArrowLeft, Plus, Calendar, Clock, MapPin, Save } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  targetClasses: string[];
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface AcademicUnit {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  fullName: string;
}

interface Schedule {
  id: string;
  subject: Subject;
  academicUnit: AcademicUnit;
  examDate: string;
  startTime: string;
  endTime: string;
  room?: string;
  maxMarks: number;
  passingMarks: number;
}

export default function ExamSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    subjectId: "",
    academicUnitId: "",
    examDate: "",
    startTime: "09:00",
    endTime: "12:00",
    duration: 180,
    room: "",
    center: "",
    maxMarks: 100,
    passingMarks: 33,
    theoryMarks: 0,
    practicalMarks: 0,
    supervisorId: "",
    invigilators: [] as string[],
    instructions: "",
  });

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examRes, schedulesRes, subjectsRes, unitsRes, teachersRes] =
        await Promise.all([
          fetch(`/api/exams/${examId}`),
          fetch(`/api/exams/${examId}/schedules`),
          fetch("/api/institution/subjects"),
          fetch("/api/institution/academic-units"),
          fetch("/api/institution/teachers"),
        ]);

      const [examData, schedulesData, subjectsData, unitsData, teachersData] =
        await Promise.all([
          examRes.json(),
          schedulesRes.json(),
          subjectsRes.json(),
          unitsRes.json(),
          teachersRes.json(),
        ]);

      if (examData.success) setExam(examData.data);
      if (schedulesData.success) setSchedules(schedulesData.data);
      if (subjectsData.success) setSubjects(subjectsData.data);
      if (unitsData.success) {
        const targetClasses = examData.data?.targetClasses || [];
        setAcademicUnits(
          unitsData.data.filter((unit: AcademicUnit) =>
            targetClasses.includes(unit.id)
          )
        );
      }
      if (teachersData.success) setTeachers(teachersData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/exams/${examId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setShowAddForm(false);
        fetchData();
        resetForm();
      } else {
        alert(data.error || "Failed to create schedule");
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert("Failed to create schedule");
    }
  };

  const resetForm = () => {
    setFormData({
      subjectId: "",
      academicUnitId: "",
      examDate: "",
      startTime: "09:00",
      endTime: "12:00",
      duration: 180,
      room: "",
      center: "",
      maxMarks: 100,
      passingMarks: 33,
      theoryMarks: 0,
      practicalMarks: 0,
      supervisorId: "",
      invigilators: [],
      instructions: "",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="p-6 flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <button
            onClick={() => router.push("/dashboard/exams")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exams
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Exam Schedule
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {exam?.name} ({exam?.code})
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Schedule
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add Exam Schedule
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Class/Section *
                    </label>
                    <select
                      required
                      value={formData.academicUnitId}
                      onChange={(e) =>
                        setFormData({ ...formData, academicUnitId: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    >
                      <option value="">Select Class</option>
                      {academicUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject *
                    </label>
                    <select
                      required
                      value={formData.subjectId}
                      onChange={(e) =>
                        setFormData({ ...formData, subjectId: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.examDate}
                      onChange={(e) =>
                        setFormData({ ...formData, examDate: e.target.value })
                      }
                      min={exam?.startDate}
                      max={exam?.endDate}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Room/Venue
                    </label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) =>
                        setFormData({ ...formData, room: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                      placeholder="e.g., Room 101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Marks *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.maxMarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxMarks: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Passing Marks *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.passingMarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passingMarks: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Schedule
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
            {schedules.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No schedules created yet. Click "Add Schedule" to create one.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Venue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Marks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {schedules.map((schedule) => (
                      <tr
                        key={schedule.id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {schedule.academicUnit.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {schedule.subject.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {schedule.subject.code}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(schedule.examDate)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(schedule.startTime)} -{" "}
                            {formatTime(schedule.endTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {schedule.room ? (
                            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {schedule.room}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            Max: {schedule.maxMarks}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Pass: {schedule.passingMarks}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
