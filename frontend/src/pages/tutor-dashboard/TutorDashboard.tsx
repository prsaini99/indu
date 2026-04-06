import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, Star, DollarSign, BookOpen, Loader2, Clock, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboardService, type TutorDashboardData } from "@/services/dashboard.service";
import { displayTime } from "@/lib/utils";

const TutorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<TutorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const tz = user?.timezone || "Asia/Dubai";

  useEffect(() => {
    document.title = "Tutor Dashboard | Indu AE";
    dashboardService.getTutorDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const formatInr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const activityIcons: Record<string, string> = { enrollment: "📚", review: "⭐", payout: "💰" };

  return (
    <TutorDashboardLayout>
      <div className="flex flex-col gap-6 pb-8 max-w-7xl mx-auto">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
          <h1 className="text-2xl font-semibold text-purple-800">
            {getGreeting()}, {user.fullName?.split(" ")[0] || "Tutor"}!
          </h1>
          <p className="text-purple-700 mt-2">Here's your teaching overview for today.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : data ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Active Students", value: String(data.stats.totalStudents), sub: "Currently enrolled", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
                { title: "Upcoming Sessions", value: String(data.stats.upcomingSessions), sub: "Scheduled ahead", icon: Calendar, color: "text-green-600", bg: "bg-green-100" },
                { title: "Sessions Completed", value: String(data.stats.completedSessions), sub: "Total delivered", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-100" },
                { title: "Total Earnings", value: formatInr(data.stats.totalEarnings), sub: `Unpaid: ${formatInr(data.earningsSummary.unpaidInPaise)}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
                { title: "Courses", value: String(data.stats.coursesCount), sub: "Subjects you teach", icon: BookOpen, color: "text-orange-600", bg: "bg-orange-100" },
                { title: "Average Rating", value: data.stats.averageRating ? `${data.stats.averageRating} / 5` : "—", sub: "From student reviews", icon: Star, color: "text-amber-600", bg: "bg-amber-100" },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <Card key={i} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                          <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                        </div>
                        <div className={`${stat.bg} p-2.5 rounded-lg`}><Icon className={`h-5 w-5 ${stat.color}`} /></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Sessions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Upcoming Sessions</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/tutor-dashboard/enrollments" className="text-xs text-indigo-600">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {data.upcomingSessions.length > 0 ? (
                    <div className="space-y-3">
                      {data.upcomingSessions.map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{s.subject}</p>
                              <p className="text-xs text-muted-foreground">{s.student} · {s.type}</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <p className="text-sm font-medium">
                                {new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              </p>
                              <p className="text-xs text-muted-foreground">{displayTime(s.time, tz)}</p>
                            </div>
                            {s.zoomLink && (
                              <a href={s.zoomLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Button variant="outline" size="sm" className="text-xs"><Video className="h-3 w-3" /></Button>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">No upcoming sessions.</div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {data.recentActivity.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
                          <span className="text-lg">{activityIcons[a.type] || "🔔"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700">{a.message}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {timeAgo(a.time)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">No recent activity.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Failed to load dashboard data.</div>
        )}
      </div>
    </TutorDashboardLayout>
  );
};

export default TutorDashboard;
