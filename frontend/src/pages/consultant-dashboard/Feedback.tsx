
import ConsultantDashboardLayout from "@/components/ConsultantDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, MessageSquare } from "lucide-react";
import { mockReviews } from "@/data/mockPlatformData";

const ConsultantFeedback = () => {
  const consultantReviews = mockReviews.filter(
    (r) => r.toRole === "consultant"
  );

  const avgRating = consultantReviews.length > 0
    ? (consultantReviews.reduce((sum, r) => sum + r.rating, 0) / consultantReviews.length).toFixed(1)
    : "0";

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: consultantReviews.filter((r) => r.rating === stars).length,
    percentage: consultantReviews.length > 0
      ? Math.round((consultantReviews.filter((r) => r.rating === stars).length / consultantReviews.length) * 100)
      : 0,
  }));

  return (
    <ConsultantDashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-teal-800">Feedback & Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">
            See what parents are saying about your consultant services.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-bold text-teal-600">{avgRating}</div>
              <div className="flex items-center justify-center gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i <= Math.round(Number(avgRating))
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Based on {consultantReviews.length} review{consultantReviews.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Rating Distribution</p>
              <div className="space-y-2">
                {ratingDistribution.map((item) => (
                  <div key={item.stars} className="flex items-center gap-3">
                    <span className="text-sm w-6 text-right">{item.stars}</span>
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-yellow-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{consultantReviews.length}</p>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">34</p>
                <p className="text-xs text-muted-foreground">Active Allocations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {consultantReviews.filter((r) => r.rating >= 4).length}
                </p>
                <p className="text-xs text-muted-foreground">Positive Reviews</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {consultantReviews.length > 0 ? (
              <div className="space-y-4">
                {consultantReviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.fromAvatar} alt={review.fromName} />
                          <AvatarFallback className="bg-teal-100 text-teal-700 text-sm">
                            {review.fromName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{review.fromName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs capitalize">{review.fromRole}</Badge>
                            {review.subject && (
                              <span className="text-xs text-muted-foreground">· {review.subject}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i <= review.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                      </div>
                    </div>
                    <p className="text-sm mt-3 text-muted-foreground leading-relaxed">
                      "{review.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No reviews yet. They'll appear here as parents submit feedback.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ConsultantDashboardLayout>
  );
};

export default ConsultantFeedback;
