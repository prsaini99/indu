
import { Star, MapPin, Clock, BookOpen, CheckCircle, Languages, IndianRupee, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TutorProfile } from "@/types/platform";

interface TutorProfileCardProps {
  id: string;
  fullName: string;
  avatar: string;
  profile: TutorProfile;
  variant?: "compact" | "detailed";
  onRequestDemo?: (tutorId: string) => void;
  onViewProfile?: (tutorId: string) => void;
  onSuggest?: (tutorId: string) => void;
  showActions?: boolean;
}

const TutorProfileCard = ({
  id,
  fullName,
  avatar,
  profile,
  variant = "compact",
  onRequestDemo,
  onViewProfile,
  onSuggest,
  showActions = true,
}: TutorProfileCardProps) => {
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  if (variant === "compact") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Avatar className="h-14 w-14 flex-shrink-0">
              <AvatarImage src={profile.avatar || avatar} alt={fullName} />
              <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{fullName}</h3>
                {profile.isVerified && (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">{profile.rating}</span>
                <span className="text-xs text-muted-foreground">
                  ({profile.totalReviews} reviews)
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {profile.subjects.slice(0, 3).map((subject) => (
                  <Badge key={subject} variant="secondary" className="text-xs px-1.5 py-0">
                    {subject}
                  </Badge>
                ))}
                {profile.subjects.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    +{profile.subjects.length - 3}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {profile.experience}
                </span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {profile.hourlyRate}/hr
                </span>
              </div>
            </div>
          </div>
          {showActions && (
            <div className="flex gap-2 mt-3">
              {onViewProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => onViewProfile(id)}
                >
                  View Profile
                </Button>
              )}
              {onRequestDemo && (
                <Button
                  size="sm"
                  className="flex-1 text-xs bg-purple-600 hover:bg-purple-700"
                  onClick={() => onRequestDemo(id)}
                >
                  Request Demo
                </Button>
              )}
              {onSuggest && (
                <Button
                  size="sm"
                  className="flex-1 text-xs bg-teal-600 hover:bg-teal-700"
                  onClick={() => onSuggest(id)}
                >
                  Suggest Tutor
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Detailed variant
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex gap-5">
          <Avatar className="h-20 w-20 flex-shrink-0">
            <AvatarImage src={profile.avatar || avatar} alt={fullName} />
            <AvatarFallback className="bg-purple-100 text-purple-700 text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{fullName}</h3>
              {profile.isVerified && (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>

            <div className="flex items-center gap-1 mt-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{profile.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({profile.totalReviews} reviews)
              </span>
              <span className="mx-2 text-muted-foreground">·</span>
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {profile.totalStudents} students
              </span>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Subjects
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.subjects.map((subject) => (
              <Badge key={subject} variant="secondary" className="bg-purple-50 text-purple-700">
                {subject}
              </Badge>
            ))}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="text-center p-2 rounded-lg bg-gray-50">
            <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Experience</p>
            <p className="text-sm font-semibold">{profile.experience}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-gray-50">
            <IndianRupee className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Rate</p>
            <p className="text-sm font-semibold">Rs. {profile.hourlyRate}/hr</p>
          </div>
          {profile.location && (
            <div className="text-center p-2 rounded-lg bg-gray-50">
              <MapPin className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-semibold truncate">{profile.location}</p>
            </div>
          )}
          <div className="text-center p-2 rounded-lg bg-gray-50">
            <Languages className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Languages</p>
            <p className="text-sm font-semibold truncate">{profile.languages.join(", ")}</p>
          </div>
        </div>

        {/* Qualifications */}
        {profile.qualifications.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Qualifications</p>
            <ul className="text-sm space-y-0.5">
              {profile.qualifications.map((q, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-purple-500 mt-1">•</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 mt-5">
            {onViewProfile && (
              <Button variant="outline" className="flex-1" onClick={() => onViewProfile(id)}>
                View Full Profile
              </Button>
            )}
            {onRequestDemo && (
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={() => onRequestDemo(id)}
              >
                Request Demo Class
              </Button>
            )}
            {onSuggest && (
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={() => onSuggest(id)}
              >
                Suggest This Tutor
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TutorProfileCard;
