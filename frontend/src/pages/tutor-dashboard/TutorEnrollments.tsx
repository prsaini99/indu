import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calendar,
  User,
  Loader2,
  CheckCircle2,
  PauseCircle,
  Video,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayTimeRange } from "@/lib/utils";
import {
  tutorEnrollmentService,
  type Enrollment,
  type EnrollmentStatus,
} from "@/services/enrollment.service";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusColors: Record<EnrollmentStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const TutorEnrollments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | null>(null);

  useEffect(() => {
    tutorEnrollmentService
      .list({ limit: 50 })
      .then((res) => setEnrollments(res.data))
      .catch(() =>
        toast({ title: "Error", description: "Failed to load enrollments.", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total: enrollments.length,
    active: enrollments.filter((e) => e.status === "ACTIVE").length,
    paused: enrollments.filter((e) => e.status === "PAUSED").length,
  }), [enrollments]);

  const filteredEnrollments = statusFilter
    ? enrollments.filter((e) => e.status === statusFilter)
    : enrollments;

  const toggleFilter = (status: EnrollmentStatus) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  return (
    <TutorDashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-purple-800">My Enrollments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Recurring class enrollments assigned to you.
          </p>
        </div>

        {/* Stats — clickable filters */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card
            className={`cursor-pointer transition-all ${statusFilter === null ? "ring-2 ring-purple-500" : "hover:shadow-md"}`}
            onClick={() => setStatusFilter(null)}
          >
            <CardContent className="p-4 text-center">
              <BookOpen className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${statusFilter === "ACTIVE" ? "ring-2 ring-green-500" : "hover:shadow-md"}`}
            onClick={() => toggleFilter("ACTIVE")}
          >
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${statusFilter === "PAUSED" ? "ring-2 ring-yellow-500" : "hover:shadow-md"}`}
            onClick={() => toggleFilter("PAUSED")}
          >
            <CardContent className="p-4 text-center">
              <PauseCircle className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.paused}</p>
              <p className="text-xs text-muted-foreground">Paused</p>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEnrollments.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredEnrollments.map((enrollment) => (
              <Card
                key={enrollment.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/tutor-dashboard/enrollments/${enrollment.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-sm">
                      {enrollment.student.firstName} {enrollment.student.lastName}
                    </h3>
                    <Badge className={`text-[10px] ${statusColors[enrollment.status]}`} variant="secondary">
                      {enrollment.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {enrollment.subject.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Parent: {enrollment.parent.firstName} {enrollment.parent.lastName}
                    </span>
                    <span className="flex items-start gap-1">
                      <Calendar className="h-3 w-3 mt-0.5" />
                      <span className="flex flex-col">
                        {(enrollment.schedule || [])
                          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                          .map((s, i) => (
                            <span key={i}>{DAY_LABELS[s.dayOfWeek]} {displayTimeRange(s.startTime, enrollment.duration, enrollment.parent?.user?.timezone || "Asia/Dubai")}</span>
                          ))}
                      </span>
                    </span>
                    {enrollment.zoomLink && enrollment.status === "ACTIVE" && (
                      <a
                        href={enrollment.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Video className="h-3 w-3" /> Zoom
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : enrollments.length > 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No {statusFilter?.toLowerCase()} enrollments found.
            </p>
            <button className="text-sm text-purple-600 hover:underline mt-1" onClick={() => setStatusFilter(null)}>
              Show all
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No enrollments</h3>
            <p className="text-sm text-muted-foreground mt-1">
              When parents enroll students in your classes, they'll appear here.
            </p>
          </div>
        )}
      </div>
    </TutorDashboardLayout>
  );
};

export default TutorEnrollments;
