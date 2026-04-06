import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, DollarSign, Activity, AlertCircle, Loader2, Clock } from "lucide-react";
import { analyticsService, type DashboardStats } from "@/services/analytics.service";

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatAed = (fils: number) => `AED ${(fils / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const statCards = stats ? [
    { title: "Total Users", value: stats.users.total.toLocaleString(), sub: `${stats.users.parents} parents · ${stats.users.tutors} tutors`, icon: Users, color: "text-blue-600" },
    { title: "Active Enrollments", value: stats.enrollments.active.toLocaleString(), sub: `${stats.enrollments.total} total · ${stats.enrollments.paused} paused`, icon: BookOpen, color: "text-green-600" },
    { title: "Total Revenue", value: formatAed(stats.revenue.totalInFils), sub: `This month: ${formatAed(stats.revenue.thisMonthInFils)}`, icon: DollarSign, color: "text-purple-600" },
    { title: "Sessions Completed", value: stats.sessions.totalCompleted.toLocaleString(), sub: `${stats.sessions.thisMonth} this month · ${stats.sessions.noShows} no-shows`, icon: Activity, color: "text-orange-600" },
    { title: "Tutor Earnings Unpaid", value: `₹${(stats.earnings.unpaidInPaise / 100).toLocaleString("en-IN")}`, sub: `₹${(stats.earnings.paidInPaise / 100).toLocaleString("en-IN")} already paid`, icon: AlertCircle, color: "text-amber-600" },
    { title: "Active Batches", value: stats.batches.active.toLocaleString(), sub: `${stats.batches.open} open · ${stats.batches.total} total`, icon: Users, color: "text-indigo-600" },
  ] : [];

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const activityIcons: Record<string, string> = {
    enrollment: "📚",
    payment: "💳",
    review: "⭐",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's what's happening with your platform.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Manage Users", color: "bg-blue-500", href: "/admin/users" },
                    { label: "View Analytics", color: "bg-purple-500", href: "/admin/analytics" },
                    { label: "Enrollments", color: "bg-green-500", href: "/admin/enrollments" },
                    { label: "Batch Classes", color: "bg-indigo-500", href: "/admin/batches" },
                    { label: "Payments", color: "bg-orange-500", href: "/admin/payments" },
                    { label: "Earnings", color: "bg-emerald-500", href: "/admin/earnings" },
                  ].map((action, i) => (
                    <Link
                      key={i}
                      to={action.href}
                      className={`${action.color} text-white p-3 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium text-center block`}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentActivity.map((a, i) => (
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
      )}
    </div>
  );
};

export default AdminDashboard;
