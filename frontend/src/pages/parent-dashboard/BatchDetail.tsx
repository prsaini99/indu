import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, Calendar, Clock, CreditCard, User, Users, Loader2, Video, BookOpen, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayTime, displayTimeRange } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { userService, type ChildProfile } from "@/services/user.service";
import { parentBatchService, type Batch } from "@/services/batch.service";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  FULL: "bg-red-100 text-red-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const BatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const parentTz = user?.timezone || "Asia/Dubai";

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [materials, setMaterials] = useState<{ id: string; title: string; fileUrl: string; fileType: string; fileSizeKb: number | null; createdAt: string }[]>([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      parentBatchService.getById(id),
      userService.getChildren(),
    ]).then(([b, c]) => {
      setBatch(b);
      setChildren(c);
      // Fetch course materials (non-blocking)
      parentBatchService.getCourseMaterials(id).then((res) => setMaterials(res.materials)).catch(() => {});
    }).catch(() => {
      toast({ title: "Error", description: "Failed to load batch details.", variant: "destructive" });
    }).finally(() => setLoading(false));
  }, [id]);

  // Check if any of parent's children are in this batch
  const joinedChildren = children.filter((child) =>
    batch?.students?.some((s) => s.student.id === child.id)
  );
  const isJoined = joinedChildren.length > 0;

  // Filter eligible children (matching grade, not already in batch)
  const eligibleChildren = children.filter((child) =>
    child.grade?.id === batch?.grade?.id && !joinedChildren.some((jc) => jc.id === child.id)
  );

  const handleJoin = async () => {
    if (!id || !selectedChild) return;
    setJoining(true);
    try {
      const result = await parentBatchService.join(id, selectedChild);
      toast({ title: "Joined!", description: result.message });
      const updated = await parentBatchService.getById(id);
      setBatch(updated);
      setSelectedChild("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error?.message || "Failed to join.", variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async (studentId: string) => {
    if (!id) return;
    setLeaving(true);
    try {
      await parentBatchService.leave(id, studentId);
      toast({ title: "Left batch", description: "Your child has been removed from this group class." });
      const updated = await parentBatchService.getById(id);
      setBatch(updated);
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error?.message || "Failed to leave.", variant: "destructive" });
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <ParentDashboardLayout>
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </ParentDashboardLayout>
    );
  }

  if (!batch) {
    return (
      <ParentDashboardLayout>
        <div className="text-center py-12 text-muted-foreground">Batch not found.</div>
      </ParentDashboardLayout>
    );
  }

  const studentCount = batch._count?.students || batch.students?.length || 0;

  return (
    <ParentDashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{batch.name}</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  {batch.subject?.name} · {batch.grade?.name}
                </p>
              </div>
              <Badge className={statusColors[batch.status] || "bg-gray-100"}>{batch.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {batch.description && (
              <p className="text-sm text-gray-600 mb-4">{batch.description}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {/* Tutor */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tutor</p>
                  <p className="font-medium text-gray-800">{batch.tutor?.firstName} {batch.tutor?.lastName}</p>
                </div>
              </div>

              {/* Schedule */}
              <div className="flex items-start gap-2 col-span-2 sm:col-span-1">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Schedule</p>
                  <div className="font-medium text-gray-800">
                    {(batch.schedule || []).sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((s, i) => <div key={i}>{DAY_LABELS[s.dayOfWeek]} {displayTimeRange(s.startTime, batch.duration, parentTz)}</div>)}
                  </div>
                </div>
              </div>

              {/* Duration + Credits */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{batch.duration} min/session</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                <span className="font-semibold text-indigo-700">{batch.creditsPerSession} credits/session</span>
                <Badge className="bg-indigo-50 text-indigo-600 text-[10px]">Group Rate</Badge>
              </div>

              {/* Students */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{studentCount} / {batch.maxStudents} students</span>
              </div>
            </div>

            {/* Zoom link (only if joined + batch is ACTIVE) */}
            {isJoined && batch.status === "ACTIVE" && batch.zoomLink && (
              <div className="mt-4 flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                <Video className="h-4 w-4 text-blue-600" />
                <a href={batch.zoomLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                  Join Zoom Meeting
                </a>
                {batch.zoomPassword && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono select-all ml-2">
                    Password: {batch.zoomPassword}
                  </span>
                )}
              </div>
            )}

            {/* Next session info */}
            {batch.status === "ACTIVE" && batch.sessions && batch.sessions.length > 0 && (() => {
              const nextSession = batch.sessions[0];
              const sessionDate = new Date(nextSession.scheduledDate);
              const now = new Date();
              const diffHours = Math.round((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60));
              const timeLabel = diffHours <= 0 ? "Today" : diffHours < 24 ? `In ${diffHours} hours` : `In ${Math.round(diffHours / 24)} days`;
              return (
                <div className="mt-4 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
                  <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="text-indigo-800">
                    Next session: <strong>{sessionDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</strong>
                    {" "}at <strong>{displayTime(nextSession.scheduledStart, parentTz)}</strong>
                    <span className="text-indigo-500 ml-1">({timeLabel})</span>
                  </span>
                </div>
              );
            })()}

            {/* Students enrolled */}
            {batch.students && batch.students.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1">Students enrolled:</p>
                <div className="flex flex-wrap gap-1">
                  {batch.students.slice(0, 4).map((bs) => (
                    <Badge key={bs.student.id} variant="secondary" className="text-xs">
                      {bs.student.firstName}
                    </Badge>
                  ))}
                  {batch.students.length > 4 && (
                    <Badge variant="secondary" className="text-xs">+{batch.students.length - 4} more</Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Join / Leave Actions */}
        {batch.status === "OPEN" && eligibleChildren.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Join this group class</p>
              <div className="flex items-center gap-3">
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleChildren.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.firstName} {child.lastName} ({child.grade?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleJoin}
                  disabled={!selectedChild || joining}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {joining ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Users className="h-4 w-4 mr-1" />}
                  Join
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Joined children — leave option */}
        {joinedChildren.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Your {joinedChildren.length === 1 ? "child" : "children"} in this class</p>
              {joinedChildren.map((child) => (
                <div key={child.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{child.firstName} {child.lastName}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 text-xs">
                        Leave
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Leave group class?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {child.firstName} will be removed from this group class. You can rejoin later if spots are available.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleLeave(child.id)} className="bg-red-600 hover:bg-red-700" disabled={leaving}>
                          {leaving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Leaving...</> : "Leave Class"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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

        {/* Upcoming Sessions */}
        {batch.sessions && batch.sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Sessions</CardTitle>
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
                          {displayTimeRange(session.scheduledStart, batch.duration, parentTz)}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 text-xs">{session.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ParentDashboardLayout>
  );
};

export default BatchDetail;
