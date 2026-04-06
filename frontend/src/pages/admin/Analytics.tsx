import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, BookOpen, DollarSign, Star, Loader2,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import { analyticsService, type DashboardStats } from "@/services/analytics.service";

const PIE_COLORS = ["#6366F1", "#3B82F6", "#10B981", "#F59E0B"];
const BAR_COLORS = ["#8B5CF6", "#6366F1", "#3B82F6", "#10B981", "#F59E0B"];

const Analytics = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatAed = (fils: number) => `AED ${(fils / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
  const formatInr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center py-20 text-muted-foreground">Failed to load analytics.</div>
    );
  }

  // Prepare chart data
  const monthlyData = stats.monthlyRevenue.map((m) => ({
    month: new Date(m.month + "-01").toLocaleDateString("en-US", { month: "short" }),
    revenue: m.amount / 100,
  }));

  const userBreakdown = [
    { name: "Parents", value: stats.users.parents },
    { name: "Tutors", value: stats.users.tutors },
    { name: "Consultants", value: stats.users.consultants },
    { name: "Admins", value: stats.users.admins },
  ].filter((u) => u.value > 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform performance metrics and insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatAed(stats.revenue.totalInFils)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.revenue.totalPayments} payments</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">{stats.users.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.users.parents} parents · {stats.users.tutors} tutors</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions Completed</p>
                <p className="text-2xl font-bold mt-1">{stats.sessions.totalCompleted.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.sessions.thisMonth} this month</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold mt-1">{stats.reviews.averageRating || "—"} <span className="text-sm font-normal text-muted-foreground">/ 5</span></p>
                <p className="text-xs text-muted-foreground mt-1">{stats.reviews.total} reviews</p>
              </div>
              <Star className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue (AED)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`AED ${v.toFixed(2)}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">No revenue data yet.</div>
            )}
          </CardContent>
        </Card>

        {/* User Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {userBreakdown.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={userBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                      {userBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {userBreakdown.map((u, i) => (
                    <div key={u.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-sm text-gray-700">{u.name}: <strong>{u.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">No user data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Subjects Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Subjects by Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topSubjects.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.topSubjects} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="enrollments" fill="#6366F1" radius={[0, 4, 4, 0]}>
                    {stats.topSubjects.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">No enrollment data yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Top Tutors Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Performing Tutors</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topTutors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topTutors.map((tutor, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-gray-800">{tutor.name}</TableCell>
                      <TableCell>{tutor.sessions}</TableCell>
                      <TableCell>{formatInr(tutor.earned)}</TableCell>
                      <TableCell>
                        <Badge className={tutor.rating >= 4 ? "bg-green-100 text-green-700" : tutor.rating >= 3 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}>
                          {tutor.rating ? `${tutor.rating} ★` : "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">No tutor data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
