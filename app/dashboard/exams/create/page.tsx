"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { ArrowLeft, Save } from "lucide-react";

interface AcademicYear {
  id: string;
  name: string;
}

interface AcademicUnit {
  id: string;
  name: string;
}

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    examType: "MID_TERM",
    academicYearId: "",
    targetClasses: [] as string[],
    startDate: "",
    endDate: "",
    evaluationType: "MARKS_BASED",
    examMode: "OFFLINE",
    overallPassingPercentage: 33,
    subjectWisePassing: true,
    showRank: true,
    showPercentage: true,
    showGrade: true,
    allowMarksCorrection: false,
    weightage: 100,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [yearsRes, unitsRes] = await Promise.all([
        fetch("/api/institution/academic-years"),
        fetch("/api/institution/academic-units"),
      ]);

      const [yearsData, unitsData] = await Promise.all([
        yearsRes.json(),
        unitsRes.json(),
      ]);

      if (yearsData.success) setAcademicYears(yearsData.data);
      if (unitsData.success) setAcademicUnits(unitsData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/dashboard/exams");
      } else {
        alert(data.error || "Failed to create exam");
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      alert("Failed to create exam");
    } finally {
      setLoading(false);
    }
  };

  const handleClassToggle = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetClasses: prev.targetClasses.includes(classId)
        ? prev.targetClasses.filter((id) => id !== classId)
        : [...prev.targetClasses, classId],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exams
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Create New Exam
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Set up a new examination for your institution
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exam Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    placeholder="e.g., Mid-Term Examination 2025-26"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exam Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    placeholder="e.g., MID-2025"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    placeholder="Enter exam description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exam Type *
                  </label>
                  <select
                    required
                    value={formData.examType}
                    onChange={(e) =>
                      setFormData({ ...formData, examType: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                  >
                    <option value="UNIT_TEST">Unit Test</option>
                    <option value="MONTHLY_TEST">Monthly Test</option>
                    <option value="MID_TERM">Mid-Term</option>
                    <option value="FINAL">Final</option>
                    <option value="PRACTICAL">Practical</option>
                    <option value="SEMESTER_EXAM">Semester Exam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Academic Year *
                  </label>
                  <select
                    required
                    value={formData.academicYearId}
                    onChange={(e) =>
                      setFormData({ ...formData, academicYearId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Target Classes *
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {academicUnits.map((unit) => (
                  <label
                    key={unit.id}
                    className="flex items-center gap-2 p-3 border border-gray-300 dark:border-dark-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700"
                  >
                    <input
                      type="checkbox"
                      checked={formData.targetClasses.includes(unit.id)}
                      onChange={() => handleClassToggle(unit.id)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {unit.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Exam Schedule
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-lg p-6 border border-gray-200 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Evaluation Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Evaluation Type
                  </label>
                  <select
                    value={formData.evaluationType}
                    onChange={(e) =>
                      setFormData({ ...formData, evaluationType: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                  >
                    <option value="MARKS_BASED">Marks Based</option>
                    <option value="GRADE_BASED">Grade Based</option>
                    <option value="PERCENTAGE_BASED">Percentage Based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exam Mode
                  </label>
                  <select
                    value={formData.examMode}
                    onChange={(e) =>
                      setFormData({ ...formData, examMode: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                  >
                    <option value="OFFLINE">Offline</option>
                    <option value="ONLINE">Online</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overall Passing Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.overallPassingPercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overallPassingPercentage: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weightage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.weightage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weightage: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.subjectWisePassing}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subjectWisePassing: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Subject-wise passing required
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showRank}
                    onChange={(e) =>
                      setFormData({ ...formData, showRank: e.target.checked })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Show rank in results
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showPercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        showPercentage: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Show percentage in results
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showGrade}
                    onChange={(e) =>
                      setFormData({ ...formData, showGrade: e.target.checked })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Show grade in results
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowMarksCorrection}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowMarksCorrection: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Allow marks correction after submission
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.targetClasses.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-dark-900 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? "Creating..." : "Create Exam"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
