import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  User,
  Video,
  Loader2,
  PauseCircle,
  PlayCircle,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Flag,
  FileText,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayTime, displayTimeRange } from "@/lib/utils";
import {
  parentEnrollmentService,
  type Enrollment,
  type EnrollmentSession,
  type SessionStatus,
  type CourseMaterial,
} from "@/services/enrollment.service";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const sessionStatusConfig: Record<SessionStatus, { label: string; color: string }> = {
  SCHEDULED: { label: "Scheduled", color: "bg-blue-100 text-blue-700" },
  CONFIRMED: { label: "Confirmed", color: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  CANCELLED_PARENT: { label: "Cancelled", color: "bg-gray-100 text-gray-500" },
  CANCELLED_LATE: { label: "Late Cancel", color: "bg-red-100 text-red-700" },
  SKIPPED: { label: "Skipped", color: "bg-orange-100 text-orange-700" },
  NO_SHOW_REPORTED: { label: "No-Show Reported", color: "bg-amber-100 text-amber-700" },
  MISSED_TUTOR: { label: "Tutor No-Show", color: "bg-red-100 text-red-700" },
};

const EnrollmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [sessions, setSessions] = useState<EnrollmentSession[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [e, s] = await Promise.all([
        parentEnrollmentService.getById(id),
        parentEnrollmentService.getSessions(id, { limit: 50 }),
      ]);
      setEnrollment(e);
      setSessions(
        s.data.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      );
      // Fetch course materials (non-blocking)
      parentEnrollmentService.getCourseMaterials(id).then((res) => setMaterials(res.materials)).catch(() => {});
    } catch {
      toast({ title: "Error", description: "Failed to load enrollment details.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handlePause = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await parentEnrollmentService.pause(id);
      setEnrollment(updated);
      toast({ title: "Enrollment Paused", description: "Future sessions have been cancelled and credits refunded." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || err?.response?.data?.error?.message || "Failed to pause.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await parentEnrollmentService.resume(id);
      setEnrollment(updated);
      toast({ title: "Enrollment Resumed", description: "New sessions are being generated." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || err?.response?.data?.error?.message || "Failed to resume.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await parentEnrollmentService.cancel(id);
      setEnrollment(updated);
      toast({ title: "Enrollment Cancelled", description: "Future sessions have been cancelled and credits refunded." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || err?.response?.data?.error?.message || "Failed to cancel.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    setActionLoading(true);
    try {
      const updated = await parentEnrollmentService.cancelSession(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...updated } : s)));
      const wasRefunded = updated.status === "CANCELLED_PARENT";
      toast({
        title: wasRefunded ? "Session Cancelled" : "Late Cancellation",
        description: wasRefunded
          ? "Credits have been refunded."
          : "Cancelled less than 24 hours before — no refund.",
        variant: wasRefunded ? "default" : "destructive",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error?.message || "Failed to cancel session.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportNoShow = async (sessionId: string) => {
    setActionLoading(true);
    try {
      const updated = await parentEnrollmentService.reportNoShow(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...updated } : s)));
      toast({ title: "No-Show Reported", description: "Your report has been submitted. Admin will review and process the refund." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error?.message || "Failed to report no-show.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const canCancelSession = (session: EnrollmentSession) => {
    return ["SCHEDULED", "CONFIRMED"].includes(session.status);
  };

  const canReportNoShow = (session: EnrollmentSession) => {
    if (!["COMPLETED", "CONFIRMED"].includes(session.status)) return false;
    const sessionDate = new Date(session.scheduledDate);
    const [hh, mm] = session.scheduledEnd.split(":");
    sessionDate.setHours(Number(hh), Number(mm));
    const hoursSinceEnd = (Date.now() - sessionDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceEnd > 0 && hoursSinceEnd <= 24;
  };

  if (loading) {
    return (
      <ParentDashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ParentDashboardLayout>
    );
  }

  if (!enrollment) {
    return (
      <ParentDashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Enrollment not found.</p>
          <Button variant="link" onClick={() => navigate("/parent-dashboard/enrolled-classes")}>
            Back to Enrolled Classes
          </Button>
        </div>
      </ParentDashboardLayout>
    );
  }

  const isActive = enrollment.status === "ACTIVE";
  const isPaused = enrollment.status === "PAUSED";

  const COOLDOWN_HOURS = 48;
  const MAX_PAUSES = 3;

  const getPauseInfo = () => {
    if (!enrollment) return { canPause: false, canResume: false, message: "" };
    const now = Date.now();
    if (isActive && enrollment.lastResumedAt) {
      const hoursSince = (now - new Date(enrollment.lastResumedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSince < COOLDOWN_HOURS) {
        const left = Math.ceil(COOLDOWN_HOURS - hoursSince);
        return { canPause: false, canResume: true, message: `You can pause again in ${left}h. 48-hour cooldown after resuming.` };
      }
    }
    if (isPaused && enrollment.lastPausedAt) {
      const hoursSince = (now - new Date(enrollment.lastPausedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSince < COOLDOWN_HOURS) {
        const left = Math.ceil(COOLDOWN_HOURS - hoursSince);
        return { canPause: true, canResume: false, message: `You can resume in ${left}h. 48-hour cooldown after pausing.` };
      }
    }
    let usedThisMonth = enrollment.pauseCountMonth || 0;
    if (enrollment.pauseCountResetAt) {
      const resetDate = new Date(enrollment.pauseCountResetAt);
      const nowDate = new Date();
      if (nowDate.getFullYear() !== resetDate.getFullYear() || nowDate.getMonth() !== resetDate.getMonth()) {
        usedThisMonth = 0;
      }
    } else {
      usedThisMonth = 0;
    }
    if (isActive && usedThisMonth >= MAX_PAUSES) {
      return { canPause: false, canResume: true, message: `You've used all ${MAX_PAUSES} pauses for this month.` };
    }
    const remaining = MAX_PAUSES - usedThisMonth;
    return { canPause: true, canResume: true, message: isActive ? `${remaining} pause(s) remaining this month.` : "" };
  };

  const pauseInfo = getPauseInfo();

  let displayPauseCount = enrollment.pauseCountMonth || 0;
  if (enrollment.pauseCountResetAt) {
    const resetDate = new Date(enrollment.pauseCountResetAt);
    const nowDate = new Date();
    if (nowDate.getFullYear() !== resetDate.getFullYear() || nowDate.getMonth() !== resetDate.getMonth()) {
      displayPauseCount = 0;
    }
  } else {
    displayPauseCount = 0;
  }
  const pausesRemaining = Math.max(0, MAX_PAUSES - displayPauseCount);

  return (
    <ParentDashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate("/parent-dashboard/enrolled-classes")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {/* Enrollment Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg text-indigo-800">
                {enrollment.student.firstName} {enrollment.student.lastName} — {enrollment.subject.name}
              </CardTitle>
              <Badge
                className={`text-xs ${
                  isActive ? "bg-green-100 text-green-700"
                    : isPaused ? "bg-yellow-100 text-yellow-700"
                    : enrollment.status === "CANCELLED" ? "bg-gray-100 text-gray-500"
                    : "bg-blue-100 text-blue-700"
                }`}
                variant="secondary"
              >
                {enrollment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Tutor: <strong className="text-foreground">{enrollment.tutor.firstName} {enrollment.tutor.lastName}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground col-span-2 sm:col-span-3">
                <Calendar className="h-4 w-4 shrink-0" />
                <div>
                  {(enrollment.schedule || [])
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((s, i) => (
                      <div key={i}>{DAY_LABELS[s.dayOfWeek]} {displayTimeRange(s.startTime, enrollment.duration, enrollment.parent?.user?.timezone || "Asia/Dubai")}</div>
                    ))}
                  <span className="text-muted-foreground">{(enrollment.schedule || []).length}x/week</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>{enrollment.creditsPerSession} credits/session</span>
              </div>
              {enrollment.zoomLink && enrollment.status === "ACTIVE" && (
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-500" />
                  <a href={enrollment.zoomLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    Zoom Link
                  </a>
                  {enrollment.zoomPassword && (
                    <span className="text-xs text-muted-foreground">Password: {enrollment.zoomPassword}</span>
                  )}
                </div>
              )}
            </div>

            {enrollment.pauseReason && isPaused && (
              <div className="mt-3 flex items-start gap-2 bg-yellow-50 text-yellow-800 rounded p-3 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Paused: {enrollment.pauseReason}</span>
              </div>
            )}
            {enrollment.status === "CANCELLED" && (
              <div className="mt-3 flex items-start gap-2 bg-red-50 text-red-800 rounded p-3 text-sm">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>This enrollment has been cancelled.{enrollment.cancelReason ? ` Reason: ${enrollment.cancelReason}` : ""}</span>
              </div>
            )}

            {/* Actions */}
            {(isActive || isPaused) && (
              <div className="mt-4 pt-4 border-t space-y-2">
                {pauseInfo.message && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {pauseInfo.message}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                {isActive && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={actionLoading || !pauseInfo.canPause}>
                        <PauseCircle className="h-4 w-4 mr-1" /> Pause
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Pause Enrollment?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="space-y-3">
                            <p>All upcoming sessions will be cancelled and credits refunded. Please note the following rules:</p>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                                <span>After pausing, you must wait <strong>48 hours</strong> before you can resume.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                                <span>After resuming, you must wait <strong>48 hours</strong> before you can pause again.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                                <span>You can only pause <strong>{MAX_PAUSES} times per month</strong>. You have <strong>{pausesRemaining} pause(s)</strong> remaining this month.</span>
                              </li>
                            </ul>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePause} className="bg-amber-600 hover:bg-amber-700">Pause Enrollment</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {isPaused && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={actionLoading || !pauseInfo.canResume} className="text-green-700 border-green-300 hover:bg-green-50">
                        <PlayCircle className="h-4 w-4 mr-1" /> Resume
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Resume Enrollment?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="space-y-3">
                            <p>New sessions will be generated and credits will be deducted. Please note the following rules:</p>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                                <span>After resuming, you must wait <strong>48 hours</strong> before you can pause again.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                                <span>After pausing, you must wait <strong>48 hours</strong> before you can resume.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                                <span>You can only pause <strong>{MAX_PAUSES} times per month</strong>. Use your pauses wisely.</span>
                              </li>
                            </ul>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResume} className="bg-green-600 hover:bg-green-700">Resume Enrollment</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Cancel Enrollment */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                      <XCircle className="h-4 w-4 mr-1" /> Cancel Enrollment
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Enrollment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will cancel all future sessions and refund their credits. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Enrollment</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">Cancel Enrollment</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Materials */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Course Materials
              {materials.length > 0 && (
                <Badge variant="secondary" className="text-xs">{materials.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {materials.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No course materials uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {materials.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase shrink-0 ${
                          m.fileType === "pdf" ? "bg-red-50 text-red-700 border-red-200"
                            : m.fileType === "docx" || m.fileType === "doc" ? "bg-blue-50 text-blue-700 border-blue-200"
                            : m.fileType === "pptx" || m.fileType === "ppt" ? "bg-orange-50 text-orange-700 border-orange-200"
                            : m.fileType === "xlsx" || m.fileType === "xls" ? "bg-green-50 text-green-700 border-green-200"
                            : m.fileType === "mp4" ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {m.fileType}
                      </Badge>
                      <span className="text-sm font-medium truncate">{m.title}</span>
                      {m.fileSizeKb && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {m.fileSizeKb >= 1024 ? `${(m.fileSizeKb / 1024).toFixed(1)} MB` : `${m.fileSizeKb} KB`}
                        </span>
                      )}
                    </div>
                    <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 shrink-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions — split into Upcoming and Past */}
        {(() => {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const upcoming = sessions.filter(
            (s) => new Date(s.scheduledDate) >= now && ["CONFIRMED", "SCHEDULED"].includes(s.status)
          );
          const past = sessions.filter((s) => !upcoming.includes(s));

          const renderSession = (session: EnrollmentSession) => {
            const sc = sessionStatusConfig[session.status];
            return (
              <div key={session.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-white">
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <span className="font-medium">
                    {new Date(session.scheduledDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="text-muted-foreground">
                    {displayTime(session.scheduledStart, enrollment.parent?.user?.timezone || "Asia/Dubai")} - {displayTime(session.scheduledEnd, enrollment.parent?.user?.timezone || "Asia/Dubai")}
                  </span>
                  <Badge className={`text-[10px] ${sc.color}`} variant="secondary">{sc.label}</Badge>
                  <span className="text-xs text-muted-foreground">{session.creditsCharged} credits</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {enrollment.zoomLink && enrollment.status === "ACTIVE" && ["CONFIRMED", "SCHEDULED"].includes(session.status) && (
                    <a href={enrollment.zoomLink} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="text-xs text-blue-600 border-blue-300 hover:bg-blue-50">
                        <Video className="h-3 w-3 mr-1" /> Join
                      </Button>
                    </a>
                  )}
                  {canReportNoShow(session) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50" disabled={actionLoading}>
                          <Flag className="h-3 w-3 mr-1" /> No-Show
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Report Tutor No-Show?</AlertDialogTitle>
                          <AlertDialogDescription>
                            If your tutor did not attend this session, we will refund your credits and record a strike against the tutor. This report must be made within 24 hours of the session.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleReportNoShow(session.id)} className="bg-orange-600 hover:bg-orange-700">
                            Report No-Show
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {canCancelSession(session) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0" disabled={actionLoading}>
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel this session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {(() => {
                              const sessionDate = new Date(session.scheduledDate);
                              const [hh, mm] = session.scheduledStart.split(":");
                              sessionDate.setHours(Number(hh), Number(mm));
                              const hoursUntil = (sessionDate.getTime() - Date.now()) / (1000 * 60 * 60);
                              return hoursUntil >= 24
                                ? "This session is more than 24 hours away. Credits will be refunded."
                                : "This session is less than 24 hours away. Credits will NOT be refunded.";
                            })()}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Session</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancelSession(session.id)} className="bg-red-600 hover:bg-red-700">
                            Cancel Session
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            );
          };

          return (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Upcoming Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcoming.length > 0 ? (
                    <div className="space-y-2">{upcoming.map(renderSession)}</div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No upcoming sessions.</p>
                  )}
                </CardContent>
              </Card>
              {past.length > 0 && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-muted-foreground">Past Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">{past.map(renderSession)}</div>
                  </CardContent>
                </Card>
              )}
            </>
          );
        })()}

      </div>

    </ParentDashboardLayout>
  );
};

export default EnrollmentDetail;
