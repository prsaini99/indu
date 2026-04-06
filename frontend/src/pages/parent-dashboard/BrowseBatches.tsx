import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Loader2,
  Calendar,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayTimeRange } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { referenceService, type Subject, type GradeLevel } from "@/services/user.service";
import { parentBatchService, type Batch } from "@/services/batch.service";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BrowseBatches = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const parentTz = user?.timezone || "Asia/Dubai";

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ page: number; totalPages: number; total: number } | null>(null);

  // Filters
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");

  // Load reference data
  useEffect(() => {
    Promise.all([referenceService.getSubjects(), referenceService.getGrades()])
      .then(([s, g]) => { setSubjects(s); setGrades(g); })
      .catch(() => {});
  }, []);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const result = await parentBatchService.listAvailable({
        page,
        limit: 12,
        subjectId: subjectFilter || undefined,
        gradeId: gradeFilter || undefined,
      });
      setBatches(result.data);
      setMeta(result.meta);
    } catch {
      toast({ title: "Error", description: "Failed to load group classes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, subjectFilter, gradeFilter, toast]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);
  useEffect(() => { setPage(1); }, [subjectFilter, gradeFilter]);

  const getSubjectInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const getSubjectColor = (name: string) => {
    const colors = [
      "from-indigo-400 to-indigo-600", "from-purple-400 to-purple-600",
      "from-blue-400 to-blue-600", "from-emerald-400 to-emerald-600",
      "from-amber-400 to-amber-600", "from-rose-400 to-rose-600",
      "from-cyan-400 to-cyan-600", "from-pink-400 to-pink-600",
    ];
    let hash = 0;
    for (const c of name) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
    return colors[Math.abs(hash) % colors.length];
  };

  const getStatusBadge = (batch: Batch) => {
    const spots = batch.maxStudents - (batch._count?.students || 0);
    if (batch.status === "FULL") return { text: "Full", color: "bg-red-500 text-white" };
    if (spots === 1) return { text: "1 spot left!", color: "bg-amber-500 text-white" };
    if (spots <= 2) return { text: `${spots} spots left`, color: "bg-amber-400 text-white" };
    return { text: "Open", color: "bg-green-500 text-white" };
  };

  return (
    <ParentDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-indigo-800">Browse Classes</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Browse and join small group classes for your children
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Select value={subjectFilter} onValueChange={(v) => setSubjectFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gradeFilter} onValueChange={(v) => setGradeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Batch Cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : batches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">No group classes available</h3>
              <p className="text-muted-foreground text-sm mt-1 text-center max-w-md">
                Check back soon — new group classes are added regularly.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {batches.map((batch) => {
                const subjectName = batch.subject?.name || "Class";
                const statusBadge = getStatusBadge(batch);
                const studentCount = batch._count?.students || 0;
                const spotsPercent = (studentCount / batch.maxStudents) * 100;
                const scheduleLines = (batch.schedule || [])
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((s) => `${DAY_LABELS[s.dayOfWeek]} ${displayTimeRange(s.startTime, batch.duration, parentTz)}`);

                return (
                  <Link key={batch.id} to={`/parent-dashboard/batches/${batch.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                      {/* Gradient Header with placeholders */}
                      <div className={`h-36 bg-gradient-to-br ${getSubjectColor(subjectName)} flex items-center justify-center relative`}>
                        <span className="text-white text-4xl font-bold opacity-20">
                          {getSubjectInitials(subjectName)}
                        </span>

                        {/* Duration badge */}
                        <div className="absolute bottom-2 right-2">
                          <Badge className="bg-black/50 text-white text-[10px]">
                            <Clock className="h-2.5 w-2.5 mr-0.5" /> {batch.duration} min
                          </Badge>
                        </div>

                        {/* Status badge */}
                        <div className="absolute top-2 left-2">
                          <Badge className={`text-[10px] ${statusBadge.color}`}>
                            {statusBadge.text}
                          </Badge>
                        </div>

                      </div>

                      <CardContent className="p-4">
                        {/* Title */}
                        <h3 className="font-semibold text-gray-800 truncate">{batch.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{subjectName} · {batch.grade?.name}</p>

                        {/* Tutor */}
                        <div className="flex items-center gap-2 mt-3">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <User className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <span className="text-sm text-gray-700 truncate">
                            {batch.tutor?.firstName} {batch.tutor?.lastName}
                          </span>
                        </div>

                        {/* Schedule */}
                        <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mt-0.5 shrink-0" />
                          <div className="flex flex-col">
                            {scheduleLines.map((line, i) => <span key={i}>{line}</span>)}
                          </div>
                        </div>

                        {/* Spots progress bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              {studentCount} of {batch.maxStudents} students
                            </span>
                            <span className="font-medium text-indigo-600">
                              {batch.maxStudents - studentCount} spots left
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all"
                              style={{ width: `${Math.min(spotsPercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Credits */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-sm">
                            <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="font-semibold text-indigo-700">{batch.creditsPerSession}</span>
                            <span className="text-muted-foreground text-xs">credits/session</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
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
    </ParentDashboardLayout>
  );
};

export default BrowseBatches;
