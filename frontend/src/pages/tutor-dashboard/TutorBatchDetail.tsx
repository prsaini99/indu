import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, CreditCard, Users, Loader2, Video, BookOpen, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayTimeRange } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { tutorBatchService, type Batch } from "@/services/batch.service";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  FULL: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-700",
};

const TutorBatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const tz = user?.timezone || "Asia/Dubai";

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    tutorBatchService.getById(id)
      .then(setBatch)
      .catch(() => toast({ title: "Error", description: "Failed to load batch.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <TutorDashboardLayout>
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </TutorDashboardLayout>
    );
  }

  if (!batch) {
    return (
      <TutorDashboardLayout>
        <div className="text-center py-12 text-muted-foreground">Batch not found.</div>
      </TutorDashboardLayout>
    );
  }

  const studentCount = batch._count?.students || batch.students?.length || 0;

  return (
    <TutorDashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/tutor-dashboard/batches")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Group Classes
        </Button>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{batch.name}</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">{batch.subject?.name} · {batch.grade?.name}</p>
              </div>
              <Badge className={statusColors[batch.status] || ""}>{batch.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {batch.description && (
              <p className="text-sm text-gray-600 mb-4">{batch.description}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Schedule</p>
                  <div className="font-medium text-gray-800">
                    {(batch.schedule || []).sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((s, i) => <div key={i}>{DAY_LABELS[s.dayOfWeek]} {displayTimeRange(s.startTime, batch.duration, tz)}</div>)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{batch.duration} min/session</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                <span className="font-semibold text-indigo-700">{batch.creditsPerSession} credits/session</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{studentCount} / {batch.maxStudents} students</span>
              </div>
            </div>

            {/* Zoom Link — prominent */}
            {batch.status === "ACTIVE" && batch.zoomLink && (
              <div className="mt-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Video className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                  <a href={batch.zoomLink} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium">
                    Join Zoom Meeting
                  </a>
                  {batch.zoomPassword && (
                    <p className="text-xs mt-0.5">
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-mono select-all">Password: {batch.zoomPassword}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Enrolled Students ({studentCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {batch.students && batch.students.length > 0 ? (
              <div className="space-y-2">
                {batch.students.map((bs) => (
                  <div key={bs.student.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{bs.student.firstName} {bs.student.lastName}</p>
                      {bs.parent && (
                        <p className="text-xs text-muted-foreground">
                          Parent: {bs.parent.firstName} {bs.parent.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No students enrolled yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Sessions */}
        {batch.sessions && batch.sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {batch.sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(session.scheduledDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {displayTimeRange(session.scheduledStart, batch.duration, tz)}
                        </p>
                      </div>
                    </div>
                    <Badge className={session.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-green-100 text-green-700"} variant="secondary">
                      {session.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TutorDashboardLayout>
  );
};

export default TutorBatchDetail;
