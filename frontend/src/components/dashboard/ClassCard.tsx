
import { Link } from "react-router-dom";
import { Calendar, Clock, ExternalLink, Video, Upload, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ClassCardProps {
  id: string;
  title: string;
  tutor: string;
  image: string;
  nextSession: string;
  progress: string;
  category: string;
  status: "active" | "completed";
  completionDate?: string;
  classType?: "online" | "offline";
  format?: "live" | "recorded" | "inbound" | "outbound";
  classSize?: "group" | "individual";
  duration?: "recurring" | "fixed";
  studentsCount?: number;
  paymentType?: "fixed" | "recurring";
}

const ClassCard: React.FC<ClassCardProps> = ({
  id,
  title,
  tutor,
  image,
  nextSession,
  progress,
  category,
  status,
  completionDate,
  classType = "online",
  format = "live",
  classSize = "group",
  duration = "fixed",
  studentsCount = 0,
  paymentType = "fixed"
}) => {
  const isCompleted = status === "completed";
  
  const getClassTypeLabel = () => {
    if (classType === "online") {
      return format === "live" ? "Online Live" : "Online Recorded";
    } else {
      return format === "inbound" ? "Offline Inbound" : "Offline Outbound";
    }
  };
  
  const getClassSizeLabel = () => {
    return classSize === "group" ? "Group" : "1-on-1";
  };
  
  const getDurationLabel = () => {
    return duration === "recurring" ? "Recurring" : "Fixed Duration";
  };

  const getPaymentTypeLabel = () => {
    return paymentType === "recurring" ? "Subscription" : "One-time Payment";
  };
  
  const getClassIcon = () => {
    if (classType === "online") {
      return format === "live" ? 
        <Video className="h-4 w-4 mr-2" /> : 
        <Upload className="h-4 w-4 mr-2" />;
    } else {
      return <MapPin className="h-4 w-4 mr-2" />;
    }
  };
  
  // Get action button label based on class type
  const getActionLabel = () => {
    if (isCompleted) return "View";
    
    if (classType === "online") {
      return format === "live" ? "Start Live" : "Upload Video";
    } else {
      return format === "inbound" ? "Travel to Student" : "Start Session";
    }
  };

  // Get action button color based on class type
  const getActionButtonClass = () => {
    if (isCompleted) return "";
    
    if (classType === "online") {
      return format === "live" 
        ? "bg-blue-600 hover:bg-blue-700 text-white" 
        : "bg-green-600 hover:bg-green-700 text-white";
    } else {
      return format === "inbound" 
        ? "bg-orange-600 hover:bg-orange-700 text-white" 
        : "bg-purple-600 hover:bg-purple-700 text-white";
    }
  };

  // Get payment type badge color
  const getPaymentTypeBadgeClass = () => {
    return paymentType === "fixed" 
      ? "bg-blue-100 text-blue-800" 
      : "bg-purple-100 text-purple-800";
  };
  
  return (
    <Card key={id} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="aspect-video w-full">
        <img 
          src={image} 
          alt={title} 
          className="h-full w-full object-cover"
        />
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge className={`${
            classType === "online" 
              ? format === "live" ? "bg-blue-500" : "bg-green-500" 
              : format === "inbound" ? "bg-orange-500" : "bg-purple-500"
          }`}>
            {getClassTypeLabel()}
          </Badge>
        </div>
        <CardDescription>
          <div className="flex items-center justify-between">
            <span>{tutor}</span>
            <div className="flex space-x-1">
              {(classType !== "offline" || format !== "inbound") && (
                <Badge variant="outline">{getClassSizeLabel()}</Badge>
              )}
              <Badge variant="outline">{getDurationLabel()}</Badge>
              {paymentType && (
                <Badge variant="outline" className={getPaymentTypeBadgeClass()}>
                  {paymentType === "fixed" ? "One-time" : "Subscription"}
                </Badge>
              )}
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center">
            {getClassIcon()}
            <span>{isCompleted ? `Completed: ${completionDate}` : `Next: ${nextSession}`}</span>
          </div>
          <div className="flex items-center mt-1">
            <Clock className="h-4 w-4 mr-2" />
            <span>{progress}</span>
          </div>
          <div className="flex items-center mt-1">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{category}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            {studentsCount} {studentsCount === 1 ? 'student' : 'students'}
          </Badge>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" asChild>
              <Link to={`/tutor-dashboard/classes/${id}`}>
                Manage
              </Link>
            </Button>
            <Button 
              size="sm" 
              variant={isCompleted ? "outline" : "default"} 
              className={getActionButtonClass()}
              asChild
            >
              <Link to={`/tutor-dashboard/classes/${id}`}>
                {isCompleted && <ExternalLink className="h-4 w-4 mr-1" />}
                {getActionLabel()}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassCard;
