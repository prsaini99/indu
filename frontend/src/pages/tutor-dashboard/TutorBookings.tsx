import { useState, useEffect, useMemo } from "react";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  Video,
  User,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayTime } from "@/lib/utils";
import { tutorDemoBookingService, type DemoBooking } from "@/services/demoBooking.service";

const demoStatusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  NO_SHOW: "bg-red-100 text-red-700",
};

const TutorBookings = () => {
  const { toast } = useToast();
  const [demoBookings, setDemoBookings] = useState<DemoBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tutorDemoBookingService
      .list({ limit: 50 })
      .then((res) => setDemoBookings(res.data))
      .catch(() => toast({ title: "Error", description: "Failed to load demo bookings.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total: demoBookings.length,
    upcoming: demoBookings.filter((b) => ["PENDING", "CONFIRMED"].includes(b.status)).length,
    completed: demoBookings.filter((b) => b.status === "COMPLETED").length,
  }), [demoBookings]);

  return (
    <TutorDashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-purple-800">Demo Bookings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View demo bookings assigned to you by consultants.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center">
            <GraduationCap className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Demos</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.upcoming}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent></Card>
        </div>

        {/* Demo Bookings List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : demoBookings.length > 0 ? (
          <div className="space-y-3">
            {demoBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-sm">
                      {booking.demoRequest
                        ? `${booking.demoRequest.childFirstName} ${booking.demoRequest.childLastName}`
                        : booking.student
                        ? `${booking.student.firstName} ${booking.student.lastName}`
                        : "Demo Class"}
                    </h3>
                    <Badge className={`text-[10px] ${demoStatusColors[booking.status]}`} variant="secondary">
                      {booking.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700">FREE DEMO</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {booking.subject.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Consultant: {booking.consultant.firstName} {booking.consultant.lastName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(booking.scheduledDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {displayTime(booking.scheduledStart, booking.tutor?.user?.timezone || "Asia/Kolkata")} - {displayTime(booking.scheduledEnd, booking.tutor?.user?.timezone || "Asia/Kolkata")}
                    </span>
                    {booking.meetingLink && (
                      <a
                        href={booking.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Video className="h-3 w-3" /> Join Meeting
                      </a>
                    )}
                  </div>
                  {booking.parentNotes && (
                    <p className="text-xs text-muted-foreground mt-2 bg-gray-50 rounded p-2">
                      Parent notes: {booking.parentNotes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No demo bookings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Demo bookings assigned to you by consultants will appear here.
            </p>
          </div>
        )}
      </div>
    </TutorDashboardLayout>
  );
};

export default TutorBookings;
