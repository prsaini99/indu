import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Calendar, CreditCard, BookOpen, ClipboardList, Video,
  ArrowRight, Search, CreditCard as CreditIcon, Loader2, Clock,
} from "lucide-react";
import { ChildProfileCard } from "@/components/shared";
import { dashboardService, type ParentDashboardData } from "@/services/dashboard.service";
import { displayTime } from "@/lib/utils";

const ParentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const parentTz = user?.timezone || "Asia/Dubai";

  useEffect(() => {
    document.title = "Parent Dashboard | Indu AE";
    dashboardService.getParentDashboard()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const children = user.children || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const metrics = stats ? [
    { title: "My Children", value: String(stats.childrenCount), description: "Profiles added", icon: <Users className="h-4 w-4 text-white" />, iconBg: "bg-indigo-600", href: "/parent-dashboard/children" },
    { title: "Credit Balance", value: String(stats.creditBalance), description: "Credits available", icon: <CreditCard className="h-4 w-4 text-white" />, iconBg: "bg-green-600", href: "/parent-dashboard/credits" },
    { title: "Active Classes", value: String(stats.activeEnrollments + stats.activeBatches), description: `${stats.activeEnrollments} 1:1 · ${stats.activeBatches} group`, icon: <BookOpen className="h-4 w-4 text-white" />, iconBg: "bg-purple-600", href: "/parent-dashboard/enrolled-classes" },
    { title: "Upcoming Demos", value: String(stats.upcomingDemos), description: "Scheduled", icon: <Calendar className="h-4 w-4 text-white" />, iconBg: "bg-blue-600", href: "/parent-dashboard/demo-requests" },
    { title: "Assessments", value: String(stats.assessmentCount), description: "Results uploaded", icon: <ClipboardList className="h-4 w-4 text-white" />, iconBg: "bg-amber-500", href: "/parent-dashboard/assessments" },
    { title: "Recordings", value: "View", description: "Watch class recordings", icon: <Video className="h-4 w-4 text-white" />, iconBg: "bg-pink-500", href: "/parent-dashboard/recordings" },
  ] : [];

  return (
    <ParentDashboardLayout>
      <div className="flex flex-col gap-6 pb-8 max-w-7xl mx-auto">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
          <h1 className="text-2xl font-semibold text-indigo-800">
            {getGreeting()}, {user.fullName?.split(" ")[0] || "Parent"}!
          </h1>
          <p className="text-indigo-700 mt-2">
            Manage your children's education, find the best tutors, and track their progress.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric, index) => (
                <Link key={index} to={metric.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{metric.title}</p>
                          <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                        </div>
                        <div className={`${metric.iconBg} p-2 rounded-lg`}>{metric.icon}</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Sessions */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Upcoming Sessions</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/parent-dashboard/enrolled-classes" className="text-xs text-indigo-600">
                        View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {stats?.upcomingSessions && stats.upcomingSessions.length > 0 ? (
                      <div className="space-y-3">
                        {stats.upcomingSessions.map((s, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-indigo-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{s.subject}</p>
                                <p className="text-xs text-muted-foreground">{s.tutor} · {s.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              </p>
                              <p className="text-xs text-muted-foreground">{displayTime(s.time, parentTz)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No upcoming sessions. <Link to="/parent-dashboard/enrolled-classes" className="text-indigo-600 hover:underline">Create an enrollment</Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Assessments */}
              <div>
                {stats?.recentAssessments && stats.recentAssessments.length > 0 ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base">Recent Assessments</CardTitle>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/parent-dashboard/assessments" className="text-xs text-indigo-600">View All <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {stats.recentAssessments.map((a, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{a.subject}</p>
                            <p className="text-xs text-muted-foreground">{a.title}</p>
                          </div>
                          <span className={`text-sm font-bold ${a.percentage >= 80 ? "text-green-600" : a.percentage >= 50 ? "text-amber-600" : "text-red-600"}`}>
                            {a.percentage}%
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground text-sm">
                      No assessments yet. Results will appear here once your child's tutor uploads them.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ParentDashboardLayout>
  );
};

export default ParentDashboard;
