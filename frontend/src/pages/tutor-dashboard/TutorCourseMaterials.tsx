import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  X,
  Loader2,
  BookOpen,
  ExternalLink,
} from "lucide-react";

import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { tutorCourseService, type Course, type CourseMaterial } from "@/services/course.service";

const TutorCourseMaterials = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Materials dialog
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [materialForm, setMaterialForm] = useState({ title: "", fileUrl: "", fileType: "pdf" });
  const [materialSaving, setMaterialSaving] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tutorCourseService.listMyCourses();
      setCourses(data);
    } catch {
      toast({ title: "Error", description: "Failed to load courses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const openMaterialsDialog = (course: Course) => {
    setSelectedCourse(course);
    setMaterialForm({ title: "", fileUrl: "", fileType: "pdf" });
    setMaterialsOpen(true);
  };

  const handleAddMaterial = async () => {
    if (!selectedCourse || !materialForm.title || !materialForm.fileUrl) return;
    try {
      setMaterialSaving(true);
      await tutorCourseService.addMaterial(selectedCourse.id, {
        title: materialForm.title,
        fileUrl: materialForm.fileUrl,
        fileType: materialForm.fileType,
      });
      toast({ title: "Material added", description: `"${materialForm.title}" uploaded successfully.` });
      setMaterialForm({ title: "", fileUrl: "", fileType: "pdf" });
      // Refresh courses to get updated materials
      const updated = await tutorCourseService.listMyCourses();
      setCourses(updated);
      const refreshed = updated.find((c) => c.id === selectedCourse.id);
      if (refreshed) setSelectedCourse(refreshed);
    } catch {
      toast({ title: "Error", description: "Failed to add material", variant: "destructive" });
    } finally {
      setMaterialSaving(false);
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    if (!selectedCourse) return;
    try {
      await tutorCourseService.removeMaterial(selectedCourse.id, materialId);
      toast({ title: "Material removed" });
      const updated = await tutorCourseService.listMyCourses();
      setCourses(updated);
      const refreshed = updated.find((c) => c.id === selectedCourse.id);
      if (refreshed) setSelectedCourse(refreshed);
    } catch {
      toast({ title: "Error", description: "Failed to remove material", variant: "destructive" });
    }
  };

  return (
    <TutorDashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-purple-800">Course Materials</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload and manage learning materials for your assigned courses.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No courses assigned</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You haven't been assigned to any courses yet. Contact your admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base text-purple-800">{course.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-xs">{course.subject.name}</Badge>
                        <Badge variant="outline" className="text-xs">{course.grade.name}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {course.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{course.materials?.length || 0} material{(course.materials?.length || 0) !== 1 ? "s" : ""}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openMaterialsDialog(course)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Manage Materials
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Materials Dialog */}
      <Dialog open={materialsOpen} onOpenChange={setMaterialsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Materials — {selectedCourse?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Existing materials */}
            <div>
              <Label className="text-sm font-medium">Current Materials</Label>
              {(!selectedCourse?.materials || selectedCourse.materials.length === 0) ? (
                <p className="text-sm text-muted-foreground mt-2">No materials uploaded yet.</p>
              ) : (
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                  {selectedCourse.materials.map((mat: CourseMaterial) => (
                    <div key={mat.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge className="bg-gray-100 text-gray-800 text-xs shrink-0">{mat.fileType.toUpperCase()}</Badge>
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate flex items-center gap-1"
                        >
                          {mat.title}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => handleRemoveMaterial(mat.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add material */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Add Material</Label>
              <div className="space-y-2 mt-2">
                <Input
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  placeholder="Title"
                />
                <Input
                  value={materialForm.fileUrl}
                  onChange={(e) => setMaterialForm({ ...materialForm, fileUrl: e.target.value })}
                  placeholder="File URL"
                />
                <div className="flex gap-2">
                  <select
                    value={materialForm.fileType}
                    onChange={(e) => setMaterialForm({ ...materialForm, fileType: e.target.value })}
                    className="px-3 py-2 border border-input rounded-md bg-background text-sm flex-1"
                  >
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="pptx">PPTX</option>
                    <option value="xlsx">XLSX</option>
                    <option value="mp4">MP4</option>
                    <option value="other">Other</option>
                  </select>
                  <Button
                    onClick={handleAddMaterial}
                    disabled={materialSaving || !materialForm.title || !materialForm.fileUrl}
                  >
                    {materialSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TutorDashboardLayout>
  );
};

export default TutorCourseMaterials;
