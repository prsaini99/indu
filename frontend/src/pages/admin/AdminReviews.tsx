import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Eye, EyeOff, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminReviewService, Review } from "@/services/review.service";

const AdminReviews = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [visibilityFilter, setVisibilityFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminReviewService.list({
        page,
        limit: 20,
        isVisible: visibilityFilter !== "ALL" ? visibilityFilter : undefined,
      });
      setReviews(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      toast({ title: "Error", description: "Failed to load reviews", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, visibilityFilter, toast]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleToggleVisibility = async (id: string, currentlyVisible: boolean) => {
    try {
      await adminReviewService.updateVisibility(id, !currentlyVisible);
      toast({ title: "Updated", description: `Review ${currentlyVisible ? "hidden" : "shown"}` });
      fetchReviews();
    } catch {
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Review Moderation</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and moderate tutor reviews from parents</p>
      </div>

      <Card>
        <div className="p-6 pb-0 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">All Reviews ({total})</h2>
          <Select value={visibilityFilter} onValueChange={(val) => { setVisibilityFilter(val); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="true">Visible</SelectItem>
              <SelectItem value="false">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No reviews found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tutor</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-gray-800">{r.tutorName}</TableCell>
                        <TableCell>{r.parentName}</TableCell>
                        <TableCell>{r.subject}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${i <= r.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{r.comment || "—"}</TableCell>
                        <TableCell>
                          <Badge className={r.isVisible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {r.isVisible ? "Visible" : "Hidden"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleVisibility(r.id, r.isVisible!)}
                            title={r.isVisible ? "Hide review" : "Show review"}
                          >
                            {r.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </TableCell>
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

export default AdminReviews;
