import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CreditCard,
  User,
  Video,
  Loader2,
  Save,
  CheckCircle2,
  PlayCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayTime, displayTimeRange } from "@/lib/utils";
import {
  tutorEnrollmentService,
  type Enrollment,
  type EnrollmentSession,
  type SessionStatus,
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

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const TutorEnrollmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [sessions, setSessions] = useState<EnrollmentSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Meeting link form
  const [zoomLink, setZoomLink] = useState("");
  const [zoomPassword, setZoomPassword] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [e, s] = await Promise.all([
        tutorEnrollmentService.getById(id),
        tutorEnrollmentService.getSessions(id, { limit: 50 }),
      ]);
      setEnrollment(e);
      setSessions(
        s.data.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      );
      setZoomLink(e.zoomLink || "");
      setZoomPassword(e.zoomPassword || "");
    } catch {
      toast({ title: "Error", description: "Failed to load enrollment details.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSaveMeetingLink = async () => {
    if (!id || !zoomLink.trim()) return;
    setSavingLink(true);
    try {
      const updated = await tutorEnrollmentService.updateMeetingLink(id, zoomLink.trim(), zoomPassword.trim() || undefined);
      setEnrollment(updated);
      toast({ title: "Meeting Link Saved", description: "Students and parents can now see your Zoom link." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error?.message || "Failed to save meeting link.", variant: "destructive" });
    } finally {
      setSavingLink(false);
    }
  };

  if (loading) {
    return (
      <TutorDashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </TutorDashboardLayout>
    );
  }

  if (!enrollment) {
    return (
      <TutorDashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Enrollment not found.</p>
          <Button variant="link" onClick={() => navigate("/tutor-dashboard/enrollments")}>
            Back to Enrollments
          </Button>
        </div>
      </TutorDashboardLayout>
    );
  }

  const parentTz = enrollment.parent?.user?.timezone || "Asia/Dubai";

  return (
    <TutorDashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate("/tutor-dashboard/enrollments")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {/* Enrollment Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg text-purple-800">
                {enrollment.student.firstName} {enrollment.student.lastName} — {enrollment.subject.name}
              </CardTitle>
              <Badge className={`text-xs ${statusColors[enrollment.status]}`} variant="secondary">
                {enrollment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Parent: <strong className="text-foreground">{enrollment.parent.firstName} {enrollment.parent.lastName}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground col-span-2 sm:col-span-3">
                <Calendar className="h-4 w-4 shrink-0" />
                <div>
                  {(enrollment.schedule || [])
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((s, i) => (
                      <div key={i}>{DAY_LABELS[s.dayOfWeek]} {displayTimeRange(s.startTime, enrollment.duration, parentTz)}</div>
                    ))}
                  <span className="text-muted-foreground">{(enrollment.schedule || []).length}x/week</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>{enrollment.creditsPerSession} credits/session</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Link — hidden when cancelled */}
        {enrollment.status === "ACTIVE" && <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4" /> Meeting Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label htmlFor="zoomLink" className="text-sm">Zoom Link</Label>
                <Input
                  id="zoomLink"
                  placeholder="https://zoom.us/j/..."
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="zoomPassword" className="text-sm">Password (optional)</Label>
                <Input
                  id="zoomPassword"
                  placeholder="Meeting password"
                  value={zoomPassword}
                  onChange={(e) => setZoomPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleSaveMeetingLink}
                disabled={savingLink || !zoomLink.trim()}
                size="sm"
              >
                {savingLink ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : enrollment.zoomLink ? (
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                {enrollment.zoomLink ? "Update Link" : "Save Link"}
              </Button>
              {enrollment.zoomLink && (
                <p className="text-xs text-muted-foreground">
                  Current link: <a href={enrollment.zoomLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{enrollment.zoomLink}</a>
                </p>
              )}
            </div>
          </CardContent>
        </Card>}

        {/* Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map((session) => {
                  const sc = sessionStatusConfig[session.status];
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-white"
                    >
                      <div className="flex items-center gap-3 flex-wrap text-sm">
                        <span className="font-medium">
                          {new Date(session.scheduledDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-muted-foreground">
                          {displayTime(session.scheduledStart, parentTz)} - {displayTime(session.scheduledEnd, parentTz)}
                        </span>
                        <Badge className={`text-[10px] ${sc.color}`} variant="secondary">
                          {sc.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No sessions generated yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

    </TutorDashboardLayout>
  );
};

export default TutorEnrollmentDetail;
