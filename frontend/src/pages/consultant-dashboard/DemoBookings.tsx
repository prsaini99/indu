import { useState, useEffect, useMemo } from "react";
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
  DialogTrigger,
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
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  Video,
  User,
  BookOpen,
  AlertTriangle,
  Mail,
  Phone,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Clock3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  consultantDemoBookingService,
  type DemoBooking,
  type CreateDemoBookingPayload,
} from "@/services/demoBooking.service";
import { consultantDemoService, type DemoRequest } from "@/services/demoRequest.service";
import { tutorSearchService } from "@/services/tutor.service";
import { referenceService } from "@/services/user.service";
import { displayTime } from "@/lib/utils";
import type { Subject } from "@/services/user.service";

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  NO_SHOW: "bg-red-100 text-red-700",
};

const DemoBookings = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // No Show dialog state
  const [noShowDialogOpen, setNoShowDialogOpen] = useState(false);
  const [noShowBookingId, setNoShowBookingId] = useState<string | null>(null);
  const [noShowBy, setNoShowBy] = useState<"tutor" | "student" | null>(null);
  const [noShowSubmitting, setNoShowSubmitting] = useState(false);

  // Complete + interest tracking dialog state (#6)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeBookingId, setCompleteBookingId] = useState<string | null>(null);
  const [interestLevel, setInterestLevel] = useState<"INTERESTED" | "FOLLOW_UP" | "NOT_INTERESTED" | null>(null);
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  // Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [tutors, setTutors] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Array<{ startTime: string; endTime: string }>>([]);
  const [selectedTutorTz, setSelectedTutorTz] = useState("Asia/Kolkata");
  const [isDateBlocked, setIsDateBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const emptyForm: CreateDemoBookingPayload = {
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
  const [form, setForm] = useState<CreateDemoBookingPayload>(emptyForm);

  const fetchBookings = () => {
    consultantDemoBookingService
      .list({ limit: 50 })
      .then((res) => setBookings(res.data))
      .catch(() => toast({ title: "Error", description: "Failed to load demo bookings.", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
    Promise.all([
      consultantDemoService.list({ limit: 100, status: "ASSIGNED" }),
      referenceService.getSubjects(),
    ]).then(([dr, s]) => {
      setDemoRequests(dr.data);
      setSubjects(s);
    });
  }, []);

  // Re-fetch tutors filtered by the selected subject
  useEffect(() => {
    if (!form.subjectId) { setTutors([]); return; }
    const subjectName = subjects.find((s) => s.id === form.subjectId)?.name;
    setLoadingTutors(true);
    setForm((f) => ({ ...f, tutorId: "" }));
    setAvailableSlots([]);
    tutorSearchService
      .search({ limit: 100, subject: subjectName })
      .then((res) => setTutors(res.data.map((t) => ({ id: t.id, firstName: t.firstName, lastName: t.lastName }))))
      .catch(() => setTutors([]))
      .finally(() => setLoadingTutors(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.subjectId, subjects]);

  // Fetch availability slots when tutor + date are both selected
  useEffect(() => {
    if (!form.tutorId || !form.scheduledDate) { setAvailableSlots([]); setIsDateBlocked(false); setBlockedReason(null); return; }
    setLoadingSlots(true);
    tutorSearchService
      .getAvailability(form.tutorId, form.scheduledDate)
      .then((result) => {
        setAvailableSlots(result.slots);
        setSelectedTutorTz(result.tutorTimezone || "Asia/Kolkata");
        const blocked = result.blockedDates.find((b: { date: string; reason: string | null }) => b.date === form.scheduledDate);
        setIsDateBlocked(!!blocked);
        setBlockedReason(blocked?.reason || null);
      })
      .catch(() => { setAvailableSlots([]); setIsDateBlocked(false); setBlockedReason(null); })
      .finally(() => setLoadingSlots(false));
  }, [form.tutorId, form.scheduledDate]);

  const filtered = useMemo(() => {
    if (!activeFilter) return bookings;
    return bookings.filter((b) => b.status === activeFilter);
  }, [activeFilter, bookings]);

  const counts = useMemo(() => ({
    all: bookings.length,
    CONFIRMED: bookings.filter((b) => b.status === "CONFIRMED").length,
    COMPLETED: bookings.filter((b) => b.status === "COMPLETED").length,
  }), [bookings]);

  const handleCreate = async () => {
    if (!form.tutorId || !form.subjectId || !form.scheduledDate || !form.scheduledStart || !form.scheduledEnd) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateDemoBookingPayload = {
        ...form,
        demoRequestId: form.demoRequestId || undefined,
        meetingLink: form.meetingLink || undefined,
        meetingPassword: form.meetingPassword || undefined,
        consultantNotes: form.consultantNotes || undefined,
      };
      await consultantDemoBookingService.create(payload);
      toast({ title: "Demo Scheduled", description: "Demo booking created successfully." });
      setDialogOpen(false);
      setForm(emptyForm);
      setTutors([]);
      setAvailableSlots([]);
      setLoading(true);
      fetchBookings();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Failed to create booking.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await consultantDemoBookingService.updateStatus(id, status);
      toast({ title: "Status Updated", description: `Booking marked as ${status}.` });
      setLoading(true);
      fetchBookings();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Failed to update status.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const openNoShowDialog = (id: string) => {
    setNoShowBookingId(id);
    setNoShowBy(null);
    setNoShowDialogOpen(true);
  };

  const handleConfirmNoShow = async () => {
    if (!noShowBookingId || !noShowBy) return;
    setNoShowSubmitting(true);
    try {
      const note = noShowBy === "tutor" ? "No show: Tutor did not attend." : "No show: Student/Parent did not attend.";
      await consultantDemoBookingService.update(noShowBookingId, { consultantNotes: note });
      await consultantDemoBookingService.updateStatus(noShowBookingId, "NO_SHOW");
      toast({ title: "Marked No Show", description: note });
      setNoShowDialogOpen(false);
      setNoShowBookingId(null);
      setNoShowBy(null);
      setLoading(true);
      fetchBookings();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Failed to mark no show.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setNoShowSubmitting(false);
    }
  };

  // Fix #3: Copy meeting details to clipboard
  const copyMeetingDetails = (booking: DemoBooking) => {
    const lines = [
      `Demo Class — ${booking.subject.name}`,
      `Date: ${new Date(booking.scheduledDate).toLocaleDateString()}`,
      `Time: ${displayTime(booking.scheduledStart, booking.tutor?.user?.timezone || "Asia/Kolkata")} – ${displayTime(booking.scheduledEnd, booking.tutor?.user?.timezone || "Asia/Kolkata")}`,
      booking.meetingLink ? `Join: ${booking.meetingLink}` : null,
      booking.meetingPassword ? `Password: ${booking.meetingPassword}` : null,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines);
    toast({ title: "Copied!", description: "Meeting details copied to clipboard." });
  };

  // Fix #6: Complete with interest tracking
  const openCompleteDialog = (id: string) => {
    setCompleteBookingId(id);
    setInterestLevel(null);
    setCompleteDialogOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!completeBookingId || !interestLevel) return;
    setCompleteSubmitting(true);
    try {
      const noteMap = {
        INTERESTED: "Post-demo: Parent is interested — follow up to create class booking.",
        FOLLOW_UP: "Post-demo: Parent needs follow-up before deciding.",
        NOT_INTERESTED: "Post-demo: Parent is not interested at this time.",
      };
      await consultantDemoBookingService.update(completeBookingId, { consultantNotes: noteMap[interestLevel] });
      await consultantDemoBookingService.updateStatus(completeBookingId, "COMPLETED");
      toast({ title: "Demo Completed", description: noteMap[interestLevel] });
      setCompleteDialogOpen(false);
      setCompleteBookingId(null);
      setInterestLevel(null);
      setLoading(true);
      fetchBookings();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || "Failed to complete booking.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setCompleteSubmitting(false);
    }
  };

  return (
    <ConsultantDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-teal-800">Demo Bookings</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Schedule and manage demo classes between tutors and prospective students.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyForm); setTutors([]); setAvailableSlots([]); } }}>
            <DialogTrigger asChild>
              <Button className="bg-teal-700 hover:bg-teal-800">
                <Plus className="h-4 w-4 mr-2" /> Schedule Demo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule a Demo Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Link to demo request (optional) */}
                <div>
                  <label className="text-sm font-medium">Link to Demo Request (optional)</label>
                  <Select value={form.demoRequestId} onValueChange={(v) => setForm({ ...form, demoRequestId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select a request..." /></SelectTrigger>
                    <SelectContent>
                      {demoRequests.map((dr) => (
                        <SelectItem key={dr.id} value={dr.id}>
                          {dr.parentName} — {dr.childFirstName} ({dr.subjects.map((s) => s.name).join(", ")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject first — drives tutor filter */}
                <div>
                  <label className="text-sm font-medium">Subject *</label>
                  <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Tutor *</label>
                  <Select
                    value={form.tutorId}
                    onValueChange={(v) => setForm((f) => ({ ...f, tutorId: v }))}
                    disabled={!form.subjectId || loadingTutors}
                  >
                    <SelectTrigger className="mt-1">
                      {loadingTutors
                        ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading tutors...</span>
                        : <SelectValue placeholder={form.subjectId ? "Select tutor" : "Select subject first"} />
                      }
                    </SelectTrigger>
                    <SelectContent>
                      {tutors.length === 0 && !loadingTutors && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">No tutors found for this subject</div>
                      )}
                      {tutors.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <Input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    className="mt-1"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {/* Availability slots */}
                {form.tutorId && form.scheduledDate && (
                  <div>
                    {loadingSlots ? (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking tutor availability...
                      </p>
                    ) : availableSlots.length > 0 ? (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1.5">Available slots — click to fill</p>
                        <div className="flex flex-wrap gap-1.5">
                          {availableSlots.map((slot, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, scheduledStart: slot.startTime, scheduledEnd: slot.endTime }))}
                              className={`text-xs rounded-full border px-3 py-1 transition-colors ${
                                form.scheduledStart === slot.startTime && form.scheduledEnd === slot.endTime
                                  ? "bg-teal-600 text-white border-teal-600"
                                  : "border-gray-300 hover:border-teal-500 hover:text-teal-700"
                              }`}
                            >
                              {displayTime(slot.startTime, selectedTutorTz)} – {displayTime(slot.endTime, selectedTutorTz)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : isDateBlocked ? (
                      <p className="flex items-center gap-1.5 text-xs text-red-600">
                        <XCircle className="h-3.5 w-3.5" /> Tutor is unavailable on this date{blockedReason ? ` (${blockedReason})` : ""} — consider picking another date
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" /> No availability set for this date — enter time manually
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Start Time *</label>
                    <Input
                      type="time"
                      value={form.scheduledStart}
                      onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Time *</label>
                    <Input
                      type="time"
                      value={form.scheduledEnd}
                      onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Meeting Link (Zoom)</label>
                  <Input
                    value={form.meetingLink || ""}
                    onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Meeting Password / Passcode</label>
                  <Input
                    value={form.meetingPassword || ""}
                    onChange={(e) => setForm({ ...form, meetingPassword: e.target.value })}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Input
                    value={form.consultantNotes || ""}
                    onChange={(e) => setForm({ ...form, consultantNotes: e.target.value })}
                    placeholder="Internal notes..."
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} className="bg-teal-700 hover:bg-teal-800" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scheduling...</> : "Schedule Demo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stat filters */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: null, label: "All", count: counts.all, bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" },
            { key: "CONFIRMED", label: "Confirmed", count: counts.CONFIRMED, bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
            { key: "COMPLETED", label: "Completed", count: counts.COMPLETED, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
          ].map((item) => (
            <Card
              key={item.label}
              className={`${item.bg} ${item.border} cursor-pointer transition-all hover:shadow-md ${activeFilter === item.key ? "ring-2 ring-teal-500 shadow-md" : ""}`}
              onClick={() => setActiveFilter(item.key)}
            >
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-bold ${item.text}`}>{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Booking list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((booking) => {
              const isExpanded = expandedId === booking.id;
              return (
                <Card
                  key={booking.id}
                  className="bg-white hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-semibold shrink-0">
                        {booking.demoRequest
                          ? booking.demoRequest.parentName.charAt(0)
                          : booking.student
                          ? booking.student.firstName.charAt(0)
                          : "D"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">
                            {booking.demoRequest
                              ? `${booking.demoRequest.parentName} — ${booking.demoRequest.childFirstName}`
                              : booking.student
                              ? `${booking.student.firstName} ${booking.student.lastName}`
                              : "Direct Booking"}
                          </h3>
                          <Badge className={`text-[10px] ${statusColors[booking.status]}`} variant="secondary">
                            {booking.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Tutor: {booking.tutor.firstName} {booking.tutor.lastName}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {booking.subject.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(booking.scheduledDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {displayTime(booking.scheduledStart, booking.tutor?.user?.timezone || "Asia/Kolkata")} - {displayTime(booking.scheduledEnd, booking.tutor?.user?.timezone || "Asia/Kolkata")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        {booking.demoRequest && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Contact</p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                                <Mail className="h-3.5 w-3.5 text-teal-600" />
                                {booking.demoRequest.contactEmail}
                              </p>
                              {booking.demoRequest.contactPhone && (
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                                  <Phone className="h-3.5 w-3.5 text-teal-600" />
                                  {booking.demoRequest.contactPhone}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Child</p>
                              <p className="mt-0.5 text-xs">
                                {booking.demoRequest.childFirstName} {booking.demoRequest.childLastName}
                              </p>
                            </div>
                          </div>
                        )}

                        {(booking.meetingLink || booking.meetingPassword) && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-muted-foreground font-medium">Meeting</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs text-teal-700 hover:bg-teal-50"
                                onClick={(e) => { e.stopPropagation(); copyMeetingDetails(booking); }}
                              >
                                <Copy className="h-3 w-3 mr-1" /> Copy Details
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {booking.meetingLink && (
                                <a
                                  href={booking.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Video className="h-3.5 w-3.5" /> Join Meeting
                                </a>
                              )}
                              {booking.meetingPassword && (
                                <span className="text-xs text-muted-foreground">
                                  Password: <span className="font-mono">{booking.meetingPassword}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {booking.consultantNotes && (
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Notes</p>
                            <p className="mt-0.5 text-sm text-gray-700 bg-gray-50 rounded-md p-2.5">{booking.consultantNotes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {booking.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-xs"
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(booking.id, "CONFIRMED"); }}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(booking.id, "CANCELLED"); }}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                              </Button>
                            </>
                          )}
                          {booking.status === "CONFIRMED" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                                onClick={(e) => { e.stopPropagation(); openCompleteDialog(booking.id); }}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-orange-600 hover:bg-orange-50"
                                onClick={(e) => { e.stopPropagation(); openNoShowDialog(booking.id); }}
                              >
                                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> No Show
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(booking.id, "CANCELLED"); }}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
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
            <h3 className="text-lg font-semibold">No demo bookings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Schedule Demo" to create your first demo booking.
            </p>
          </div>
        )}
      </div>
      {/* No Show Dialog */}
      <Dialog open={noShowDialogOpen} onOpenChange={setNoShowDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Who didn't show up?</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              Select who was absent so we can track it accurately.
            </p>
            <button
              type="button"
              onClick={() => setNoShowBy("tutor")}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                noShowBy === "tutor"
                  ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-medium">Tutor</p>
              <p className="text-xs text-muted-foreground mt-0.5">The tutor did not join the session</p>
            </button>
            <button
              type="button"
              onClick={() => setNoShowBy("student")}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                noShowBy === "student"
                  ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-medium">Student / Parent</p>
              <p className="text-xs text-muted-foreground mt-0.5">The student or parent did not join</p>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoShowDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmNoShow}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={!noShowBy || noShowSubmitting}
            >
              {noShowSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Confirm No Show"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete + Interest Tracking Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark Demo as Completed</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              How did the parent respond after the demo?
            </p>
            <button
              type="button"
              onClick={() => setInterestLevel("INTERESTED")}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                interestLevel === "INTERESTED"
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-medium">Interested</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 ml-6">Parent wants to proceed — create a class booking</p>
            </button>
            <button
              type="button"
              onClick={() => setInterestLevel("FOLLOW_UP")}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                interestLevel === "FOLLOW_UP"
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium">Needs Follow-up</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 ml-6">Parent is undecided — follow up before proceeding</p>
            </button>
            <button
              type="button"
              onClick={() => setInterestLevel("NOT_INTERESTED")}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                interestLevel === "NOT_INTERESTED"
                  ? "border-red-500 bg-red-50 ring-1 ring-red-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium">Not Interested</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 ml-6">Parent declined to continue</p>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmComplete}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!interestLevel || completeSubmitting}
            >
              {completeSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsultantDashboardLayout>
  );
};

export default DemoBookings;
