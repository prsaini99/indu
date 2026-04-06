
import {
  Clock,
  Calendar,
  MapPin,
  User,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Timer,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { DemoRequest, DemoRequestStatus } from "@/types/platform";

const statusConfig: Record<
  DemoRequestStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: <Clock className="h-3 w-3" />,
  },
  "tutor-suggested": {
    label: "Tutor Suggested",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <User className="h-3 w-3" />,
  },
  "demo-scheduled": {
    label: "Demo Scheduled",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: <Calendar className="h-3 w-3" />,
  },
  "demo-completed": {
    label: "Demo Completed",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  "booking-confirmed": {
    label: "Booking Confirmed",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  declined: {
    label: "Declined",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
  "reassign-needed": {
    label: "Reassign Needed",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: <RotateCcw className="h-3 w-3" />,
  },
};

const urgencyConfig = {
  high: { label: "Urgent", color: "bg-red-500 text-white" },
  medium: { label: "Medium", color: "bg-yellow-500 text-white" },
  low: { label: "Low", color: "bg-gray-400 text-white" },
};

interface DemoRequestCardProps {
  request: DemoRequest;
  perspective?: "parent" | "consultant" | "tutor";
  onScheduleDemo?: (id: string) => void;
  onSuggestTutor?: (id: string) => void;
  onConfirmBooking?: (id: string) => void;
  onDecline?: (id: string) => void;
  onReassign?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

const DemoRequestCard = ({
  request,
  perspective = "parent",
  onScheduleDemo,
  onSuggestTutor,
  onConfirmBooking,
  onDecline,
  onReassign,
  onViewDetails,
}: DemoRequestCardProps) => {
  const status = statusConfig[request.status];
  const urgency = urgencyConfig[request.urgency];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header: avatar + name + status + urgency */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {perspective !== "parent" && (
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.parentAvatar} alt={request.parentName} />
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                  {request.parentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              {perspective !== "parent" && (
                <p className="font-semibold text-sm">{request.parentName}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {request.childName} · {request.childGrade}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge className={`text-xs ${urgency.color}`}>{urgency.label}</Badge>
            <Badge variant="outline" className={`text-xs ${status.color}`}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{request.subject}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{request.preferredFormat}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{request.preferredSchedule}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{request.budget}</span>
          </div>
          {request.location && (
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{request.location}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {request.notes && (
          <p className="text-xs text-muted-foreground mt-2 bg-gray-50 rounded p-2 line-clamp-2">
            {request.notes}
          </p>
        )}

        {/* Assigned tutor info */}
        {request.assignedTutorName && (
          <div className="flex items-center gap-2 mt-2 text-sm">
            <User className="h-3.5 w-3.5 text-purple-500" />
            <span>
              Tutor: <span className="font-medium">{request.assignedTutorName}</span>
            </span>
            {request.demoDate && (
              <>
                <span className="text-muted-foreground">·</span>
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>Demo: {formatDateTime(request.demoDate)}</span>
              </>
            )}
          </div>
        )}

        {/* Demo outcome */}
        {request.demoOutcome && request.demoOutcome !== "pending" && (
          <div
            className={`flex items-center gap-1.5 mt-2 text-sm ${
              request.demoOutcome === "positive" ? "text-green-600" : "text-red-600"
            }`}
          >
            {request.demoOutcome === "positive" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            Demo outcome: {request.demoOutcome === "positive" ? "Positive" : "Negative"}
            {request.parentRating && ` · Rating: ${request.parentRating}/5`}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2">
          Requested: {formatDate(request.createdAt)}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onViewDetails(request.id)}
            >
              View Details
            </Button>
          )}

          {/* Consultant actions */}
          {perspective === "consultant" && request.status === "pending" && onSuggestTutor && (
            <Button
              size="sm"
              className="text-xs bg-teal-600 hover:bg-teal-700"
              onClick={() => onSuggestTutor(request.id)}
            >
              Suggest Tutor
            </Button>
          )}
          {perspective === "consultant" &&
            request.status === "tutor-suggested" &&
            onScheduleDemo && (
              <Button
                size="sm"
                className="text-xs bg-indigo-600 hover:bg-indigo-700"
                onClick={() => onScheduleDemo(request.id)}
              >
                Schedule Demo
              </Button>
            )}
          {perspective === "consultant" &&
            request.status === "reassign-needed" &&
            onReassign && (
              <Button
                size="sm"
                className="text-xs bg-orange-600 hover:bg-orange-700"
                onClick={() => onReassign(request.id)}
              >
                Assign New Tutor
              </Button>
            )}

          {/* Parent actions */}
          {perspective === "parent" &&
            request.status === "demo-completed" &&
            request.demoOutcome === "positive" &&
            onConfirmBooking && (
              <Button
                size="sm"
                className="text-xs bg-green-600 hover:bg-green-700"
                onClick={() => onConfirmBooking(request.id)}
              >
                Confirm Booking
              </Button>
            )}
          {perspective === "parent" &&
            request.status === "demo-completed" &&
            request.demoOutcome === "negative" &&
            onReassign && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-orange-300 text-orange-600"
                onClick={() => onReassign(request.id)}
              >
                Request New Tutor
              </Button>
            )}
          {perspective === "parent" &&
            ["pending", "tutor-suggested"].includes(request.status) &&
            onDecline && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-red-500 hover:text-red-700"
                onClick={() => onDecline(request.id)}
              >
                Cancel Request
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoRequestCard;
