import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Loader2,
  Plus,
  User,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayTimeRange } from "@/lib/utils";
import {
  parentEnrollmentService,
  type Enrollment,
  type EnrollmentStatus,
} from "@/services/enrollment.service";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusConfig: Record<EnrollmentStatus, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  PAUSED: { label: "Paused", color: "bg-yellow-100 text-yellow-700", icon: PauseCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500", icon: XCircle },
  COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
};

const ParentEnrolledClasses = () => {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | null>(null);

  useEffect(() => {
    parentEnrollmentService
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
    cancelled: enrollments.filter((e) => e.status === "CANCELLED").length,
  }), [enrollments]);

  const filteredEnrollments = statusFilter
    ? enrollments.filter((e) => e.status === statusFilter)
    : enrollments;

  const toggleFilter = (status: EnrollmentStatus) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  return (
    <ParentDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-indigo-800">Enrolled Classes</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your children's recurring class enrollments.
            </p>
          </div>
          <Link to="/parent-dashboard/enrollments/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-1" /> New Enrollment
            </Button>
          </Link>
        </div>

        {/* Stats — clickable filters */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card
            className={`cursor-pointer transition-all ${statusFilter === null ? "ring-2 ring-indigo-500" : "hover:shadow-md"}`}
            onClick={() => setStatusFilter(null)}
          >
            <CardContent className="p-4 text-center">
              <BookOpen className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
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

        {/* Enrollment List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEnrollments.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredEnrollments.map((enrollment) => {
              const sc = statusConfig[enrollment.status];
              const StatusIcon = sc.icon;
              return (
                <Link key={enrollment.id} to={`/parent-dashboard/enrollments/${enrollment.id}`} className="block">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-sm">
                          {enrollment.student.firstName} {enrollment.student.lastName}
                        </h3>
                        <Badge className={`text-[10px] ${sc.color}`} variant="secondary">
                          <StatusIcon className="h-3 w-3 mr-0.5" />
                          {sc.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {enrollment.subject.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Tutor: {enrollment.tutor.firstName} {enrollment.tutor.lastName}
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
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {enrollment.creditsPerSession} credits/session
                        </span>
                      </div>
                      {enrollment.pauseReason && enrollment.status === "PAUSED" && (
                        <p className="text-xs text-yellow-700 mt-2 bg-yellow-50 rounded p-2">
                          Paused: {enrollment.pauseReason}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : enrollments.length > 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No {statusFilter?.toLowerCase()} enrollments found.
            </p>
            <Button variant="link" size="sm" onClick={() => setStatusFilter(null)}>
              Show all
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No enrollments yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create an enrollment to start recurring classes for your child.
            </p>
            <Link to="/parent-dashboard/enrollments/new">
              <Button size="sm" className="mt-3 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-1" /> New Enrollment
              </Button>
            </Link>
          </div>
        )}
      </div>
    </ParentDashboardLayout>
  );
};

export default ParentEnrolledClasses;
