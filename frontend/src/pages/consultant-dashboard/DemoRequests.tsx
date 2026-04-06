import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ConsultantDashboardLayout from "@/components/ConsultantDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Loader2,
  BookOpen,
  User,
  GraduationCap,
  Mail,
  Phone,
  UserPlus,
  Video,
  CalendarPlus,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { consultantDemoService, type DemoRequest } from "@/services/demoRequest.service";
import { consultantDemoBookingService, type CreateDemoBookingPayload } from "@/services/demoBooking.service";
import { tutorSearchService } from "@/services/tutor.service";

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const timeSlotLabels: Record<string, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
};

const DemoRequests = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Schedule demo dialog
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingRequest, setSchedulingRequest] = useState<DemoRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tutors, setTutors] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const emptyScheduleForm: CreateDemoBookingPayload = {
    demoRequestId: "",
    tutorId: "",
    subjectId: "",
    scheduledDate: "",
    scheduledStart: "",
    scheduledEnd: "",
    meetingLink: "",
    meetingPassword: "",
    consultantNotes: "",
  };
  const [scheduleForm, setScheduleForm] = useState<CreateDemoBookingPayload>(emptyScheduleForm);

  const fetchRequests = () => {
    consultantDemoService
      .list({ limit: 50 })
      .then((res) => setRequests(res.data))
      .catch(() => toast({ title: "Error", description: "Failed to load requests.", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Fetch availability when tutor + date are both selected
  useEffect(() => {
    if (!scheduleForm.tutorId || !scheduleForm.scheduledDate) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    tutorSearchService
      .getAvailability(scheduleForm.tutorId, scheduleForm.scheduledDate)
      .then((slots) => setAvailableSlots(slots))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [scheduleForm.tutorId, scheduleForm.scheduledDate]);

  // Only show actionable requests (PENDING + ASSIGNED) — once scheduled, they move to Demo Bookings
  const actionableRequests = useMemo(() => {
    return requests.filter((r) => ["PENDING", "ASSIGNED"].includes(r.status));
  }, [requests]);

  const filtered = useMemo(() => {
    if (!activeFilter) return actionableRequests;
    return actionableRequests.filter((r) => r.status === activeFilter);
  }, [activeFilter, actionableRequests]);

  const counts = useMemo(() => ({
    all: actionableRequests.length,
    PENDING: actionableRequests.filter((r) => r.status === "PENDING").length,
    ASSIGNED: actionableRequests.filter((r) => r.status === "ASSIGNED").length,
  }), [actionableRequests]);

  const handleAssign = async (id: string) => {
    try {
      await consultantDemoService.assignToMe(id);
      toast({ title: "Assigned", description: "Request assigned to you." });
      setLoading(true);
      fetchRequests();
    } catch {
      toast({ title: "Error", description: "Failed to assign request.", variant: "destructive" });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await consultantDemoService.updateStatus(id, "CANCELLED");
      toast({ title: "Cancelled", description: "Request has been cancelled." });
      setLoading(true);
      fetchRequests();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Failed to cancel.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const loadTutorsForSubject = (subjectId: string, gradeId: string) => {
    setTutors([]);
    setLoadingTutors(true);
    tutorSearchService
      .search({ limit: 100, subject: subjectId, grade: gradeId })
      .then((res) => setTutors(res.data.map((t) => ({ id: t.id, firstName: t.firstName, lastName: t.lastName }))))
      .catch(() => setTutors([]))
      .finally(() => setLoadingTutors(false));
  };

  const openScheduleDialog = (req: DemoRequest) => {
    setSchedulingRequest(req);
    setAvailableSlots([]);
    const subject = req.subjects.length === 1 ? req.subjects[0] : null;
    setScheduleForm({
      demoRequestId: req.id,
      tutorId: "",
      subjectId: subject?.id || "",
      scheduledDate: req.preferredDate ? new Date(req.preferredDate).toISOString().split("T")[0] : "",
      scheduledStart: "",
      scheduledEnd: "",
      meetingLink: "",
      consultantNotes: "",
    });
    // If single subject, auto-load tutors; if multiple, wait for user to pick
    if (subject) {
      loadTutorsForSubject(subject.id, req.grade?.id);
    }
    setScheduleDialogOpen(true);
  };

  const handleSubjectChange = (subjectId: string) => {
    setScheduleForm((prev) => ({ ...prev, subjectId, tutorId: "" }));
    setAvailableSlots([]);
    if (schedulingRequest) {
      loadTutorsForSubject(subjectId, schedulingRequest.grade?.id);
    }
  };

  const handleScheduleDemo = async () => {
    if (!scheduleForm.tutorId || !scheduleForm.subjectId || !scheduleForm.scheduledDate || !scheduleForm.scheduledStart || !scheduleForm.scheduledEnd) {
      toast({ title: "Missing fields", description: "Please fill tutor, date, and time.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateDemoBookingPayload = {
        ...scheduleForm,
        demoRequestId: scheduleForm.demoRequestId || undefined,
        meetingLink: scheduleForm.meetingLink || undefined,
        meetingPassword: scheduleForm.meetingPassword || undefined,
        consultantNotes: scheduleForm.consultantNotes || undefined,
      };
      await consultantDemoBookingService.create(payload);
      toast({ title: "Demo Scheduled!", description: "Demo booking created. View it in Demo Bookings." });
      setScheduleDialogOpen(false);
      setSchedulingRequest(null);
      setLoading(true);
      fetchRequests();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: { message?: string; details?: { field: string; message: string }[] } } } })?.response?.data?.error;
      const message = errData?.details?.length
        ? errData.details.map((d) => `${d.field}: ${d.message}`).join(" | ")
        : errData?.message || "Failed to schedule demo.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConsultantDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-teal-800">Demo Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review incoming requests, assign yourself, and schedule demo classes.
          </p>
        </div>

        {/* Stat filters — only actionable statuses */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: null, label: "All", count: counts.all, bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", sub: "text-gray-600" },
            { key: "PENDING", label: "Pending", count: counts.PENDING, bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", sub: "text-orange-600" },
            { key: "ASSIGNED", label: "Assigned to Me", count: counts.ASSIGNED, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", sub: "text-blue-600" },
          ].map((item) => (
            <Card
              key={item.label}
              className={`${item.bg} ${item.border} cursor-pointer transition-all hover:shadow-md ${activeFilter === item.key ? "ring-2 ring-teal-500 shadow-md" : ""}`}
              onClick={() => setActiveFilter(item.key)}
            >
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-bold ${item.text}`}>{item.count}</p>
                <p className={`text-xs ${item.sub}`}>{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Request list */}
        <div>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((req) => {
                const isExpanded = expandedId === req.id;
                return (
                  <Card
                    key={req.id}
                    className="bg-white hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-semibold shrink-0">
                          {req.parent ? `${req.parent.firstName.charAt(0)}${req.parent.lastName.charAt(0)}` : req.parentName?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold">
                              {req.parent ? `${req.parent.firstName} ${req.parent.lastName}` : req.parentName || "Unknown"}
                            </h3>
                            <Badge className={`text-[10px] ${statusColors[req.status]}`} variant="secondary">
                              {req.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {req.childFirstName} {req.childLastName}
                            </span>
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {req.board.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {req.subjects.map((s) => `${s.name} — ${req.grade.name}`).join(", ")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeSlotLabels[req.preferredTimeSlot]}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Contact</p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                                <Mail className="h-3.5 w-3.5 text-teal-600" />
                                {req.contactEmail}
                              </p>
                              {req.contactPhone && (
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                                  <Phone className="h-3.5 w-3.5 text-teal-600" />
                                  {req.contactPhone}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Preferred Date</p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                                {new Date(req.preferredDate).toLocaleDateString()}
                                {req.alternativeDate && ` (Alt: ${new Date(req.alternativeDate).toLocaleDateString()})`}
                              </p>
                            </div>
                            {req.childDateOfBirth && (
                              <div>
                                <p className="text-xs text-muted-foreground font-medium">Child DOB</p>
                                <p className="mt-0.5 text-xs">{new Date(req.childDateOfBirth).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>

                          {req.notes && (
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Notes</p>
                              <p className="mt-0.5 text-sm text-gray-700 bg-gray-50 rounded-md p-2.5">{req.notes}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {req.status === "PENDING" && (
                              <Button
                                size="sm"
                                className="bg-teal-700 hover:bg-teal-800 text-xs"
                                onClick={(e) => { e.stopPropagation(); handleAssign(req.id); }}
                              >
                                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                Assign to Me
                              </Button>
                            )}
                            {req.status === "ASSIGNED" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-teal-700 hover:bg-teal-800 text-xs"
                                  onClick={(e) => { e.stopPropagation(); openScheduleDialog(req); }}
                                >
                                  <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                                  Schedule Demo
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-red-600 hover:bg-red-50"
                                  onClick={(e) => { e.stopPropagation(); handleCancel(req.id); }}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                  Cancel Request
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold">No {activeFilter ? activeFilter.toLowerCase() : ""} requests</h3>
              <p className="text-sm text-muted-foreground mt-1">
                New demo requests from parents will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Demo Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Demo Class</DialogTitle>
          </DialogHeader>
          {schedulingRequest && (
            <div className="space-y-4 py-2">
              {/* Pre-filled info (read-only) */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-teal-800">Request Details</p>
                <p className="text-sm">
                  <strong>{schedulingRequest.parent ? `${schedulingRequest.parent.firstName} ${schedulingRequest.parent.lastName}` : schedulingRequest.parentName}</strong>
                  {" — "}{schedulingRequest.childFirstName} {schedulingRequest.childLastName}
                </p>
                <p className="text-xs text-teal-700">
                  {schedulingRequest.subjects.map((s) => `${s.name} — ${schedulingRequest.grade.name}`).join(", ")}
                  {" · "}{schedulingRequest.board.name}
                  {" · "}{timeSlotLabels[schedulingRequest.preferredTimeSlot]}
                </p>
                <p className="text-xs text-teal-700">
                  Preferred: {new Date(schedulingRequest.preferredDate).toLocaleDateString()}
                  {schedulingRequest.alternativeDate && ` · Alt: ${new Date(schedulingRequest.alternativeDate).toLocaleDateString()}`}
                </p>
              </div>

              {/* Tutor selection — filtered by subject */}
              <div>
                <label className="text-sm font-medium">Assign Tutor *</label>
                <Select value={scheduleForm.tutorId} onValueChange={(v) => setScheduleForm({ ...scheduleForm, tutorId: v })}>
                  <SelectTrigger className="mt-1">
                    {loadingTutors ? (
                      <span className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading tutors...
                      </span>
                    ) : (
                      <SelectValue placeholder={tutors.length === 0 ? "No tutors for this subject" : "Select tutor"} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {tutors.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!loadingTutors && tutors.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">No active tutors found for this course.</p>
                )}
              </div>

              {/* Subject selection */}
              <div>
                <label className="text-sm font-medium">Subject *</label>
                {schedulingRequest.subjects.length > 1 ? (
                  <Select value={scheduleForm.subjectId} onValueChange={handleSubjectChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select subject for this demo" />
                    </SelectTrigger>
                    <SelectContent>
                      {schedulingRequest.subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name} — {schedulingRequest.grade.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={`${schedulingRequest.subjects[0]?.name || ""} — ${schedulingRequest.grade.name}`}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                )}
              </div>

              {/* Date & Time */}
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={scheduleForm.scheduledDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                  className="mt-1"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Tutor availability for selected date */}
              {scheduleForm.tutorId && scheduleForm.scheduledDate && (
                <div>
                  <label className="text-sm font-medium">Tutor's Available Slots</label>
                  <div className="mt-1.5">
                    {loadingSlots ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" /> Checking availability...
                      </p>
                    ) : availableSlots.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {availableSlots.map((slot, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setScheduleForm({ ...scheduleForm, scheduledStart: slot.startTime, scheduledEnd: slot.endTime })}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                              scheduleForm.scheduledStart === slot.startTime
                                ? "bg-teal-700 text-white border-teal-700"
                                : "border-teal-300 text-teal-700 hover:bg-teal-50"
                            }`}
                          >
                            {slot.startTime} – {slot.endTime}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">
                        Tutor has no availability set for this date. You can still enter the time manually below.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start Time *</label>
                  <Input
                    type="time"
                    value={scheduleForm.scheduledStart}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledStart: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time *</label>
                  <Input
                    type="time"
                    value={scheduleForm.scheduledEnd}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledEnd: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Meeting link + password */}
              <div>
                <label className="text-sm font-medium">Zoom Meeting Link</label>
                <Input
                  value={scheduleForm.meetingLink || ""}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Meeting Password / Passcode</label>
                <Input
                  value={scheduleForm.meetingPassword || ""}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetingPassword: e.target.value })}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium">Notes (internal)</label>
                <Input
                  value={scheduleForm.consultantNotes || ""}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, consultantNotes: e.target.value })}
                  placeholder="Any notes for this booking..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleDemo} className="bg-teal-700 hover:bg-teal-800" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scheduling...</> : (
                <><CalendarPlus className="h-4 w-4 mr-2" /> Schedule Demo</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsultantDashboardLayout>
  );
};

export default DemoRequests;
