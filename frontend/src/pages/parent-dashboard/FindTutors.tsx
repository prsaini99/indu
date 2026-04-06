
import { useState, useEffect, useCallback } from "react";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  GraduationCap,
  Star,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  Calendar,
  User,
  Video,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  tutorSearchService,
  tutorService,
  type TutorSearchResult,
  type TutorPublicProfile,
  type ComputedSlot,
  type PaginationMeta,
} from "@/services/tutor.service";
import { referenceService, type Subject } from "@/services/user.service";

const ITEMS_PER_PAGE = 9;

const FindTutors = () => {
  const { toast } = useToast();

  // Filter / search state
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("experience");
  const [page, setPage] = useState(1);

  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile dialog state
  const [selectedTutor, setSelectedTutor] = useState<TutorPublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Availability state
  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Fetch subjects on mount
  useEffect(() => {
    referenceService.getSubjects().then(setSubjects).catch(() => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load subjects.",
      });
    });
  }, [toast]);

  // Fetch tutors when filters change
  const fetchTutors = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof tutorSearchService.search>[0] = {
        page,
        limit: ITEMS_PER_PAGE,
        sort: sortBy,
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedSubject && selectedSubject !== "all") params.subject = selectedSubject;

      const result = await tutorSearchService.search(params);
      setTutors(result.data);
      setMeta(result.meta);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tutors. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedSubject, sortBy, toast]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedSubject, sortBy]);

  // Search on Enter or button click
  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  // View Profile handler
  const handleViewProfile = async (tutorId: string) => {
    setDialogOpen(true);
    setProfileLoading(true);
    setSelectedTutor(null);
    setSlots([]);

    try {
      const profile = await tutorSearchService.getPublicProfile(tutorId);
      setSelectedTutor(profile);

      // Fetch availability for the next 7 days
      setSlotsLoading(true);
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];
      const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      try {
        const availSlots = await tutorService.getAvailability(tutorId, startDate, endDate);
        setSlots(availSlots);
      } catch {
        // Availability may fail if tutor has no templates — that's OK
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tutor profile.",
      });
      setDialogOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, ComputedSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  // Helpers
  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  const getSubjectName = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId)?.name ?? subjectId;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Pagination helpers
  const totalPages = meta?.totalPages ?? 1;

  const pageNumbers = (() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  return (
    <ParentDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-indigo-800">Find Tutors</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse verified tutors, compare profiles, and request demo classes for your children.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Input
              placeholder="Search by tutor name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1 h-8 px-2 text-indigo-600 hover:text-indigo-800"
              onClick={handleSearch}
            >
              Go
            </Button>
          </div>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full sm:w-52">
              <BookOpen className="h-4 w-4 mr-2 text-indigo-500" />
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="experience">Most Experienced</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active filters */}
        {(searchQuery || selectedSubject !== "all") && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Filters:</span>
            {searchQuery && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-indigo-100"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
              >
                &ldquo;{searchQuery}&rdquo; &times;
              </Badge>
            )}
            {selectedSubject !== "all" && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-indigo-100"
                onClick={() => setSelectedSubject("all")}
              >
                {getSubjectName(selectedSubject)} &times;
              </Badge>
            )}
          </div>
        )}

        {/* Results count */}
        {!loading && meta && (
          <p className="text-sm text-muted-foreground mb-4">
            {meta.total} tutor{meta.total !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading tutors...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && tutors.length === 0 && (
          <div className="text-center py-16">
            <GraduationCap className="h-14 w-14 text-indigo-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-indigo-800">No tutors found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters.
            </p>
            <Button
              variant="outline"
              className="mt-4 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
                setSelectedSubject("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Tutor cards grid */}
        {!loading && tutors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tutors.map((tutor) => (
              <Card
                key={tutor.id}
                className="hover:shadow-md transition-shadow border-indigo-100 cursor-pointer"
                onClick={() => handleViewProfile(tutor.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center"
                    >
                      {getInitials(tutor.firstName, tutor.lastName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + rating */}
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-indigo-900 truncate">
                          {tutor.firstName} {tutor.lastName}
                        </h3>
                        {tutor.rating != null && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-medium text-amber-700">
                              {tutor.rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({tutor.totalReviews})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Experience */}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tutor.experience} {tutor.experience === 1 ? "year" : "years"} experience
                      </p>

                      {/* Courses */}
                      {tutor.courses.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {tutor.courses.map((course) => (
                            <Badge
                              key={course.id}
                              variant="secondary"
                              className="bg-indigo-50 text-indigo-700 text-xs"
                            >
                              {course.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && meta && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border-indigo-200"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>

            {pageNumbers[0] > 1 && (
              <>
                <Button
                  variant={page === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(1)}
                  className={page === 1 ? "bg-indigo-600 hover:bg-indigo-700" : "border-indigo-200"}
                >
                  1
                </Button>
                {pageNumbers[0] > 2 && (
                  <span className="px-1 text-muted-foreground text-sm">...</span>
                )}
              </>
            )}

            {pageNumbers.map((n) => (
              <Button
                key={n}
                variant={page === n ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(n)}
                className={page === n ? "bg-indigo-600 hover:bg-indigo-700" : "border-indigo-200"}
              >
                {n}
              </Button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="px-1 text-muted-foreground text-sm">...</span>
                )}
                <Button
                  variant={page === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  className={page === totalPages ? "bg-indigo-600 hover:bg-indigo-700" : "border-indigo-200"}
                >
                  {totalPages}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-indigo-200"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        )}
      </div>

      {/* ===== Tutor Profile Dialog ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {profileLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            </div>
          ) : selectedTutor ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center">
                    {getInitials(selectedTutor.firstName, selectedTutor.lastName)}
                  </div>
                  <div>
                    <DialogTitle className="text-lg text-indigo-900">
                      {selectedTutor.firstName} {selectedTutor.lastName}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {selectedTutor.experience} {selectedTutor.experience === 1 ? "year" : "years"} experience
                      </span>
                      {selectedTutor.rating != null && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium text-amber-700">
                            {selectedTutor.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({selectedTutor.totalReviews} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Bio */}
              {selectedTutor.bio && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">About</h4>
                  <p className="text-sm text-gray-600">{selectedTutor.bio}</p>
                </div>
              )}

              {/* Courses with rates */}
              {selectedTutor.courses.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                    Courses
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTutor.courses.map((course) => (
                      <Badge
                        key={course.id}
                        variant="secondary"
                        className="bg-indigo-50 text-indigo-700 text-xs py-1 px-2.5"
                      >
                        {course.subject.name} — {course.grade.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {selectedTutor.certifications.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-indigo-500" />
                    Certifications
                  </h4>
                  <div className="space-y-1.5">
                    {selectedTutor.certifications.map((cert) => (
                      <div key={cert.id} className="text-sm text-gray-600">
                        <span className="font-medium">{cert.title}</span>
                        {cert.institution && (
                          <span className="text-muted-foreground"> — {cert.institution}</span>
                        )}
                        {cert.year && (
                          <span className="text-muted-foreground"> ({cert.year})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Intro Video */}
              {selectedTutor.introVideoUrl && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-indigo-500" />
                    Intro Video
                  </h4>
                  <div className="aspect-video max-w-full rounded-lg overflow-hidden">
                    <iframe
                      className="w-full h-full"
                      src={selectedTutor.introVideoUrl
                        .replace("watch?v=", "embed/")
                        .replace("youtu.be/", "www.youtube.com/embed/")}
                      title="Tutor Intro Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Availability */}
              <div className="mt-5 border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  Available Slots (Next 7 Days)
                </h4>

                {slotsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    <span className="text-sm text-muted-foreground">Loading availability...</span>
                  </div>
                ) : Object.keys(slotsByDate).length === 0 ? (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No available slots in the next 7 days.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                      <div key={date}>
                        <p className="text-xs font-semibold text-indigo-700 mb-1">
                          {formatDate(date)}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {dateSlots.map((slot, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs border-indigo-200 text-indigo-600 py-0.5"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {slot.startTime} – {slot.endTime}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </ParentDashboardLayout>
  );
};

export default FindTutors;
