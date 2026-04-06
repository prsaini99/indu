import { useState, useEffect, useCallback } from "react";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  User,
  BookOpen,
  GraduationCap,
  Clock,
  Edit2,
  Save,
  X,
  Phone,
  Mail,
  Plus,
  Trash2,
  Loader2,
  Video,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  tutorService,
  type TutorOwnProfile,
  type TutorCertification,
} from "@/services/tutor.service";

const TutorProfile = () => {
  const { toast } = useToast();

  // Profile state
  const [profile, setProfile] = useState<TutorOwnProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    bio: "",
    phone: "",
    experience: 0,
    introVideoUrl: "",
  });

  // Certification form
  const [showCertForm, setShowCertForm] = useState(false);
  const [certForm, setCertForm] = useState({
    title: "",
    institution: "",
    year: "",
    documentUrl: "",
  });
  const [addingCert, setAddingCert] = useState(false);
  const [deletingCertId, setDeletingCertId] = useState<string | null>(null);

  // Intro video form
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tutorService.getProfile();
      setProfile(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to load profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getInitials = () => {
    if (!profile) return "?";
    const first = profile.firstName?.charAt(0) || "";
    const last = profile.lastName?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "";

  // Edit handlers
  const startEditing = () => {
    if (!profile) return;
    setEditData({
      bio: profile.bio || "",
      phone: profile.phone || "",
      experience: profile.experience,
      introVideoUrl: profile.introVideoUrl || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await tutorService.updateProfile({
        bio: editData.bio || undefined,
        phone: editData.phone || undefined,
        experience: editData.experience,
        introVideoUrl: editData.introVideoUrl || null,
      });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
      await fetchProfile();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description:
          err?.response?.data?.message || "Could not update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Certification handlers
  const handleAddCert = async () => {
    if (!certForm.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Certification title is required.",
        variant: "destructive",
      });
      return;
    }
    if (!certForm.documentUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Document URL is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingCert(true);
      await tutorService.addCertification({
        title: certForm.title.trim(),
        institution: certForm.institution.trim() || undefined,
        year: certForm.year ? Number(certForm.year) : undefined,
        documentUrl: certForm.documentUrl.trim(),
      });
      toast({
        title: "Certification Added",
        description: "Your certification has been added successfully.",
      });
      setCertForm({ title: "", institution: "", year: "", documentUrl: "" });
      setShowCertForm(false);
      await fetchProfile();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Could not add certification.",
        variant: "destructive",
      });
    } finally {
      setAddingCert(false);
    }
  };

  const handleDeleteCert = async (certId: string) => {
    try {
      setDeletingCertId(certId);
      await tutorService.deleteCertification(certId);
      toast({
        title: "Certification Removed",
        description: "The certification has been removed.",
      });
      await fetchProfile();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Could not delete certification.",
        variant: "destructive",
      });
    } finally {
      setDeletingCertId(null);
    }
  };

  // Intro video handlers
  const handleSaveVideo = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a YouTube URL.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSavingVideo(true);
      await tutorService.updateProfile({ introVideoUrl: videoUrl.trim() });
      toast({ title: "Intro Video Saved", description: "Your intro video has been updated." });
      setShowVideoForm(false);
      setVideoUrl("");
      await fetchProfile();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Could not save intro video.",
        variant: "destructive",
      });
    } finally {
      setSavingVideo(false);
    }
  };

  const handleRemoveVideo = async () => {
    try {
      setSavingVideo(true);
      await tutorService.updateProfile({ introVideoUrl: null });
      toast({ title: "Intro Video Removed", description: "Your intro video has been removed." });
      await fetchProfile();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Could not remove intro video.",
        variant: "destructive",
      });
    } finally {
      setSavingVideo(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <TutorDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </TutorDashboardLayout>
    );
  }

  if (!profile) {
    return (
      <TutorDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
          <p>Could not load profile. Please try again later.</p>
          <Button variant="outline" className="mt-4" onClick={fetchProfile}>
            Retry
          </Button>
        </div>
      </TutorDashboardLayout>
    );
  }

  return (
    <TutorDashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-teal-800">My Profile</h1>
          {!isEditing ? (
            <Button variant="outline" onClick={startEditing}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Profile Header Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="h-24 w-24 rounded-full bg-teal-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
                {profile.profilePhotoUrl ? (
                  <img
                    src={profile.profilePhotoUrl}
                    alt={fullName}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900">
                    {fullName}
                  </h2>
                  {profile.isActive && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Active
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{profile.email}</span>
                </div>

                {(isEditing ? editData.phone : profile.phone) && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>
                      {isEditing ? editData.phone : profile.phone}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {isEditing
                        ? editData.experience
                        : profile.experience}{" "}
                      {profile.experience === 1 ? "year" : "years"} experience
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {profile.courses.length}{" "}
                      {profile.courses.length === 1 ? "course" : "courses"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-teal-500" />
              About Me
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editData.bio}
                onChange={(e) =>
                  setEditData({ ...editData, bio: e.target.value })
                }
                rows={4}
                placeholder="Tell parents and students about your teaching style..."
              />
            ) : (
              <p className="text-sm leading-relaxed">
                {profile.bio || "No bio added yet."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Editable Details (phone & experience) — shown in edit mode */}
        {isEditing && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Contact & Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1.5 mb-1">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Phone
                  </Label>
                  <Input
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Years of Experience
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={editData.experience}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        experience: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses & Rates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-teal-500" />
              Courses & Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No courses assigned yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {profile.courses.map((course) => (
                  <div
                    key={course.id || course.courseId}
                    className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-teal-800">
                      {course.courseName}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs border-teal-300 text-teal-700"
                    >
                      AED {(course.tutorRate / 100).toFixed(0)}/class
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-teal-500" />
                Certifications
              </CardTitle>
              {!showCertForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCertForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Add certification form */}
            {showCertForm && (
              <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50/50 p-4">
                <h4 className="text-sm font-semibold mb-3">
                  New Certification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1">Title *</Label>
                    <Input
                      value={certForm.title}
                      onChange={(e) =>
                        setCertForm({ ...certForm, title: e.target.value })
                      }
                      placeholder="e.g. B.Ed in Mathematics"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Institution</Label>
                    <Input
                      value={certForm.institution}
                      onChange={(e) =>
                        setCertForm({
                          ...certForm,
                          institution: e.target.value,
                        })
                      }
                      placeholder="e.g. Delhi University"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Year</Label>
                    <Input
                      type="number"
                      value={certForm.year}
                      onChange={(e) =>
                        setCertForm({ ...certForm, year: e.target.value })
                      }
                      placeholder="e.g. 2020"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Document URL *</Label>
                    <Input
                      value={certForm.documentUrl}
                      onChange={(e) =>
                        setCertForm({
                          ...certForm,
                          documentUrl: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={handleAddCert}
                    disabled={addingCert}
                  >
                    {addingCert ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Add Certification
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCertForm(false);
                      setCertForm({
                        title: "",
                        institution: "",
                        year: "",
                        documentUrl: "",
                      });
                    }}
                    disabled={addingCert}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Certifications list */}
            {profile.certifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No certifications added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {profile.certifications.map((cert: TutorCertification) => (
                  <div
                    key={cert.id}
                    className="flex items-start justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{cert.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {cert.institution && <span>{cert.institution}</span>}
                        {cert.institution && cert.year && <span>·</span>}
                        {cert.year && <span>{cert.year}</span>}
                      </div>
                      {cert.documentUrl && (
                        <a
                          href={cert.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-teal-600 hover:underline mt-1 inline-block"
                        >
                          View Document
                        </a>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                      onClick={() => handleDeleteCert(cert.id)}
                      disabled={deletingCertId === cert.id}
                    >
                      {deletingCertId === cert.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intro Video */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5 text-teal-500" />
                Intro Video
              </CardTitle>
              {!showVideoForm && !profile.introVideoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVideoUrl("");
                    setShowVideoForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
              {!showVideoForm && profile.introVideoUrl && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVideoUrl(profile.introVideoUrl || "");
                      setShowVideoForm(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Change
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={handleRemoveVideo}
                    disabled={savingVideo}
                  >
                    {savingVideo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Inline add/edit form */}
            {showVideoForm && (
              <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50/50 p-4">
                <Label className="mb-1">YouTube Video URL</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add a short 10–20 second YouTube intro video about yourself.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={handleSaveVideo}
                    disabled={savingVideo}
                  >
                    {savingVideo ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save Video
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowVideoForm(false);
                      setVideoUrl("");
                    }}
                    disabled={savingVideo}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Video embed */}
            {profile.introVideoUrl ? (
              <div className="aspect-video max-w-md">
                <iframe
                  className="w-full h-full rounded-lg"
                  src={profile.introVideoUrl
                    .replace("watch?v=", "embed/")
                    .replace("youtu.be/", "www.youtube.com/embed/")}
                  title="Tutor Intro Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : !showVideoForm ? (
              <p className="text-sm text-muted-foreground">
                No intro video added yet.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Last Login */}
        {profile.lastLoginAt && (
          <p className="text-xs text-muted-foreground text-right mb-4">
            Last login:{" "}
            {new Date(profile.lastLoginAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </TutorDashboardLayout>
  );
};

export default TutorProfile;
