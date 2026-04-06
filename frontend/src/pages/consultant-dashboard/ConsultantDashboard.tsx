import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, CheckCircle2, ClipboardList, Loader2, Clock, Video, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ConsultantDashboardLayout from "@/components/ConsultantDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboardService, type ConsultantDashboardData } from "@/services/dashboard.service";
import { displayTime } from "@/lib/utils";

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-700",
};

const ConsultantDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ConsultantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const tz = user?.timezone || "Asia/Dubai";

  useEffect(() => {
    document.title = "Consultant Dashboard | Indu AE";
    dashboardService.getConsultantDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ConsultantDashboardLayout>
      <div className="flex flex-col gap-6 pb-8 max-w-7xl mx-auto">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6">
          <h1 className="text-2xl font-semibold text-teal-800">
            {getGreeting()}, {user.fullName?.split(" ")[0] || "Consultant"}!
          </h1>
          <p className="text-teal-700 mt-2">Here's your mediation overview. Match parents with the right tutors.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : data ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Pending Requests", value: String(data.pendingDemoRequests), sub: `${data.totalDemoRequests} total requests`, icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-100" },
                { title: "Active Demos", value: String(data.activeDemoBookings), sub: "Confirmed & scheduled", icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
                { title: "Completed Demos", value: String(data.completedDemos), sub: "Successfully delivered", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
                { title: "Notifications", value: String(data.notifications.unreadCount), sub: "Unread", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
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
              {/* Recent Demo Requests */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Recent Demo Requests</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/consultant-dashboard/tutor-requests" className="text-xs text-teal-600">View All <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {data.recentDemoRequests.length > 0 ? (
                    <div className="space-y-3">
                      {data.recentDemoRequests.map((r, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{r.parentName}</p>
                            <p className="text-xs text-muted-foreground">{r.childName} · {r.subjects}</p>
                          </div>
                          <Badge className={statusColors[r.status] || "bg-gray-100"} variant="secondary">{r.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">No demo requests yet.</div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Demos */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Upcoming Demos</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/consultant-dashboard/allocations" className="text-xs text-teal-600">View All <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {data.upcomingDemos.length > 0 ? (
                    <div className="space-y-3">
                      {data.upcomingDemos.map((d, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-teal-100 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-teal-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{d.subject}</p>
                              <p className="text-xs text-muted-foreground">{d.student} · Tutor: {d.tutor}</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <p className="text-sm font-medium">
                                {new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              </p>
                              <p className="text-xs text-muted-foreground">{displayTime(d.time, tz)}</p>
                            </div>
                            {d.meetingLink && (
                              <a href={d.meetingLink} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="text-xs"><Video className="h-3 w-3" /></Button>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">No upcoming demos scheduled.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Failed to load dashboard data.</div>
        )}
      </div>
    </ConsultantDashboardLayout>
  );
};

export default ConsultantDashboard;
