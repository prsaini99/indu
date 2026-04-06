import { useState, useEffect } from "react";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, Users, MessageSquare } from "lucide-react";
import { tutorReviewService, TutorReviewsResponse } from "@/services/review.service";
import { useToast } from "@/hooks/use-toast";

const Feedback = () => {
  const { toast } = useToast();
  const [reviewData, setReviewData] = useState<TutorReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await tutorReviewService.listOwnReviews({ page, limit: 10 });
      setReviewData(data);
    } catch {
      toast({ title: "Error", description: "Failed to load reviews", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [page]);

  const avgRating = reviewData?.aggregateRating ?? 0;
  const totalReviews = reviewData?.totalReviews ?? 0;
  const distribution = reviewData?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const reviews = reviewData?.reviews ?? [];
  const totalPages = reviewData?.meta?.totalPages ?? 1;

  return (
    <TutorDashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-purple-800">Feedback & Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">
            See what parents are saying about your teaching.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Rating summary */}
          <Card className="md:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-bold text-purple-600">{avgRating || "—"}</div>
              <div className="flex items-center justify-center gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i <= Math.round(avgRating)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">{totalReviews} reviews</p>
            </CardContent>
          </Card>

          {/* Rating distribution */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Rating Distribution</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = distribution[stars] || 0;
                  const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-12">{stars} star</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-yellow-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Rating</p>
                <p className="text-xl font-bold">{avgRating || "—"}/5</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Reviews</p>
                <p className="text-xl font-bold">{totalReviews}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">With Comments</p>
                <p className="text-xl font-bold">{reviews.filter((r) => r.comment).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews list */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">All Reviews</h3>
            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading...</p>
            ) : reviews.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.parentName}</span>
                          {!review.isVisible && (
                            <Badge variant="outline" className="bg-red-50 text-red-600 text-xs">Hidden</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {review.subject} — {review.classDate ? new Date(review.classDate).toLocaleDateString() : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TutorDashboardLayout>
  );
};

export default Feedback;
