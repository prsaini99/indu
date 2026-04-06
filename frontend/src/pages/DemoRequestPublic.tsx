import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { publicDemoService, type PublicDemoRequestPayload } from "@/services/demoRequest.service";
import { referenceService } from "@/services/user.service";
import type { GradeLevel, Subject, Board } from "@/services/user.service";

const DemoRequestPublic = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reference data
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);

  const emptyForm: PublicDemoRequestPayload = {
    parentName: "",
    contactEmail: "",
    contactPhone: "+971 ",
    childFirstName: "",
    childLastName: "",
    boardId: "",
    gradeId: "",
    subjectIds: [],
    preferredTimeSlot: "MORNING",
    preferredDate: "",
    notes: "",
  };

  const [form, setForm] = useState<PublicDemoRequestPayload>(emptyForm);
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");

  useEffect(() => {
    Promise.all([
      referenceService.getGrades(),
      referenceService.getSubjects(),
      referenceService.getBoards(),
    ]).then(([g, s, b]) => {
      setGrades(g);
      setSubjects(s);
      setBoards(b);
    });
  }, []);

  // Pre-fill from logged-in user if available
  useEffect(() => {
    if (user) {
      const parts = (user.fullName || "").split(" ");
      if (!parentFirstName) setParentFirstName(parts[0] || "");
      if (!parentLastName) setParentLastName(parts.slice(1).join(" ") || "");
      setForm((prev) => ({
        ...prev,
        contactEmail: prev.contactEmail || user.email || "",
      }));
    }
  }, [user]);

  const selectSubject = (subjectId: string) => {
    setForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds[0] === subjectId ? [] : [subjectId],
    }));
  };

  const handleSubmit = async () => {
    if (
      !parentFirstName ||
      !parentLastName ||
      !form.contactEmail ||
      !form.contactPhone ||
      !form.childFirstName ||
      !form.boardId ||
      !form.gradeId ||
      form.subjectIds.length === 0 ||
      !form.preferredDate
    ) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: PublicDemoRequestPayload = {
        ...form,
        parentName: `${parentFirstName.trim()} ${parentLastName.trim()}`,
        childDateOfBirth: form.childDateOfBirth || undefined,
        alternativeDate: form.alternativeDate || undefined,
        notes: form.notes || undefined,
      };
      await publicDemoService.submit(payload);
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        "Failed to submit request. Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your demo class request has been submitted successfully. Our education consultant will contact you within 24 hours to schedule the perfect tutor match for your child.
            </p>
            <div className="space-y-3">
              <Link to="/">
                <Button className="w-full bg-teal-600 hover:bg-teal-700">Back to Home</Button>
              </Link>
              {!user && (
                <Link to="/auth/signup">
                  <Button variant="outline" className="w-full mt-2">Create an Account</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/indu.png" alt="Indu AE" className="h-8 object-contain" />
          </Link>
          {!user && (
            <Link to="/auth/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <GraduationCap className="h-4 w-4" /> Free Demo Class
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Book a Free Demo Class
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            No account needed. Fill in the details below and our education consultant will find the perfect tutor for your child.
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Parent info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">1</div>
                Your Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    value={parentFirstName}
                    onChange={(e) => setParentFirstName(e.target.value)}
                    placeholder="Your first name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    value={parentLastName}
                    onChange={(e) => setParentLastName(e.target.value)}
                    placeholder="Your last name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="you@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone *</label>
                  <Input
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="+971 50 123 4567"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Child info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">2</div>
                Child Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Child's First Name *</label>
                  <Input
                    value={form.childFirstName}
                    onChange={(e) => setForm({ ...form, childFirstName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Child's Last Name</label>
                  <Input
                    value={form.childLastName || ""}
                    onChange={(e) => setForm({ ...form, childLastName: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Academic info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">3</div>
                Academic Details
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Board *</label>
                    <Select value={form.boardId} onValueChange={(v) => setForm({ ...form, boardId: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select board" /></SelectTrigger>
                      <SelectContent>
                        {boards.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Grade *</label>
                    <Select value={form.gradeId} onValueChange={(v) => setForm({ ...form, gradeId: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select grade" /></SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Subject *</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subjects.map((s) => (
                      <Badge
                        key={s.id}
                        variant={form.subjectIds.includes(s.id) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          form.subjectIds.includes(s.id)
                            ? "bg-teal-600 text-white hover:bg-teal-700"
                            : "hover:bg-teal-50"
                        }`}
                        onClick={() => selectSubject(s.id)}
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">4</div>
                Scheduling Preferences
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Preferred Time *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {([
                      { value: "MORNING", label: "Morning", sub: "8 AM - 12 PM" },
                      { value: "AFTERNOON", label: "Afternoon", sub: "12 PM - 5 PM" },
                      { value: "EVENING", label: "Evening", sub: "5 PM - 9 PM" },
                    ] as const).map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setForm({ ...form, preferredTimeSlot: slot.value })}
                        className={`rounded-lg border p-3 text-center transition-all ${
                          form.preferredTimeSlot === slot.value
                            ? "border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="text-sm font-medium">{slot.label}</p>
                        <p className="text-xs text-muted-foreground">{slot.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Preferred Start Date *</label>
                    <Input
                      type="date"
                      value={form.preferredDate}
                      onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                      className="mt-1"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Alternative Date</label>
                    <Input
                      type="date"
                      value={form.alternativeDate || ""}
                      onChange={(e) => setForm({ ...form, alternativeDate: e.target.value })}
                      className="mt-1"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium">Additional Notes</label>
              <Textarea
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any special requirements or preferences for the demo class..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              className="w-full bg-teal-600 hover:bg-teal-700 h-11"
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                "Request Free Demo Class"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By submitting, you agree to be contacted by our education consultant regarding this demo class request.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoRequestPublic;
