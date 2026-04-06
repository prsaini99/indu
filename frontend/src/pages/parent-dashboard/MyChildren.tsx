import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "@/services/user.service";
import type { ChildProfile } from "@/services/user.service";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Loader2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MyChildren = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService
      .getChildren()
      .then(setChildren)
      .catch(() => {
        toast({ title: "Error", description: "Failed to load children.", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <ParentDashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-indigo-800">My Children</h1>
            <p className="text-muted-foreground text-sm mt-1">
              View your children's profiles. To add or update profiles, please contact your admin.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{children.length}</p>
                <p className="text-xs text-muted-foreground">Total Children</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {children.reduce((acc, c) => acc + (c.subjects?.length || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Subjects</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : children.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <Card key={child.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                      {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{child.firstName} {child.lastName}</h3>
                      <p className="text-xs text-muted-foreground">{child.grade.name}</p>
                    </div>
                  </div>

                  {child.dateOfBirth && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                      <Calendar className="h-3 w-3" />
                      DOB: {new Date(child.dateOfBirth).toLocaleDateString()}
                    </p>
                  )}

                  {child.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {child.subjects.map((s) => (
                        <Badge key={s.id} variant="secondary" className="text-xs">
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {child.notes && (
                    <p className="text-xs text-muted-foreground bg-gray-50 rounded p-2">{child.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold">No children registered yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Submit a Demo Request to get started. Your admin will create child profiles after the demo.
              </p>
              <Button
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => navigate("/parent-dashboard/demo-requests")}
              >
                Request a Demo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ParentDashboardLayout>
  );
};

export default MyChildren;
