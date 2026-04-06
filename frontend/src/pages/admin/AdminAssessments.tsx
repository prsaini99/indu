import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminAssessmentService, AssessmentResult } from "@/services/assessment.service";
import { referenceService, type Subject } from "@/services/user.service";

const AdminAssessments = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Load subjects for dropdown
  useEffect(() => {
    referenceService.getSubjects().then(setSubjects).catch(() => {});
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAssessmentService.list({
        page,
        limit: 20,
        subjectId: subjectFilter || undefined,
      });
      setResults(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      toast({ title: "Error", description: "Failed to load assessment results", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, subjectFilter, toast]);

  useEffect(() => { fetchResults(); }, [fetchResults]);
  useEffect(() => { setPage(1); }, [subjectFilter]);

  // Client-side search filter for student/tutor names
  const filtered = searchQuery.trim()
    ? results.filter((r) => {
        const q = searchQuery.toLowerCase();
        return (
          (r.studentName || "").toLowerCase().includes(q) ||
          (r.tutorName || "").toLowerCase().includes(q) ||
          (r.title || "").toLowerCase().includes(q)
        );
      })
    : results;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Assessment Results</h1>
        <p className="text-muted-foreground text-sm mt-1">View all assessment results across the platform</p>
      </div>

      <Card>
        <div className="p-6 pb-0 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">All Results ({total})</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student, tutor, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Select value={subjectFilter} onValueChange={(v) => setSubjectFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No results match your search." : "No assessment results found."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Tutor</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-gray-800">{r.title}</TableCell>
                        <TableCell>{r.studentName}</TableCell>
                        <TableCell>{r.tutorName}</TableCell>
                        <TableCell>{r.subject}</TableCell>
                        <TableCell>{r.score}/{r.maxScore}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              r.percentage >= 80 ? "bg-green-100 text-green-700" :
                              r.percentage >= 50 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }
                          >
                            {Math.round(r.percentage)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(r.assessedAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} total)</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAssessments;
