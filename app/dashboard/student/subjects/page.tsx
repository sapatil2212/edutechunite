"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { BookOpen, User, Clock, GraduationCap } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: string;
  color: string | null;
  icon: string | null;
  creditsPerWeek: number;
  isElective: boolean;
  course: {
    name: string;
  } | null;
  teachers: Teacher[];
}

interface SubjectsData {
  academicUnit: {
    id: string;
    name: string;
    type: string;
  };
  subjects: Subject[];
}

export default function StudentSubjectsPage() {
  const [data, setData] = useState<SubjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/student/subjects");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch subjects");
      }

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  const getSubjectTypeColor = (type: string) => {
    switch (type) {
      case "CORE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "ELECTIVE":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "LANGUAGE":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "ACTIVITY":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
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
              My Subjects
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View your enrolled subjects
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading subjects...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-8 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : !data || data.subjects.length === 0 ? (
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No subjects assigned to your class yet</p>
            </div>
          ) : (
            <>
              {/* Class Info */}
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-4 mb-6">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your Class</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {data.academicUnit.name}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      {data.subjects.length} Subject{data.subjects.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subjects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    {/* Header with color */}
                    <div
                      className="h-2"
                      style={{ backgroundColor: subject.color || "#3B82F6" }}
                    />

                    <div className="p-6">
                      {/* Subject Name and Code */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {subject.name}
                          </h3>
                          {subject.isElective && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                              Elective
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {subject.code}
                        </p>
                      </div>

                      {/* Description */}
                      {subject.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {subject.description}
                        </p>
                      )}

                      {/* Subject Type */}
                      <div className="mb-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getSubjectTypeColor(subject.type)}`}>
                          {subject.type.replace(/_/g, " ")}
                        </span>
                      </div>

                      {/* Credits */}
                      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{subject.creditsPerWeek} period{subject.creditsPerWeek !== 1 ? "s" : ""} per week</span>
                      </div>

                      {/* Teachers */}
                      {subject.teachers.length > 0 && (
                        <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Teacher{subject.teachers.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {subject.teachers.map((teacher) => (
                              <div key={teacher.id} className="text-sm text-gray-900 dark:text-white">
                                {teacher.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
