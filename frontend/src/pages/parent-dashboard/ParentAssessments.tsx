import { useState, useEffect } from "react";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardList,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  parentAssessmentService,
  AssessmentResult,
  ChildProgress,
  ProgressSubject,
} from "@/services/assessment.service";
import { useAuth } from "@/contexts/AuthContext";

const SUBJECT_COLORS = [
  "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#84CC16",
];

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
};

const ParentAssessments = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Children state
  const [children, setChildren] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Progress data
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Results list
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch children from user profile
  useEffect(() => {
    if (user && (user as any).children) {
      setChildren((user as any).children);
      if ((user as any).children.length > 0) {
        setSelectedChildId((user as any).children[0].id);
      }
    }
  }, [user]);

  // Fetch progress when child changes
  useEffect(() => {
    if (!selectedChildId) return;
    const fetchProgress = async () => {
      setLoadingProgress(true);
      try {
        const data = await parentAssessmentService.getChildProgress(selectedChildId);
        setProgress(data);
      } catch {
        setProgress(null);
      } finally {
        setLoadingProgress(false);
      }
    };
    fetchProgress();
  }, [selectedChildId]);

  // Fetch results when child or page changes
  useEffect(() => {
    if (!selectedChildId) return;
    const fetchResults = async () => {
      setLoadingResults(true);
      try {
        const res = await parentAssessmentService.getChildResults(selectedChildId, { page, limit: 20 });
        setResults(res.data);
        setTotalPages(res.meta.totalPages);
      } catch {
        setResults([]);
      } finally {
        setLoadingResults(false);
      }
    };
    fetchResults();
  }, [selectedChildId, page]);

  // Build chart data: merge all subjects' dataPoints into a single array by date
  const buildChartData = (subjects: ProgressSubject[]) => {
    const dateMap = new Map<string, Record<string, number>>();
    for (const subj of subjects) {
      for (const dp of subj.dataPoints) {
        if (!dateMap.has(dp.date)) dateMap.set(dp.date, {});
        dateMap.get(dp.date)![subj.subjectName] = dp.percentage;
      }
    }
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, ...values }));
  };

  const chartData = progress ? buildChartData(progress.subjects) : [];
  const subjectNames = progress ? progress.subjects.map((s) => s.subjectName) : [];

  return (
    <ParentDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-purple-800">Assessment Results & Progress</h1>
            <p className="text-muted-foreground text-sm mt-1">Track your child's academic progress over time</p>
          </div>
          {children.length > 1 && (
            <Select value={selectedChildId} onValueChange={(v) => { setSelectedChildId(v); setPage(1); }}>
              <SelectTrigger className="w-[200px] mt-4 md:mt-0">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {!selectedChildId ? (
          <p className="text-center py-12 text-gray-500">No children found on your profile.</p>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white shadow-sm rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <ClipboardList className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Assessments</p>
                    <p className="text-xl font-bold">{progress?.totalAssessments ?? 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Overall Average</p>
                    <p className="text-xl font-bold">{progress ? `${progress.overallAverage}%` : "—"}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subjects Tracked</p>
                    <p className="text-xl font-bold">{progress?.subjects.length ?? 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Chart */}
            <Card className="bg-white shadow-sm rounded-xl mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Over Time</h3>
                {loadingProgress ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : chartData.length === 0 ? (
                  <p className="text-center py-12 text-gray-500">No assessment data yet. Results will appear here once tutors upload them.</p>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#fff", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }}
                          formatter={(value: number) => [`${Math.round(value)}%`]}
                        />
                        <Legend />
                        {subjectNames.map((name, i) => (
                          <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subject Trend Cards */}
            {progress && progress.subjects.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {progress.subjects.map((s, i) => (
                  <Card key={s.subjectId} className="bg-white shadow-sm rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{s.subjectName}</p>
                          <p className="text-sm text-gray-500">{s.totalAssessments} assessments</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendIcon trend={s.trend} />
                          <span className={`text-sm font-medium ${
                            s.trend === "improving" ? "text-green-600" :
                            s.trend === "declining" ? "text-red-600" : "text-gray-500"
                          }`}>
                            {s.trend.charAt(0).toUpperCase() + s.trend.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold" style={{ color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}>
                          {Math.round(s.latestPercentage)}%
                        </span>
                        <span className="text-xs text-gray-500">latest</span>
                        <span className="text-sm text-gray-400 ml-auto">avg {Math.round(s.averagePercentage)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Results Table */}
            <Card className="bg-white shadow-sm rounded-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">All Results</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-medium text-gray-700">Title</TableHead>
                        <TableHead className="font-medium text-gray-700">Subject</TableHead>
                        <TableHead className="font-medium text-gray-700">Score</TableHead>
                        <TableHead className="font-medium text-gray-700">Percentage</TableHead>
                        <TableHead className="font-medium text-gray-700">Tutor</TableHead>
                        <TableHead className="font-medium text-gray-700">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingResults ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...
                          </TableCell>
                        </TableRow>
                      ) : results.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">No results yet</TableCell>
                        </TableRow>
                      ) : (
                        results.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.title}</TableCell>
                            <TableCell>{r.subject}</TableCell>
                            <TableCell>{r.score}/{r.maxScore}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  r.percentage >= 80 ? "bg-green-100 text-green-800" :
                                  r.percentage >= 50 ? "bg-amber-100 text-amber-800" :
                                  "bg-red-100 text-red-800"
                                }
                                variant="outline"
                              >
                                {Math.round(r.percentage)}%
                              </Badge>
                            </TableCell>
                            <TableCell>{r.tutorName}</TableCell>
                            <TableCell>{new Date(r.assessedAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ParentDashboardLayout>
  );
};

export default ParentAssessments;
