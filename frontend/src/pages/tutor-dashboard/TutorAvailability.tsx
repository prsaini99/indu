import { useEffect, useState } from "react";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  tutorService,
  type AvailabilityTemplate,
  type BlockedDate,
} from "@/services/tutor.service";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Monday–Sunday

const formatTime = (time: string) => {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
};

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 21; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

const TutorAvailability = () => {
  const { toast } = useToast();

  const [templates, setTemplates] = useState<AvailabilityTemplate[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline form state for adding a template
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotDay, setNewSlotDay] = useState<string>("1");
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("11:00");
  const [addingSlot, setAddingSlot] = useState(false);

  // Inline form state for blocking a date
  const [showBlockDate, setShowBlockDate] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);

  // Track which items are being deleted
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesData, blockedData] = await Promise.all([
        tutorService.getTemplates(),
        tutorService.getBlockedDates(),
      ]);
      setTemplates(templatesData);
      setBlockedDates(blockedData);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load availability data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Group templates by day
  const templatesByDay: Record<number, AvailabilityTemplate[]> = {};
  for (const dayNum of ORDERED_DAYS) {
    templatesByDay[dayNum] = templates
      .filter((t) => t.dayOfWeek === dayNum)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Summary calculations
  const totalHoursPerWeek = templates.reduce((total, t) => {
    const [sh, sm] = t.startTime.split(":").map(Number);
    const [eh, em] = t.endTime.split(":").map(Number);
    return total + (eh + em / 60) - (sh + sm / 60);
  }, 0);

  const activeDays = new Set(templates.map((t) => t.dayOfWeek)).size;

  // Add template
  const handleAddSlot = async () => {
    setAddingSlot(true);
    try {
      const created = await tutorService.createTemplate({
        dayOfWeek: parseInt(newSlotDay),
        startTime: newSlotStart,
        endTime: newSlotEnd,
      });
      setTemplates((prev) => [...prev, created]);
      setShowAddSlot(false);
      setNewSlotDay("1");
      setNewSlotStart("09:00");
      setNewSlotEnd("11:00");
      toast({ title: "Slot Added", description: `${created.dayName} ${formatTime(created.startTime)} - ${formatTime(created.endTime)}` });
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || "Failed to add slot.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setAddingSlot(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (id: string) => {
    setDeletingTemplateId(id);
    try {
      await tutorService.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Slot Removed", description: "Time slot has been deleted." });
    } catch {
      toast({ title: "Error", description: "Failed to delete time slot.", variant: "destructive" });
    } finally {
      setDeletingTemplateId(null);
    }
  };

  // Block a date
  const handleBlockDate = async () => {
    if (!newBlockDate) return;
    setAddingBlock(true);
    try {
      const created = await tutorService.createBlockedDate({
        date: newBlockDate,
        reason: newBlockReason || undefined,
      });
      setBlockedDates((prev) => [...prev, created]);
      setShowBlockDate(false);
      setNewBlockDate("");
      setNewBlockReason("");
      toast({ title: "Date Blocked", description: `${created.date} has been blocked.` });
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || "Failed to block date.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setAddingBlock(false);
    }
  };

  // Unblock a date
  const handleDeleteBlock = async (id: string) => {
    setDeletingBlockId(id);
    try {
      await tutorService.deleteBlockedDate(id);
      setBlockedDates((prev) => prev.filter((b) => b.id !== id));
      toast({ title: "Date Unblocked", description: "Blocked date has been removed." });
    } catch {
      toast({ title: "Error", description: "Failed to unblock date.", variant: "destructive" });
    } finally {
      setDeletingBlockId(null);
    }
  };

  if (loading) {
    return (
      <TutorDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </TutorDashboardLayout>
    );
  }

  return (
    <TutorDashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-teal-800">Availability</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your weekly schedule and block specific dates when you are unavailable.
            All times are shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
          </p>
        </div>

        {/* Summary Card */}
        <Card className="mb-6 border-teal-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-teal-800">
                    {totalHoursPerWeek % 1 === 0 ? totalHoursPerWeek : totalHoursPerWeek.toFixed(1)} hours / week
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeDays} active {activeDays === 1 ? "day" : "days"} &middot; {blockedDates.length} blocked {blockedDates.length === 1 ? "date" : "dates"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {ORDERED_DAYS.map((dayNum) => (
                  <Badge
                    key={dayNum}
                    variant={templatesByDay[dayNum].length > 0 ? "default" : "outline"}
                    className={`text-xs ${templatesByDay[dayNum].length > 0 ? "bg-teal-600 hover:bg-teal-700" : ""}`}
                  >
                    {DAY_NAMES[dayNum].slice(0, 3)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Section */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-teal-800 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => setShowAddSlot(!showAddSlot)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Slot
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Inline Add Slot Form */}
            {showAddSlot && (
              <div className="mb-5 p-4 bg-teal-50 rounded-lg border border-teal-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Day</Label>
                    <Select value={newSlotDay} onValueChange={setNewSlotDay}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDERED_DAYS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {DAY_NAMES[d]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Start Time</Label>
                    <Select value={newSlotStart} onValueChange={setNewSlotStart}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {formatTime(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Time</Label>
                    <Select value={newSlotEnd} onValueChange={setNewSlotEnd}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {formatTime(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={handleAddSlot}
                    disabled={addingSlot}
                  >
                    {addingSlot && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Save Slot
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddSlot(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Day-by-day listing */}
            <div className="space-y-3">
              {ORDERED_DAYS.map((dayNum) => {
                const slots = templatesByDay[dayNum];
                return (
                  <div key={dayNum} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-teal-800">{DAY_NAMES[dayNum]}</span>
                      {slots.length > 0 && (
                        <Badge variant="outline" className="text-xs border-teal-300 text-teal-700">
                          {slots.length} {slots.length === 1 ? "slot" : "slots"}
                        </Badge>
                      )}
                    </div>
                    {slots.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {slots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between bg-teal-50 rounded px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-teal-500" />
                              <span className="text-sm font-medium">
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteTemplate(slot.id)}
                              disabled={deletingTemplateId === slot.id}
                            >
                              {deletingTemplateId === slot.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">No slots scheduled</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Blocked Dates Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-teal-800 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Blocked Dates
              </CardTitle>
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => setShowBlockDate(!showBlockDate)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Block Date
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Inline Block Date Form */}
            {showBlockDate && (
              <div className="mb-5 p-4 bg-teal-50 rounded-lg border border-teal-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={newBlockDate}
                      onChange={(e) => setNewBlockDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Reason (optional)</Label>
                    <Input
                      type="text"
                      className="mt-1"
                      placeholder="e.g. Doctor appointment"
                      value={newBlockReason}
                      onChange={(e) => setNewBlockReason(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={handleBlockDate}
                    disabled={addingBlock || !newBlockDate}
                  >
                    {addingBlock && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Block Date
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBlockDate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Blocked dates list */}
            {blockedDates.length > 0 ? (
              <div className="space-y-2">
                {blockedDates
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((bd) => (
                    <div
                      key={bd.id}
                      className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-2.5 border border-red-100"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-red-400" />
                        <div>
                          <p className="text-sm font-medium">{bd.date}</p>
                          {bd.reason && (
                            <p className="text-xs text-muted-foreground">{bd.reason}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-100"
                        onClick={() => handleDeleteBlock(bd.id)}
                        disabled={deletingBlockId === bd.id}
                      >
                        {deletingBlockId === bd.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No dates blocked. Use the button above to block dates when you are unavailable.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </TutorDashboardLayout>
  );
};

export default TutorAvailability;
