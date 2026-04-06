import { useState, useEffect, useCallback } from "react";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Loader2,
  PlayCircle,
  XCircle,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayTime } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { recordingService, type RecordingListItem } from "@/services/recording.service";

type ClassTypeFilter = "" | "ONE_TO_ONE" | "GROUP";

const TutorRecordingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const tutorTz = user?.timezone || "Asia/Dubai";

  const [recordings, setRecordings] = useState<RecordingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ page: number; totalPages: number; total: number } | null>(null);
  const [classTypeFilter, setClassTypeFilter] = useState<ClassTypeFilter>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState<string | null>(null);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await recordingService.getTutorRecordings({
        page,
        limit: 12,
        classType: classTypeFilter || undefined,
      });
      setRecordings(result.data);
      setMeta(result.meta);
    } catch {
      toast({ title: "Error", description: "Failed to load recordings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, classTypeFilter, toast]);

  useEffect(() => { fetchRecordings(); }, [fetchRecordings]);
  useEffect(() => { setPage(1); }, [classTypeFilter]);

  const handleWatch = async (sessionId: string) => {
    setVideoLoading(sessionId);
    try {
      const result = await recordingService.getSessionRecordingUrl(sessionId);
      const videoFile = result.files.find((f) => f.type === "VIDEO");
      if (videoFile) setVideoUrl(videoFile.url);
      else toast({ title: "No video", description: "No video recording available.", variant: "destructive" });
    } catch {
      toast({ title: "Not available", description: "Recording is not available yet.", variant: "destructive" });
    } finally {
      setVideoLoading(null);
    }
  };

  const getSubjectInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const getSubjectColor = (name: string) => {
    const colors = [
      "from-indigo-400 to-indigo-600", "from-purple-400 to-purple-600",
      "from-blue-400 to-blue-600", "from-emerald-400 to-emerald-600",
      "from-amber-400 to-amber-600", "from-rose-400 to-rose-600",
    ];
    let hash = 0;
    for (const c of name) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <TutorDashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Recordings</h1>
          <p className="text-muted-foreground text-sm mt-1">Review your past class recordings</p>
        </div>

        {/* Class type filter */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "" as ClassTypeFilter, label: "All", icon: Video },
            { value: "ONE_TO_ONE" as ClassTypeFilter, label: "1:1 Classes", icon: User },
            { value: "GROUP" as ClassTypeFilter, label: "Group", icon: Users },
          ].map((f) => (
            <Button
              key={f.value}
              variant={classTypeFilter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setClassTypeFilter(f.value)}
              className={classTypeFilter === f.value ? "bg-gray-800 hover:bg-gray-900" : ""}
            >
              <f.icon className="h-3 w-3 mr-1" />
              {f.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : recordings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Video className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">No recordings yet</h3>
              <p className="text-muted-foreground text-sm mt-1 text-center max-w-md">
                Class recordings will appear here after your sessions are completed and processed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recordings.map((recording) => {
                const subjectName = recording.enrollment?.subject?.name || "Class";
                const studentName = recording.enrollment?.student
                  ? `${recording.enrollment.student.firstName} ${recording.enrollment.student.lastName}`
                  : "";
                const sessionDate = recording.session?.scheduledDate
                  ? new Date(recording.session.scheduledDate).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric", year: "numeric",
                    })
                  : "";
                const sessionTime = recording.session?.scheduledStart
                  ? displayTime(recording.session.scheduledStart, tutorTz)
                  : "";

                return (
                  <Card key={recording.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className={`h-32 bg-gradient-to-br ${getSubjectColor(subjectName)} flex items-center justify-center relative`}>
                      <span className="text-white text-3xl font-bold opacity-30">
                        {getSubjectInitials(subjectName)}
                      </span>
                      <div className="absolute bottom-2 right-2">
                        <Badge className="bg-black/50 text-white text-[10px]">
                          {recording.meetingDuration || recording.enrollment?.duration || 60} min
                        </Badge>
                      </div>
                      {recording.enrollment?.classType && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-white/90 text-gray-700 text-[10px]">
                            {recording.enrollment.classType === "ONE_TO_ONE" ? "1:1" : "Group"}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm text-gray-800 truncate">{recording.title}</h3>
                      {recording.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{recording.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        <span className="truncate">Student: {studentName}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {sessionDate} {sessionTime && `· ${sessionTime}`}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-purple-600 border-purple-300 hover:bg-purple-50"
                          disabled={videoLoading === recording.session?.id}
                          onClick={() => recording.session && handleWatch(recording.session.id)}
                        >
                          <PlayCircle className="h-3 w-3 mr-1" />
                          {videoLoading === recording.session?.id ? "Loading..." : "Watch"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Player Modal */}
      {videoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setVideoUrl(null)}>
          <div className="relative w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="absolute -top-10 right-0 text-white hover:text-gray-300" onClick={() => setVideoUrl(null)}>
              <XCircle className="h-5 w-5 mr-1" /> Close
            </Button>
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full rounded-lg shadow-2xl"
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
      )}
    </TutorDashboardLayout>
  );
};

export default TutorRecordingsPage;
