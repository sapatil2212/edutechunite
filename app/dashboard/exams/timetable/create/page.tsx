"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Dropdown } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  Users,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  CheckSquare,
  Square,
} from "lucide-react";

interface ExamSlot {
  id: string;
  date: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  minMarks: number;
  supervisorId: string;
  room: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string | null;
}

interface Teacher {
  id: string;
  fullName: string;
  employeeId: string;
}

export default function CreateExamTimetablePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Data states
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    academicYearId: "",
    classId: "",
    sectionIds: [] as string[],
    allSections: false,
    examName: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // Exam slots state - now supports multiple exams per day
  const [examSlots, setExamSlots] = useState<ExamSlot[]>([]);

  // Modal states
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotModalError, setSlotModalError] = useState("");
  const [slotForm, setSlotForm] = useState({
    subjectId: "",
    startTime: "09:00",
    endTime: "12:00",
    maxMarks: 100,
    minMarks: 33,
    supervisorId: "",
    room: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [yearsRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
        fetch("/api/institution/academic-years"),
        fetch("/api/institution/academic-units?parentId=null"),
        fetch("/api/institution/subjects"),
        fetch("/api/institution/teachers"),
      ]);

      const [yearsData, classesData, subjectsData, teachersData] = await Promise.all([
        yearsRes.json(),
        classesRes.json(),
        subjectsRes.json(),
        teachersRes.json(),
      ]);

      setAcademicYears(yearsData.academicYears || yearsData.data || []);
      // Filter only classes (units without parent)
      const allUnits = classesData.academicUnits || classesData.data || [];
      setClasses(allUnits.filter((u: any) => !u.parentId));
      setSubjects(subjectsData.subjects || subjectsData.data || []);
      setTeachers(teachersData.teachers || teachersData.data || []);

      // Set current academic year
      const currentYear = (yearsData.academicYears || yearsData.data || []).find((y: any) => y.isCurrent);
      if (currentYear) {
        setFormData(prev => ({ ...prev, academicYearId: currentYear.id }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (classId: string) => {
    try {
      const res = await fetch(`/api/institution/academic-units?parentId=${classId}`);
      const data = await res.json();
      setSections(data.academicUnits || data.data || []);
    } catch (error) {
      console.error("Error fetching sections:", error);
      setSections([]);
    }
  };

  const handleClassChange = (classId: string) => {
    setFormData({ 
      ...formData, 
      classId, 
      sectionIds: [],
      allSections: false,
    });
    setSections([]);
    if (classId) {
      fetchSections(classId);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    const newSectionIds = formData.sectionIds.includes(sectionId)
      ? formData.sectionIds.filter(id => id !== sectionId)
      : [...formData.sectionIds, sectionId];
    
    setFormData({
      ...formData,
      sectionIds: newSectionIds,
      allSections: newSectionIds.length === sections.length,
    });
  };

  const handleAllSectionsToggle = () => {
    if (formData.allSections) {
      setFormData({ ...formData, sectionIds: [], allSections: false });
    } else {
      setFormData({ 
        ...formData, 
        sectionIds: sections.map(s => s.id), 
        allSections: true 
      });
    }
  };

  // Generate dates between start and end date
  const getExamDates = (): string[] => {
    if (!formData.startDate || !formData.endDate) return [];
    
    const dates: string[] = [];
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    while (start <= end) {
      dates.push(start.toISOString().split('T')[0]);
      start.setDate(start.getDate() + 1);
    }
    
    return dates;
  };

  const openSlotModal = (date: string, slotId?: string) => {
    setSelectedDate(date);
    setEditingSlotId(slotId || null);
    setSlotModalError("");
    
    if (slotId) {
      // Editing existing slot
      const existingSlot = examSlots.find(s => s.id === slotId);
      if (existingSlot) {
        setSlotForm({
          subjectId: existingSlot.subjectId,
          startTime: existingSlot.startTime,
          endTime: existingSlot.endTime,
          maxMarks: existingSlot.maxMarks,
          minMarks: existingSlot.minMarks,
          supervisorId: existingSlot.supervisorId,
          room: existingSlot.room,
        });
      }
    } else {
      // Adding new slot
      setSlotForm({
        subjectId: "",
        startTime: "09:00",
        endTime: "12:00",
        maxMarks: 100,
        minMarks: 33,
        supervisorId: "",
        room: "",
      });
    }
    
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = () => {
    setSlotModalError("");
    
    if (!selectedDate || !slotForm.subjectId) {
      setSlotModalError("Please select a subject");
      return;
    }

    const subject = subjects.find(s => s.id === slotForm.subjectId);
    if (!subject) return;

    // Validation: Check if same subject is already scheduled (not when editing the same slot)
    const existingSubjectSlot = examSlots.find(s => 
      s.subjectId === slotForm.subjectId && s.id !== editingSlotId
    );
    if (existingSubjectSlot) {
      setSlotModalError(`${subject.name} is already scheduled on ${formatDate(existingSubjectSlot.date)}`);
      return;
    }

    // Validation: Check for time overlap on the same day
    const slotsOnSameDay = examSlots.filter(s => 
      s.date === selectedDate && s.id !== editingSlotId
    );
    
    const newStart = slotForm.startTime;
    const newEnd = slotForm.endTime;
    
    for (const existingSlot of slotsOnSameDay) {
      const existingStart = existingSlot.startTime;
      const existingEnd = existingSlot.endTime;
      
      // Check if times overlap
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        setSlotModalError(`Time overlaps with ${existingSlot.subjectName} (${existingStart} - ${existingEnd})`);
        return;
      }
    }

    if (editingSlotId) {
      // Update existing slot
      setExamSlots(prev => prev.map(s => 
        s.id === editingSlotId 
          ? {
              ...s,
              subjectId: slotForm.subjectId,
              subjectName: subject.name,
              subjectCode: subject.code,
              subjectColor: subject.color || "#3B82F6",
              startTime: slotForm.startTime,
              endTime: slotForm.endTime,
              maxMarks: slotForm.maxMarks,
              minMarks: slotForm.minMarks,
              supervisorId: slotForm.supervisorId,
              room: slotForm.room,
            }
          : s
      ));
    } else {
      // Add new slot (multiple exams per day allowed)
      const newSlot: ExamSlot = {
        id: `${selectedDate}-${Date.now()}`,
        date: selectedDate,
        subjectId: slotForm.subjectId,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectColor: subject.color || "#3B82F6",
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        maxMarks: slotForm.maxMarks,
        minMarks: slotForm.minMarks,
        supervisorId: slotForm.supervisorId,
        room: slotForm.room,
      };

      setExamSlots(prev => [...prev, newSlot].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      }));
    }

    setIsSlotModalOpen(false);
    setEditingSlotId(null);
    setSuccessMessage("Exam slot saved");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleRemoveSlot = (slotId: string) => {
    setExamSlots(prev => prev.filter(s => s.id !== slotId));
  };

  const handleSave = async (isDraft: boolean) => {
    try {
      setSaving(true);
      setError("");

      // Validate form
      if (!formData.academicYearId || !formData.classId || !formData.examName) {
        setError("Please fill in all required fields");
        setSaving(false);
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        setError("Please select exam start and end dates");
        setSaving(false);
        return;
      }

      if (examSlots.length === 0) {
        setError("Please add at least one exam slot");
        setSaving(false);
        return;
      }

      // Get class name
      const selectedClass = classes.find(c => c.id === formData.classId);

      // Determine academicUnitId - use first section if selected, otherwise class
      const academicUnitId = formData.sectionIds.length > 0 
        ? formData.sectionIds[0] 
        : formData.classId;

      const payload = {
        academicYearId: formData.academicYearId,
        academicUnitId,
        classId: formData.classId,
        className: selectedClass?.name || "",
        sectionId: formData.sectionIds.length > 0 ? formData.sectionIds[0] : null,
        sectionName: formData.allSections 
          ? "All Sections" 
          : sections.filter(s => formData.sectionIds.includes(s.id)).map(s => s.name).join(", "),
        examName: formData.examName,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: isDraft ? "DRAFT" : "PUBLISHED",
        slots: examSlots.map((slot, index) => ({
          slotOrder: index + 1,
          examDate: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subjectId: slot.subjectId,
          maxMarks: slot.maxMarks,
          minMarks: slot.minMarks,
          supervisorId: slot.supervisorId || null,
          supervisorName: null,
          type: "EXAM",
          room: slot.room || null,
          instructions: null,
        })),
      };

      const res = await fetch("/api/exams/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(
          isDraft
            ? "Timetable saved as draft"
            : "Timetable published successfully!"
        );
        setTimeout(() => {
          router.push("/dashboard/exams/timetable");
        }, 1500);
      } else {
        setError(data.error || "Failed to save timetable");
      }
    } catch (error) {
      console.error("Error saving timetable:", error);
      setError("Failed to save timetable");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <DashboardSidebar />
        <DashboardHeader />
        <main className="ml-64 pt-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  const examDates = getExamDates();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />

      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 right-6 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
                <button onClick={() => setError("")} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push("/dashboard/exams/timetable")}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create Exam Timetable
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Schedule exams for your classes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Panel - Configuration */}
            <div className="space-y-4">
              {/* Basic Info Card */}
              <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Exam Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs mb-1 block">Academic Year</Label>
                    <Dropdown
                      options={academicYears.map((y) => ({ value: y.id, label: y.name }))}
                      value={formData.academicYearId}
                      onChange={(value) => setFormData({ ...formData, academicYearId: value })}
                      placeholder="Select Year"
                    />
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">Class <span className="text-red-500">*</span></Label>
                    <Dropdown
                      options={classes.map((c) => ({ value: c.id, label: c.name }))}
                      value={formData.classId}
                      onChange={handleClassChange}
                      placeholder="Select Class"
                      searchable
                    />
                  </div>

                  {/* Sections with checkboxes */}
                  {formData.classId && sections.length > 0 && (
                    <div>
                      <Label className="text-xs mb-2 block">Sections</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto bg-gray-50 dark:bg-dark-700 rounded-lg p-2">
                        {/* All Sections checkbox */}
                        <button
                          type="button"
                          onClick={handleAllSectionsToggle}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                        >
                          {formData.allSections ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            All Sections
                          </span>
                        </button>
                        <div className="border-t border-gray-200 dark:border-dark-600 my-1" />
                        {sections.map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => handleSectionToggle(section.id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                          >
                            {formData.sectionIds.includes(section.id) ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {section.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs mb-1 block">Exam Name <span className="text-red-500">*</span></Label>
                    <input
                      type="text"
                      value={formData.examName}
                      onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                      placeholder="e.g., Mid Term Exam"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">Description</Label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range Card */}
              <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Exam Period
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs mb-1 block">Start Date <span className="text-red-500">*</span></Label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">End Date <span className="text-red-500">*</span></Label>
                    <input
                      type="date"
                      value={formData.endDate}
                      min={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Summary
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{examDates.length}</p>
                    <p className="text-xs text-gray-500">Days</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{examSlots.length}</p>
                    <p className="text-xs text-gray-500">Exams</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{subjects.length}</p>
                    <p className="text-xs text-gray-500">Subjects</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {formData.allSections ? sections.length : formData.sectionIds.length || 1}
                    </p>
                    <p className="text-xs text-gray-500">Sections</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Calendar Grid */}
            <div className="xl:col-span-3">
              <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Exam Schedule
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Click on a date to assign an exam
                  </p>
                </div>

                {examDates.length === 0 ? (
                  <div className="p-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Select start and end dates to view the exam calendar
                    </p>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {examDates.map((date) => {
                        const dateSlots = examSlots.filter(s => s.date === date);
                        const isSunday = new Date(date).getDay() === 0;

                        return (
                          <div
                            key={date}
                            className={`
                              relative p-4 rounded-xl border-2 transition-all text-left
                              ${isSunday 
                                ? 'bg-gray-100 dark:bg-dark-700 border-gray-200 dark:border-dark-600 opacity-60'
                                : dateSlots.length > 0
                                  ? 'border-primary/30 bg-primary/5'
                                  : 'border-dashed border-gray-300 dark:border-dark-500 bg-gray-50 dark:bg-dark-700/30'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {getDayName(date)}
                              </span>
                              {dateSlots.length > 0 && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                                  {dateSlots.length} exam{dateSlots.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                              {formatDate(date)}
                            </div>

                            {isSunday ? (
                              <div className="text-xs text-gray-400 italic">Holiday</div>
                            ) : (
                              <div className="space-y-2">
                                {/* Show existing exams for this date */}
                                {dateSlots.map((slot) => (
                                  <motion.div
                                    key={slot.id}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow"
                                    style={{
                                      backgroundColor: slot.subjectColor + '15',
                                      borderColor: slot.subjectColor + '40',
                                    }}
                                    onClick={() => openSlotModal(date, slot.id)}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div
                                          className="text-xs font-semibold truncate"
                                          style={{ color: slot.subjectColor }}
                                        >
                                          {slot.subjectCode}
                                        </div>
                                        <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
                                          {slot.subjectName}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                                          <Clock className="w-2.5 h-2.5" />
                                          {slot.startTime} - {slot.endTime}
                                        </div>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveSlot(slot.id);
                                        }}
                                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 flex-shrink-0"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </motion.div>
                                ))}

                                {/* Add more exams button */}
                                <motion.button
                                  onClick={() => openSlotModal(date)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="w-full p-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-dark-500 hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
                                >
                                  <Plus className="w-4 h-4 text-gray-400" />
                                  <span className="text-xs text-gray-400">
                                    {dateSlots.length > 0 ? 'Add Another' : 'Add Exam'}
                                  </span>
                                </motion.button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Slot Assignment Modal */}
      <AnimatePresence>
        {isSlotModalOpen && selectedDate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSlotModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Schedule Exam
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(selectedDate)} ({getDayName(selectedDate)})
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSlotModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <Label className="text-xs mb-1 block">Subject <span className="text-red-500">*</span></Label>
                    <Dropdown
                      options={subjects.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }))}
                      value={slotForm.subjectId}
                      onChange={(value) => setSlotForm({ ...slotForm, subjectId: value })}
                      placeholder="Select Subject"
                      searchable
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs mb-1 block">Start Time</Label>
                      <input
                        type="time"
                        value={slotForm.startTime}
                        onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">End Time</Label>
                      <input
                        type="time"
                        value={slotForm.endTime}
                        onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs mb-1 block">Max Marks</Label>
                      <input
                        type="number"
                        value={slotForm.maxMarks}
                        onChange={(e) => setSlotForm({ ...slotForm, maxMarks: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Pass Marks</Label>
                      <input
                        type="number"
                        value={slotForm.minMarks}
                        onChange={(e) => setSlotForm({ ...slotForm, minMarks: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">Supervisor</Label>
                    <Dropdown
                      options={teachers.map((t) => ({ value: t.id, label: t.fullName }))}
                      value={slotForm.supervisorId}
                      onChange={(value) => setSlotForm({ ...slotForm, supervisorId: value })}
                      placeholder="Select Supervisor (Optional)"
                      searchable
                    />
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">Room</Label>
                    <input
                      type="text"
                      value={slotForm.room}
                      onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                      placeholder="e.g., Room 101"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-700 dark:text-white"
                    />
                  </div>

                  {/* Error message inside modal */}
                  {slotModalError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-sm">{slotModalError}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700">
                  <Button
                    variant="outline"
                    onClick={() => setIsSlotModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSlot}
                    disabled={!slotForm.subjectId}
                    className="flex-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save Exam
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
