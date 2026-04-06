
import { GraduationCap, BookOpen, Heart, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Child } from "@/types/platform";

interface ChildProfileCardProps {
  child: Child;
  onEdit?: (childId: string) => void;
  onDelete?: (childId: string) => void;
  onViewProgress?: (childId: string) => void;
  onFindTutor?: (childId: string) => void;
  showActions?: boolean;
}

const ChildProfileCard = ({
  child,
  onEdit,
  onDelete,
  onViewProgress,
  onFindTutor,
  showActions = true,
}: ChildProfileCardProps) => {
  const initials = child.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const ageColor =
    child.age <= 7
      ? "bg-pink-100 text-pink-700"
      : child.age <= 12
      ? "bg-blue-100 text-blue-700"
      : "bg-indigo-100 text-indigo-700";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 flex-shrink-0">
            {child.avatar ? (
              <AvatarImage src={child.avatar} alt={child.name} />
            ) : null}
            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">{child.name}</h3>
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(child.id)}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Edit child"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(child.id)}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove child"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {child.age > 0 && (
                <Badge variant="outline" className={`text-xs ${ageColor}`}>
                  {child.age} years
                </Badge>
              )}
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {child.grade}
              </Badge>
            </div>

            {/* Enrolled subjects */}
            {child.enrolledSubjects && child.enrolledSubjects.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <BookOpen className="h-3 w-3" />
                  Enrolled Subjects
                </p>
                <div className="flex flex-wrap gap-1">
                  {child.enrolledSubjects.map((subject) => (
                    <Badge
                      key={subject}
                      variant="secondary"
                      className="text-xs bg-indigo-50 text-indigo-700"
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Learning preferences */}
            {child.learningPreferences && child.learningPreferences.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Heart className="h-3 w-3" />
                  Learning Style
                </p>
                <div className="flex flex-wrap gap-1">
                  {child.learningPreferences.map((pref) => (
                    <Badge key={pref} variant="outline" className="text-xs">
                      {pref}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-4">
            {onViewProgress && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onViewProgress(child.id)}
              >
                View Progress
              </Button>
            )}
            {onFindTutor && (
              <Button
                size="sm"
                className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700"
                onClick={() => onFindTutor(child.id)}
              >
                Find Tutor
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChildProfileCard;
