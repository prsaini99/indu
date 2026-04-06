
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ClassCard, { ClassCardProps } from "./ClassCard";
import { useDesignTokens } from "@/hooks/use-design-tokens";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassListProps {
  classes: ClassCardProps[];
  emptyStateMessage: string;
  showFindClassesButton?: boolean;
  isLoading?: boolean;
  columnCount?: "2" | "3" | "4";
  limit?: number;
  showViewAll?: boolean;
  viewAllLink?: string;
  viewAllLabel?: string;
}

const ClassList: React.FC<ClassListProps> = ({ 
  classes, 
  emptyStateMessage,
  showFindClassesButton = false,
  isLoading = false,
  columnCount = "3",
  limit,
  showViewAll = false,
  viewAllLink = "/parent-dashboard/enrolled-classes",
  viewAllLabel = "View All Classes"
}) => {
  const { cardStyles, buttonStyles } = useDesignTokens();
  
  // Function to get the grid class based on column count
  const getGridClass = () => {
    switch (columnCount) {
      case "2":
        return "grid gap-4 md:grid-cols-1 lg:grid-cols-2";
      case "3":
        return "grid gap-4 md:grid-cols-2 lg:grid-cols-3";
      case "4":
        return "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      default:
        return "grid gap-4 md:grid-cols-2 lg:grid-cols-3";
    }
  };
  
  // Display only a limited number of classes if limit is specified
  const displayedClasses = limit ? classes.slice(0, limit) : classes;
  const hasMoreClasses = limit && classes.length > limit;
  
  if (isLoading) {
    return (
      <div className={getGridClass()}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className={cardStyles.default}>
            <Skeleton className="h-48 w-full rounded-t-lg" />
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (classes.length === 0) {
    return (
      <Card className={cardStyles.default}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">{emptyStateMessage}</p>
          {showFindClassesButton && (
            <Button asChild className={`${buttonStyles.primary} mt-4`}>
              <Link to="/parent-dashboard/enrolled-classes">Find Classes</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className={getGridClass()}>
        {displayedClasses.map((cls) => (
          <ClassCard key={cls.id} {...cls} />
        ))}
      </div>
      
      {(hasMoreClasses && showViewAll) && (
        <div className="flex justify-center mt-6">
          <Button 
            asChild 
            variant="outline" 
            className="border-[#1F4E79] text-[#1F4E79] hover:bg-[#F5F7FA]"
          >
            <Link to={viewAllLink}>{viewAllLabel} ({classes.length})</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClassList;
