import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Calendar, Clock, CreditCard, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayTimeRange } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { tutorBatchService, type Batch, type BatchStatus } from "@/services/batch.service";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700", FULL: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-blue-100 text-blue-700", COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-700",
};

const TutorBatches = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const tz = user?.timezone || "Asia/Dubai";
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const result = await tutorBatchService.list({ limit: 50 });
      setBatches(result.data);
    } catch {
      toast({ title: "Error", description: "Failed to load batches.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const getSubjectColor = (name: string) => {
    const colors = ["from-indigo-400 to-indigo-600", "from-purple-400 to-purple-600", "from-blue-400 to-blue-600", "from-emerald-400 to-emerald-600", "from-amber-400 to-amber-600", "from-rose-400 to-rose-600"];
    let hash = 0;
    for (const c of name) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <TutorDashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Group Classes</h1>
          <p className="text-muted-foreground text-sm mt-1">Group classes you're teaching</p>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "", label: "All" },
            { value: "OPEN", label: "Open" },
            { value: "ACTIVE", label: "Active" },
            { value: "FULL", label: "Full" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
          ].map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f.value)}
              className={statusFilter === f.value ? "bg-gray-800 hover:bg-gray-900" : ""}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (() => {
          const filtered = statusFilter ? batches.filter((b) => b.status === statusFilter) : batches;
          return filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">No group classes assigned</h3>
              <p className="text-muted-foreground text-sm mt-1">You'll see your group classes here once admin assigns them.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((batch) => (
              <Link key={batch.id} to={`/tutor-dashboard/batches/${batch.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                  <div className={`h-24 bg-gradient-to-br ${getSubjectColor(batch.subject?.name || "")} flex items-center justify-center relative`}>
                    <span className="text-white text-2xl font-bold opacity-20">{(batch.subject?.name || "").slice(0, 2).toUpperCase()}</span>
                    <Badge className={`absolute top-2 left-2 text-[10px] ${statusColors[batch.status] || ""}`}>{batch.status}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-800 truncate">{batch.name}</h3>
                    <p className="text-xs text-muted-foreground">{batch.subject?.name} · {batch.grade?.name}</p>
                    <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mt-0.5" />
                      <div className="flex flex-col">
                        {(batch.schedule || []).sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((s, i) => (
                          <span key={i}>{DAY_LABELS[s.dayOfWeek]} {displayTimeRange(s.startTime, batch.duration, tz)}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{batch.duration}m</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{batch._count?.students || 0}/{batch.maxStudents} students</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        );
        })()}
      </div>
    </TutorDashboardLayout>
  );
};

export default TutorBatches;
