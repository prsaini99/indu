import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, CheckCircle2, Clock, Calendar, AlertCircle, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { displayTimeRange } from "@/lib/utils";
import { userService, referenceService, type ChildProfile, type Subject } from "@/services/user.service";
import { parentEnrollmentService, type AvailableSlot, type ScheduleSlot } from "@/services/enrollment.service";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DURATION_OPTIONS = [
  { value: 60, label: "60 minutes" },
  { value: 90, label: "90 minutes" },
  { value: 120, label: "120 minutes" },
];

const NewEnrollment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const parentTz = user?.timezone || "Asia/Dubai";

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Child + Subject + Duration
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [duration, setDuration] = useState(60);

  // Step 2: Available slots
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [slotsMessage, setSlotsMessage] = useState("");
  const [slotsFetched, setSlotsFetched] = useState(false);

  // Step 3: Day-by-day schedule builder
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleSlot[]>([]);
  const [pickingDay, setPickingDay] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([userService.getChildren(), referenceService.getSubjects()])
      .then(([c, s]) => {
        setChildren(c);
        setSubjects(s);
      })
      .catch(() =>
        toast({ title: "Error", description: "Failed to load data.", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, []);

  const selectedChild = children.find((c) => c.id === studentId);
  const filteredSubjects = selectedChild
    ? subjects.filter((s) => selectedChild.subjects.some((cs) => cs.id === s.id))
    : subjects;

  const fetchSlots = async () => {
    if (!studentId || !subjectId || !selectedChild?.grade?.id) return;

    setSlotsLoading(true);
    setAvailableSlots([]);
    setSlotsMessage("");
    setSelectedSchedule([]);
    setPickingDay(null);
    setSlotsFetched(false);

    try {
      const result = await parentEnrollmentService.getAvailableSlots(
        subjectId,
        selectedChild.grade.id,
        duration
      );
      setAvailableSlots(result.slots);
      setSlotsMessage(result.message || "");
      setSlotsFetched(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || "Failed to fetch available slots.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId && subjectId && selectedChild?.grade?.id) {
      fetchSlots();
    } else {
      setAvailableSlots([]);
      setSlotsFetched(false);
      setSelectedSchedule([]);
      setPickingDay(null);
    }
  }, [studentId, subjectId, duration]);

  // Group slots by day
  const slotsByDay = availableSlots.reduce<Record<number, AvailableSlot[]>>((acc, slot) => {
    if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {});

  // Days that have available slots but aren't yet in the schedule
  const availableDays = [1, 2, 3, 4, 5, 6, 0].filter(
    (day) => slotsByDay[day]?.length && !selectedSchedule.some((s) => s.dayOfWeek === day)
  );

  const pickingDaySlots = pickingDay !== null ? (slotsByDay[pickingDay] || []) : [];

  const selectSlotForDay = (slot: AvailableSlot) => {
    setSelectedSchedule((prev) => [
      ...prev,
      { dayOfWeek: slot.dayOfWeek, startTime: slot.startTime },
    ]);
    setPickingDay(null);
  };

  const removeDay = (dayOfWeek: number) => {
    setSelectedSchedule((prev) => prev.filter((s) => s.dayOfWeek !== dayOfWeek));
    if (pickingDay === dayOfWeek) setPickingDay(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSchedule.length === 0) {
      toast({ title: "Validation", description: "Please add at least one class day.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await parentEnrollmentService.create({
        studentId,
        subjectId,
        schedule: selectedSchedule,
        duration,
      });
      toast({ title: "Enrollment Created", description: "A tutor has been auto-assigned and sessions are being generated." });
      navigate("/parent-dashboard/enrolled-classes");
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || "Failed to create enrollment.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ParentDashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate("/parent-dashboard/enrolled-classes")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Enrolled Classes
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-indigo-800">New Enrollment</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enroll your child in recurring 1:1 classes. Select a subject, then build your weekly schedule.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : children.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  You need to add a child first before creating an enrollment.
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => navigate("/parent-dashboard/children")}
                >
                  Add Child
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ── Step 1: Child + Subject + Duration ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">Step 1</Badge>
                    <span className="text-sm font-medium text-gray-700">Choose class details</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Child *</Label>
                    <Select
                      value={studentId}
                      onValueChange={(v) => {
                        setStudentId(v);
                        setSubjectId("");
                        setSelectedSchedule([]);
                        setPickingDay(null);
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                      <SelectContent>
                        {children.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.firstName} {c.lastName} — {c.grade.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Subject *</Label>
                    <Select value={subjectId} onValueChange={setSubjectId} disabled={!studentId}>
                      <SelectTrigger>
                        <SelectValue placeholder={studentId ? "Select subject" : "Select a child first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {studentId && filteredSubjects.length === 0 && (
                      <p className="text-xs text-orange-600">
                        No subjects assigned to this child. Add subjects in My Children first.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Session Duration *</Label>
                    <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ── Step 2: Build Schedule Day-by-Day ── */}
                {studentId && subjectId && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">Step 2</Badge>
                      <span className="text-sm font-medium text-gray-700">
                        Build your weekly schedule
                      </span>
                    </div>

                    {slotsLoading ? (
                      <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg border border-dashed">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">Finding available tutors...</span>
                      </div>
                    ) : slotsMessage ? (
                      <div className="flex items-center gap-2 py-6 px-4 bg-orange-50 rounded-lg border border-orange-200">
                        <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                        <p className="text-sm text-orange-700">{slotsMessage}</p>
                      </div>
                    ) : slotsFetched && availableSlots.length === 0 ? (
                      <div className="flex items-center gap-2 py-6 px-4 bg-orange-50 rounded-lg border border-orange-200">
                        <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                        <p className="text-sm text-orange-700">
                          No available slots for this subject and grade. Please try a different duration or contact support.
                        </p>
                      </div>
                    ) : slotsFetched ? (
                      <div className="space-y-3">
                        {/* Already selected days */}
                        {selectedSchedule
                          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                          .map((slot) => (
                            <div
                              key={slot.dayOfWeek}
                              className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-3 border border-indigo-200"
                            >
                              <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-indigo-600" />
                                <span className="text-sm font-semibold text-indigo-800">
                                  {DAY_FULL[slot.dayOfWeek]}
                                </span>
                                <Badge className="bg-indigo-600 text-white">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {displayTimeRange(slot.startTime, duration, parentTz)}
                                </Badge>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDay(slot.dayOfWeek)}
                                className="text-indigo-400 hover:text-red-500 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}

                        {/* Pick a slot for the currently active day */}
                        {pickingDay !== null && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-dashed border-indigo-300">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-indigo-600" />
                                <span className="text-sm font-semibold text-gray-800">
                                  Pick a time for {DAY_FULL[pickingDay]}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPickingDay(null)}
                                className="text-gray-400 hover:text-gray-600 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {pickingDaySlots.map((slot) => (
                                <button
                                  key={`${slot.dayOfWeek}-${slot.startTime}`}
                                  type="button"
                                  onClick={() => selectSlotForDay(slot)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition-all"
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                  {displayTimeRange(slot.startTime, duration, parentTz)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add day button */}
                        {pickingDay === null && availableDays.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              {selectedSchedule.length === 0
                                ? "Pick a day to add your first class:"
                                : "Add another class day:"}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {availableDays.map((day) => (
                                <Button
                                  key={day}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPickingDay(day)}
                                  className="gap-1.5"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  {DAY_FULL[day]}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedSchedule.length > 0 && availableDays.length === 0 && pickingDay === null && (
                          <p className="text-xs text-muted-foreground">
                            All available days have been scheduled.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* ── Selected Summary ── */}
                {selectedSchedule.length > 0 && (
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <p className="text-sm font-semibold text-indigo-800 mb-2">
                      Weekly Schedule ({selectedSchedule.length} class{selectedSchedule.length > 1 ? "es" : ""} / week)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSchedule
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((slot) => (
                          <Badge key={slot.dayOfWeek} className="bg-indigo-600 text-white">
                            {DAY_LABELS[slot.dayOfWeek]} {displayTimeRange(slot.startTime, duration, parentTz)}
                          </Badge>
                        ))}
                    </div>
                    <p className="text-xs text-indigo-600 mt-2">
                      Credits per session are based on grade level and {duration}-minute duration.
                    </p>
                  </div>
                )}

                {/* ── Submit ── */}
                <Button
                  type="submit"
                  disabled={submitting || selectedSchedule.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating Enrollment...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Create Enrollment</>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </ParentDashboardLayout>
  );
};

export default NewEnrollment;
