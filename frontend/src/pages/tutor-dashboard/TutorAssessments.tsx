import { useState, useEffect } from "react";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList,
  Plus,
  FileText,
  TrendingUp,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  tutorAssessmentService,
  AssessmentResult,
  CreateAssessmentPayload,
  TutorStudent,
} from "@/services/assessment.service";

const TutorAssessments = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Students for dropdown
  const [myStudents, setMyStudents] = useState<TutorStudent[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    subjectId: "",
    title: "",
    score: "",
    maxScore: "100",
    remarks: "",
    assessedAt: new Date().toISOString().split("T")[0],
  });

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await tutorAssessmentService.list({ page, limit: 20 });
      setResults(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      toast({ title: "Error", description: "Failed to load assessment results", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResults(); }, [page]);
  useEffect(() => {
    tutorAssessmentService.getMyStudents().then(setMyStudents).catch(() => { });
  }, []);

  // Derive unique subjects + client-side filtering
  const allSubjects = [...new Set(results.map((r) => r.subject))].sort();
  const filtered = results.filter((r) => {
    if (subjectFilter && r.subject !== subjectFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (r.title || "").toLowerCase().includes(q) || (r.studentName || "").toLowerCase().includes(q) || (r.subject || "").toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreate = async () => {
    if (!form.studentId || !form.subjectId || !form.title || !form.score) {
      toast({ title: "Validation", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await tutorAssessmentService.create({
        ...form,
        score: Number(form.score),
        maxScore: Number(form.maxScore) || 100,
      });
      toast({ title: "Success", description: "Assessment result uploaded" });
      setCreateOpen(false);
      setForm({ studentId: "", subjectId: "", title: "", score: "", maxScore: "100", remarks: "", assessedAt: new Date().toISOString().split("T")[0] });
      fetchResults();
    } catch {
      toast({ title: "Error", description: "Failed to upload result", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tutorAssessmentService.delete(id);
      toast({ title: "Deleted", description: "Assessment result removed" });
      fetchResults();
    } catch {
      toast({ title: "Error", description: "Failed to delete result", variant: "destructive" });
    }
  };

  return (
    <TutorDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-purple-800">Assessment Results</h1>
            <p className="text-muted-foreground text-sm mt-1">Upload and manage assessment results for your students</p>
          </div>
          <Button className="mt-4 md:mt-0" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Upload Result
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-sm rounded-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Results</p>
                <p className="text-xl font-bold">{total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm rounded-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Score</p>
                <p className="text-xl font-bold">
                  {results.length > 0
                    ? `${Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)}%`
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm rounded-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Subjects Covered</p>
                <p className="text-xl font-bold">
                  {new Set(results.map((r) => r.subject)).size}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card className="bg-white shadow-sm rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                All Results ({filtered.length})
              </h3>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search student, title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-56"
                  />
                </div>
                <Select value={subjectFilter} onValueChange={(v) => setSubjectFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {allSubjects.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-700">Title</TableHead>
                    <TableHead className="font-medium text-gray-700">Student</TableHead>
                    <TableHead className="font-medium text-gray-700">Subject</TableHead>
                    <TableHead className="font-medium text-gray-700">Score</TableHead>
                    <TableHead className="font-medium text-gray-700">Percentage</TableHead>
                    <TableHead className="font-medium text-gray-700">Date</TableHead>
                    <TableHead className="font-medium text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {searchQuery || subjectFilter ? "No results match your filters." : "No assessment results yet. Click \"Upload Result\" to add one."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.title}</TableCell>
                        <TableCell>{r.studentName}</TableCell>
                        <TableCell>{r.subject}</TableCell>
                        <TableCell>{r.score}/{r.maxScore}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              r.percentage >= 80
                                ? "bg-green-100 text-green-800"
                                : r.percentage >= 50
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                            }
                            variant="outline"
                          >
                            {Math.round(r.percentage)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(r.assessedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(r.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
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

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Assessment Result</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Student *</Label>
                <Select
                  value={form.studentId}
                  onValueChange={(v) => setForm({ ...form, studentId: v, subjectId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {myStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject *</Label>
                <Select
                  value={form.subjectId}
                  onValueChange={(v) => setForm({ ...form, subjectId: v })}
                  disabled={!form.studentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={form.studentId ? "Select subject" : "Select student first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(myStudents.find((s) => s.id === form.studentId)?.subjects || []).map((subj) => (
                      <SelectItem key={subj.id} value={subj.id}>
                        {subj.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  placeholder="e.g. Unit 3 Math Test"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Score *</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 85"
                    value={form.score}
                    onChange={(e) => setForm({ ...form, score: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Max Score</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="100"
                    value={form.maxScore}
                    onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Assessment Date</Label>
                <Input
                  type="date"
                  value={form.assessedAt}
                  onChange={(e) => setForm({ ...form, assessedAt: e.target.value })}
                />
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea
                  placeholder="Optional feedback or notes"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Upload Result
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TutorDashboardLayout>
  );
};

export default TutorAssessments;
