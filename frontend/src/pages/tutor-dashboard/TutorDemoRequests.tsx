
import { useState, useMemo } from "react";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  MapPin,
  User,
  IndianRupee,
  MessageSquare,
} from "lucide-react";
import { mockDemoRequests, mockAllocations } from "@/data/mockPlatformData";
import { useToast } from "@/hooks/use-toast";
import type { DemoRequestStatus } from "@/types/platform";

const statusConfig: Record<DemoRequestStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  "tutor-suggested": { label: "Awaiting Confirmation", color: "bg-blue-100 text-blue-700" },
  "demo-scheduled": { label: "Demo Scheduled", color: "bg-indigo-100 text-indigo-700" },
  "demo-completed": { label: "Demo Completed", color: "bg-purple-100 text-purple-700" },
  "booking-confirmed": { label: "Booking Confirmed", color: "bg-green-100 text-green-700" },
  declined: { label: "Declined", color: "bg-red-100 text-red-700" },
  "reassign-needed": { label: "Reassigned", color: "bg-orange-100 text-orange-700" },
};

const TutorDemoRequests = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("assigned");

  // Show requests assigned to the logged-in tutor
  // In production, this would filter by the actual user's tutor ID.
  // For demo, we show all requests that have an assigned tutor (simulating tutor's view).
  const myRequests = mockDemoRequests.filter(
    (r) => r.assignedTutorId !== undefined
  );

  const filteredRequests = useMemo(() => {
    if (activeTab === "assigned") return myRequests;
    if (activeTab === "upcoming") return myRequests.filter((r) => r.status === "demo-scheduled");
    if (activeTab === "completed") return myRequests.filter((r) => ["demo-completed", "booking-confirmed"].includes(r.status));
    if (activeTab === "reassigned") return myRequests.filter((r) => r.status === "reassign-needed");
    return myRequests;
  }, [activeTab, myRequests]);

  const upcomingCount = myRequests.filter((r) => r.status === "demo-scheduled").length;
  const completedCount = myRequests.filter((r) => ["demo-completed", "booking-confirmed"].includes(r.status)).length;
  const reassignedCount = myRequests.filter((r) => r.status === "reassign-needed").length;

  const handleAccept = (id: string) => {
    toast({ title: "Demo Accepted", description: "You've confirmed the demo class. Check your schedule." });
  };

  const handleDecline = (id: string) => {
    toast({ title: "Demo Declined", description: "The consultant will be notified to find another tutor." });
  };

  const handleMessageParent = (id: string) => {
    toast({ title: "Message", description: "Opening conversation with parent..." });
  };

  return (
    <TutorDashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-purple-800">Demo Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View and manage demo class requests assigned to you by consultants.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{myRequests.length}</p>
              <p className="text-xs text-muted-foreground">Total Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground">Upcoming Demos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">
                {myRequests.filter((r) => r.status === "reassign-needed").length}
              </p>
              <p className="text-xs text-muted-foreground">Reassigned</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="assigned">All Assigned ({myRequests.length})</TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming
              {upcomingCount > 0 && <Badge className="ml-1.5 text-xs bg-blue-500">{upcomingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
            {reassignedCount > 0 && (
              <TabsTrigger value="reassigned">
                Reassigned
                <Badge className="ml-1.5 text-xs bg-orange-500">{reassignedCount}</Badge>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredRequests.length > 0 ? (
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  const status = statusConfig[request.status];
                  return (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11">
                              <AvatarImage src={request.parentAvatar} alt={request.parentName} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                                {request.parentName.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">{request.parentName}</p>
                              <p className="text-sm text-muted-foreground">
                                {request.childName} · {request.childGrade}
                              </p>
                            </div>
                          </div>
                          <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{request.subject}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{request.preferredSchedule}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{request.budget}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{request.preferredFormat}</span>
                          </div>
                          {request.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{request.location}</span>
                            </div>
                          )}
                          {request.demoDate && (
                            <div className="flex items-center gap-1.5 text-indigo-600">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="font-medium">
                                {new Date(request.demoDate).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {request.notes && (
                          <p className="text-xs text-muted-foreground mt-2 bg-gray-50 rounded p-2">
                            {request.notes}
                          </p>
                        )}

                        {request.demoOutcome && request.demoOutcome !== "pending" && (
                          <div className={`flex items-center gap-1.5 mt-2 text-sm ${
                            request.demoOutcome === "positive" ? "text-green-600" : "text-red-600"
                          }`}>
                            {request.demoOutcome === "positive" ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5" />
                            )}
                            Demo outcome: {request.demoOutcome === "positive" ? "Positive" : "Negative"}
                            {request.parentRating && ` · Parent rating: ${request.parentRating}/5`}
                          </div>
                        )}

                        <div className="flex gap-2 mt-3">
                          {request.status === "demo-scheduled" && (
                            <>
                              <Button size="sm" className="text-xs bg-purple-600 hover:bg-purple-700" onClick={() => handleAccept(request.id)}>
                                Confirm Demo
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs text-red-500" onClick={() => handleDecline(request.id)}>
                                Can't Attend
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => handleMessageParent(request.id)}>
                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
                            Message Parent
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold">No demo requests</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Demo requests from consultants will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TutorDashboardLayout>
  );
};

export default TutorDemoRequests;
