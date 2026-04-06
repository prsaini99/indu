import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  XCircle,
  Eye,
  Calendar,
  Clock,
  User,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayTimeRange, displayTime } from "@/lib/utils";
import {
  adminEnrollmentService,
  type Enrollment,
  type EnrollmentSession,
  type EnrollmentStatus,
} from "@/services/enrollment.service";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const sessionStatusColors: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED_PARENT: "bg-gray-100 text-gray-500",
  CANCELLED_LATE: "bg-orange-100 text-orange-700",
  SKIPPED: "bg-red-100 text-red-700",
  NO_SHOW_REPORTED: "bg-amber-100 text-amber-700",
  MISSED_TUTOR: "bg-red-100 text-red-700",
};

const AdminEnrollments = () => {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail drawer
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [sessions, setSessions] = useState<EnrollmentSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Action dialog
  const [actionDialog, setActionDialog] = useState<{
    type: "cancel" | "pause" | null;
    enrollmentId: string;
  }>({ type: null, enrollmentId: "" });
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Reassign tutor dialog
  const [reassignDialog, setReassignDialog] = useState<{ enrollmentId: string } | null>(null);
  const [reassignTutors, setReassignTutors] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);

  // Stable counts (independent of filter)
  const [counts, setCounts] = useState({ all: 0, ACTIVE: 0, PAUSED: 0, CANCELLED: 0 });

  const fetchCounts = async () => {
    try {
      const [all, active, paused, cancelled] = await Promise.all([
        adminEnrollmentService.list({ page: 1, limit: 1 }),
        adminEnrollmentService.list({ page: 1, limit: 1, status: "ACTIVE" }),
        adminEnrollmentService.list({ page: 1, limit: 1, status: "PAUSED" }),
        adminEnrollmentService.list({ page: 1, limit: 1, status: "CANCELLED" }),
      ]);
      setCounts({
        all: all.meta.total,
        ACTIVE: active.meta.total,
        PAUSED: paused.meta.total,
        CANCELLED: cancelled.meta.total,
      });
    } catch { /* ignore */ }
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: EnrollmentStatus } = { page, limit: 15 };
      if (statusFilter !== "all") params.status = statusFilter as EnrollmentStatus;
      const res = await adminEnrollmentService.list(params);
      setEnrollments(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [page, statusFilter]);

  const openDetail = async (enrollment: Enrollment) => {
    setSelected(enrollment);
    setSessionsLoading(true);
    try {
      const res = await adminEnrollmentService.getSessions(enrollment.id, { limit: 50 });
      setSessions(res.data);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setSessions([]);
  };

  const handleAction = async () => {
    if (!actionDialog.type) return;
    setActionLoading(true);
    try {
      if (actionDialog.type === "cancel") {
        await adminEnrollmentService.forceCancel(actionDialog.enrollmentId, actionReason || undefined);
        toast({ title: "Enrollment cancelled" });
      } else if (actionDialog.type === "pause") {
        await adminEnrollmentService.forcePause(actionDialog.enrollmentId, actionReason || undefined);
        toast({ title: "Enrollment paused" });
      }
      setActionDialog({ type: null, enrollmentId: "" });
      setActionReason("");
      fetchEnrollments();
      fetchCounts();
      if (selected?.id === actionDialog.enrollmentId) closeDetail();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.error?.message || "Action failed",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async (enrollmentId: string) => {
    try {
      await adminEnrollmentService.forceResume(enrollmentId);
      toast({ title: "Enrollment resumed" });
      fetchEnrollments();
      fetchCounts();
      if (selected?.id === enrollmentId) closeDetail();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.error?.message || "Resume failed",
        variant: "destructive",
      });
    }
  };

  const openReassignDialog = async (enrollmentId: string) => {
    setReassignDialog({ enrollmentId });
    setSelectedTutorId("");
    setReassignLoading(true);
    try {
      const tutors = await adminEnrollmentService.listTutorsForReassign(enrollmentId);
      setReassignTutors(tutors);
    } catch {
      setReassignTutors([]);
    } finally {
      setReassignLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!reassignDialog || !selectedTutorId) return;
    setReassignLoading(true);
    try {
      await adminEnrollmentService.reassignTutor(reassignDialog.enrollmentId, selectedTutorId);
      toast({ title: "Tutor reassigned" });
      setReassignDialog(null);
      fetchEnrollments();
      if (selected?.id === reassignDialog.enrollmentId) closeDetail();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error?.message || "Reassign failed", variant: "destructive" });
    } finally {
      setReassignLoading(false);
    }
  };

  const [reviewLoading, setReviewLoading] = useState<string | null>(null);

  const handleReviewNoShow = async (sessionId: string, decision: 'APPROVE' | 'REJECT') => {
    setReviewLoading(sessionId);
    try {
      const updated = await adminEnrollmentService.reviewNoShow(sessionId, decision);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...updated } : s)));
      toast({ title: decision === 'APPROVE' ? "No-show approved — credits refunded" : "No-show rejected — session restored" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error?.message || "Review failed", variant: "destructive" });
    } finally {
      setReviewLoading(null);
    }
  };

  const getTz = (e: Enrollment) => e.parent?.user?.timezone || "Asia/Dubai";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage all paid class enrollments ({total} total)
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.all, color: "text-gray-700", filter: "all" },
          { label: "Active", value: counts.ACTIVE, color: "text-green-600", filter: "ACTIVE" },
          { label: "Paused", value: counts.PAUSED, color: "text-amber-600", filter: "PAUSED" },
          { label: "Cancelled", value: counts.CANCELLED, color: "text-gray-500", filter: "CANCELLED" },
        ].map((stat) => (
          <Card
            key={stat.filter}
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === stat.filter ? "ring-2 ring-indigo-500" : ""}`}
            onClick={() => { setStatusFilter(stat.filter); setPage(1); }}
          >
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>



      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : enrollments.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No enrollments found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        {e.student.firstName} {e.student.lastName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {e.parent.firstName} {e.parent.lastName}
                      </TableCell>
                      <TableCell>{e.subject.name}</TableCell>
                      <TableCell className="text-sm">
                        {e.tutor.firstName} {e.tutor.lastName}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px]">
                        {(e.schedule || [])
                          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                          .map((s, i) => (
                            <div key={i}>{DAY_LABELS[s.dayOfWeek]} {displayTimeRange(s.startTime, e.duration, getTz(e))}</div>
                          ))}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[e.status] || "bg-gray-100 text-gray-600"}>
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(e)} title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {e.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActionDialog({ type: "pause", enrollmentId: e.id })}
                              title="Force pause"
                            >
                              <Pause className="h-4 w-4 text-amber-600" />
                            </Button>
                          )}
                          {e.status === "PAUSED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResume(e.id)}
                              title="Force resume"
                            >
                              <Play className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {e.status !== "CANCELLED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActionDialog({ type: "cancel", enrollmentId: e.id })}
                              title="Force cancel"
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Enrollment Detail
                  <Badge className={statusColors[selected.status]}>{selected.status}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Student:</span>
                    <span className="font-medium">{selected.student.firstName} {selected.student.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Parent:</span>
                    <span className="font-medium">{selected.parent.firstName} {selected.parent.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Subject:</span>
                    <span className="font-medium">{selected.subject.name}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Tutor:</span>
                    <span className="font-medium">{selected.tutor.firstName} {selected.tutor.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Credits/session:</span>
                    <span className="font-medium">{selected.creditsPerSession}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">{new Date(selected.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Schedule
                </p>
                <div className="flex flex-wrap gap-2">
                  {(selected.schedule || [])
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((s) => (
                      <Badge key={s.dayOfWeek} variant="outline">
                        {DAY_LABELS[s.dayOfWeek]} {displayTimeRange(s.startTime, selected.duration, getTz(selected))}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Reasons */}
              {selected.cancelReason && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm">
                  <span className="font-medium text-red-700">Cancel reason:</span> {selected.cancelReason}
                </div>
              )}
              {selected.pauseReason && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg text-sm">
                  <span className="font-medium text-amber-700">Pause reason:</span> {selected.pauseReason}
                </div>
              )}

              {/* Admin actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                {selected.status === "ACTIVE" && (
                  <Button variant="outline" size="sm" onClick={() => setActionDialog({ type: "pause", enrollmentId: selected.id })}>
                    <Pause className="h-4 w-4 mr-1 text-amber-600" /> Force Pause
                  </Button>
                )}
                {selected.status === "PAUSED" && (
                  <Button variant="outline" size="sm" onClick={() => handleResume(selected.id)}>
                    <Play className="h-4 w-4 mr-1 text-green-600" /> Force Resume
                  </Button>
                )}
                {selected.status !== "CANCELLED" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openReassignDialog(selected.id)}>
                      <RefreshCw className="h-4 w-4 mr-1 text-indigo-600" /> Reassign Tutor
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActionDialog({ type: "cancel", enrollmentId: selected.id })}>
                      <XCircle className="h-4 w-4 mr-1 text-red-500" /> Force Cancel
                    </Button>
                  </>
                )}
              </div>

              {/* Sessions */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Sessions</p>
                {sessionsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No sessions generated yet.</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="text-sm">
                              {new Date(s.scheduledDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                            </TableCell>
                            <TableCell className="text-sm">
                              {displayTime(s.scheduledStart, getTz(selected))} - {displayTime(s.scheduledEnd, getTz(selected))}
                            </TableCell>
                            <TableCell>
                              <Badge className={sessionStatusColors[s.status] || "bg-gray-100 text-gray-600"}>
                                {s.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{s.creditsCharged}</TableCell>
                            <TableCell>
                              {s.status === "NO_SHOW_REPORTED" && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                    disabled={reviewLoading === s.id}
                                    onClick={() => handleReviewNoShow(s.id, 'APPROVE')}
                                  >
                                    {reviewLoading === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs text-red-700 border-red-300 hover:bg-red-50"
                                    disabled={reviewLoading === s.id}
                                    onClick={() => handleReviewNoShow(s.id, 'REJECT')}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionDialog.type} onOpenChange={(open) => !open && setActionDialog({ type: null, enrollmentId: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "cancel" ? "Force Cancel Enrollment" : "Force Pause Enrollment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-gray-600">
              {actionDialog.type === "cancel"
                ? "This will cancel the enrollment and refund all future sessions. This action cannot be undone."
                : "This will pause the enrollment and refund all future sessions."}
            </p>
            <Textarea
              placeholder="Reason (optional)"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog({ type: null, enrollmentId: "" }); setActionReason(""); }}>
              Cancel
            </Button>
            <Button
              variant={actionDialog.type === "cancel" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {actionDialog.type === "cancel" ? "Confirm Cancel" : "Confirm Pause"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Reassign Tutor Dialog */}
      <Dialog open={!!reassignDialog} onOpenChange={(open) => !open && setReassignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Tutor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-gray-600">Select a new tutor for this enrollment. Only tutors who teach this subject and grade are shown.</p>
            {reassignLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : reassignTutors.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No eligible tutors found.</p>
            ) : (
              <Select value={selectedTutorId} onValueChange={setSelectedTutorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tutor" />
                </SelectTrigger>
                <SelectContent>
                  {reassignTutors.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialog(null)}>Cancel</Button>
            <Button onClick={handleReassign} disabled={!selectedTutorId || reassignLoading}>
              {reassignLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEnrollments;
