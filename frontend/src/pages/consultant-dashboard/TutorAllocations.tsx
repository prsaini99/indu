
import { useState } from "react";
import {
  Search,
  UserCheck,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BookOpen,
  Monitor,
  MapPin,
  Star,
  MessageSquare,
} from "lucide-react";

import ConsultantDashboardLayout from "@/components/ConsultantDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Allocation {
  id: number;
  parentName: string;
  parentAvatar: string;
  childName: string;
  childGrade: string;
  tutorName: string;
  tutorAvatar: string;
  subject: string;
  format: string;
  schedule: string;
  allocatedOn: string;
  status: "active" | "demo-scheduled" | "demo-completed" | "confirmed" | "on-hold" | "reassign-needed";
  demoDate?: string;
  demoOutcome?: "positive" | "negative" | "pending";
  parentRating?: number;
  sessionsCompleted?: number;
}

const allocations: Allocation[] = [
  {
    id: 1,
    parentName: "Kavita Joshi",
    parentAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200",
    childName: "Siddharth Joshi",
    childGrade: "Class 9",
    tutorName: "Dr. Meena Iyer",
    tutorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200",
    subject: "Mathematics",
    format: "Online Live 1-on-1",
    schedule: "Mon/Wed/Fri, 5-6:30 PM",
    allocatedOn: "Feb 28, 2026",
    status: "confirmed",
    demoDate: "Mar 2, 2026",
    demoOutcome: "positive",
    parentRating: 5,
    sessionsCompleted: 8,
  },
  {
    id: 2,
    parentName: "Deepak Verma",
    parentAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200",
    childName: "Aisha Verma",
    childGrade: "Class 7",
    tutorName: "Ravi Shankar",
    tutorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
    subject: "Hindi Literature",
    format: "Offline Outbound",
    schedule: "Sat, 2-4 PM",
    allocatedOn: "Mar 5, 2026",
    status: "confirmed",
    demoDate: "Mar 8, 2026",
    demoOutcome: "positive",
    parentRating: 4,
    sessionsCompleted: 3,
  },
  {
    id: 3,
    parentName: "Anita Sharma",
    parentAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
    childName: "Riya Sharma",
    childGrade: "Class 10",
    tutorName: "Prof. Vikram Das",
    tutorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200",
    subject: "Mathematics",
    format: "Online Live 1-on-1",
    schedule: "Tue/Thu, 4-5:30 PM",
    allocatedOn: "Mar 10, 2026",
    status: "demo-scheduled",
    demoDate: "Mar 14, 2026",
    demoOutcome: "pending",
  },
  {
    id: 4,
    parentName: "Rajesh Kumar",
    parentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
    childName: "Arjun Kumar",
    childGrade: "Class 12",
    tutorName: "Dr. Sunita Rao",
    tutorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200",
    subject: "Physics",
    format: "Offline Inbound",
    schedule: "Sat-Sun, 10 AM-12 PM",
    allocatedOn: "Mar 8, 2026",
    status: "demo-completed",
    demoDate: "Mar 11, 2026",
    demoOutcome: "positive",
  },
  {
    id: 5,
    parentName: "Suresh Patel",
    parentAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200",
    childName: "Neha Patel",
    childGrade: "Class 11",
    tutorName: "Amit Kulkarni",
    tutorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200",
    subject: "Chemistry",
    format: "Online Live 1-on-1",
    schedule: "Tue/Thu, 6-7:30 PM",
    allocatedOn: "Mar 1, 2026",
    status: "reassign-needed",
    demoDate: "Mar 5, 2026",
    demoOutcome: "negative",
  },
  {
    id: 6,
    parentName: "Priya Mehta",
    parentAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200",
    childName: "Aarav Mehta",
    childGrade: "Class 3",
    tutorName: "Sneha Gupta",
    tutorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200",
    subject: "English Speaking",
    format: "Online Live Group",
    schedule: "Mon/Wed/Fri, 5-6 PM",
    allocatedOn: "Mar 9, 2026",
    status: "active",
  },
];

const monthlyAllocationData = [
  { month: "Oct 25", allocations: 18, confirmed: 14 },
  { month: "Nov 25", allocations: 22, confirmed: 17 },
  { month: "Dec 25", allocations: 15, confirmed: 12 },
  { month: "Jan 26", allocations: 28, confirmed: 22 },
  { month: "Feb 26", allocations: 24, confirmed: 20 },
  { month: "Mar 26", allocations: 30, confirmed: 23 },
];

const TutorAllocations = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const statusConfig = {
    active: { color: "bg-blue-100 text-blue-700", label: "Tutor Assigned" },
    "demo-scheduled": { color: "bg-purple-100 text-purple-700", label: "Demo Scheduled" },
    "demo-completed": { color: "bg-teal-100 text-teal-700", label: "Demo Done" },
    confirmed: { color: "bg-green-100 text-green-700", label: "Confirmed" },
    "on-hold": { color: "bg-gray-100 text-gray-600", label: "On Hold" },
    "reassign-needed": { color: "bg-red-100 text-red-700", label: "Reassign Needed" },
  };

  const getFilteredAllocations = (tab: string) => {
    return allocations.filter((a) => {
      const matchesTab =
        tab === "all" ||
        (tab === "active" && ["active", "demo-scheduled", "demo-completed"].includes(a.status)) ||
        (tab === "confirmed" && a.status === "confirmed") ||
        (tab === "reassign" && a.status === "reassign-needed");

      const matchesSearch =
        a.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tutorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subject.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubject = subjectFilter === "all" || a.subject === subjectFilter;

      return matchesTab && matchesSearch && matchesSubject;
    });
  };

  const handleReassign = (id: number, childName: string) => {
    toast({
      title: "Reassign Tutor",
      description: `Opening tutor selection for ${childName}...`,
    });
  };

  const handleConfirmBooking = (id: number, childName: string) => {
    toast({
      title: "Confirm Booking",
      description: `Confirming regular classes for ${childName}...`,
    });
  };

  const handleContactParent = (parentName: string) => {
    toast({
      title: "Message Sent",
      description: `Opening chat with ${parentName}...`,
    });
  };

  const subjects = [...new Set(allocations.map((a) => a.subject))];

  const totalAllocations = allocations.length;
  const confirmedCount = allocations.filter((a) => a.status === "confirmed").length;
  const pendingDemos = allocations.filter((a) => ["active", "demo-scheduled"].includes(a.status)).length;
  const reassignCount = allocations.filter((a) => a.status === "reassign-needed").length;

  return (
    <ConsultantDashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-teal-800">Tutor Allocations</h1>
          <p className="text-muted-foreground">
            Track tutor-parent matches, demo outcomes, and booking confirmations
          </p>
        </div>

        {/* Stats + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stats cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 text-center">
                <UserCheck className="h-5 w-5 text-teal-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{totalAllocations}</p>
                <p className="text-xs text-muted-foreground">Total Allocations</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{confirmedCount}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{pendingDemos}</p>
                <p className="text-xs text-muted-foreground">Pending Demos</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{reassignCount}</p>
                <p className="text-xs text-muted-foreground">Need Reassignment</p>
              </CardContent>
            </Card>

            {/* Conversion metrics */}
            <Card className="bg-white shadow-sm col-span-2">
              <CardContent className="p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Demo Conversion Rate</span>
                    <span className="text-xs font-semibold">75%</span>
                  </div>
                  <Progress value={75} className="h-1.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Avg. Parent Satisfaction</span>
                    <span className="text-xs font-semibold">4.5/5</span>
                  </div>
                  <Progress value={90} className="h-1.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">First-Match Success</span>
                    <span className="text-xs font-semibold">82%</span>
                  </div>
                  <Progress value={82} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="bg-white shadow-sm lg:col-span-7">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Monthly Allocations Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyAllocationData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickMargin={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "0.375rem",
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="allocations" name="Total Allocations" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="confirmed" name="Confirmed" fill="#0D9488" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by parent, child, tutor, or subject..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Allocations Table */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full bg-white border-b rounded-none p-0 h-auto">
            <TabsTrigger value="all" className="rounded-none text-sm py-3 px-4 data-[state=active]:text-teal-700 data-[state=active]:border-b-2 data-[state=active]:border-teal-700 font-medium data-[state=active]:shadow-none">
              All ({getFilteredAllocations("all").length})
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-none text-sm py-3 px-4 data-[state=active]:text-teal-700 data-[state=active]:border-b-2 data-[state=active]:border-teal-700 font-medium data-[state=active]:shadow-none">
              In Progress ({getFilteredAllocations("active").length})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-none text-sm py-3 px-4 data-[state=active]:text-teal-700 data-[state=active]:border-b-2 data-[state=active]:border-teal-700 font-medium data-[state=active]:shadow-none">
              Confirmed ({getFilteredAllocations("confirmed").length})
            </TabsTrigger>
            <TabsTrigger value="reassign" className="rounded-none text-sm py-3 px-4 data-[state=active]:text-teal-700 data-[state=active]:border-b-2 data-[state=active]:border-teal-700 font-medium data-[state=active]:shadow-none">
              Reassign ({getFilteredAllocations("reassign").length})
            </TabsTrigger>
          </TabsList>

          {["all", "active", "confirmed", "reassign"].map((tab) => (
            <TabsContent key={tab} value={tab} className="pt-4">
              {getFilteredAllocations(tab).length > 0 ? (
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-medium text-gray-700">Parent / Child</TableHead>
                            <TableHead className="font-medium text-gray-700">Tutor</TableHead>
                            <TableHead className="font-medium text-gray-700">Subject</TableHead>
                            <TableHead className="font-medium text-gray-700">Format</TableHead>
                            <TableHead className="font-medium text-gray-700">Demo</TableHead>
                            <TableHead className="font-medium text-gray-700">Status</TableHead>
                            <TableHead className="font-medium text-gray-700">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredAllocations(tab).map((alloc) => (
                            <>
                              <TableRow
                                key={alloc.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => setExpandedRow(expandedRow === alloc.id ? null : alloc.id)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={alloc.parentAvatar} />
                                      <AvatarFallback className="bg-teal-100 text-teal-800 text-xs">
                                        {alloc.parentName.split(" ").map((n) => n[0]).join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">{alloc.parentName}</p>
                                      <p className="text-xs text-muted-foreground">{alloc.childName} ({alloc.childGrade})</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage src={alloc.tutorAvatar} />
                                      <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                                        {alloc.tutorName.split(" ").map((n) => n[0]).join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{alloc.tutorName}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">{alloc.subject}</TableCell>
                                <TableCell>
                                  <span className="text-xs flex items-center gap-1">
                                    {alloc.format.includes("Online") ? (
                                      <Monitor className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <MapPin className="h-3 w-3 text-orange-500" />
                                    )}
                                    {alloc.format}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {alloc.demoDate ? (
                                    <div>
                                      <p className="text-xs">{alloc.demoDate}</p>
                                      {alloc.demoOutcome === "positive" && (
                                        <Badge className="bg-green-100 text-green-700 text-[10px]" variant="secondary">Positive</Badge>
                                      )}
                                      {alloc.demoOutcome === "negative" && (
                                        <Badge className="bg-red-100 text-red-700 text-[10px]" variant="secondary">Negative</Badge>
                                      )}
                                      {alloc.demoOutcome === "pending" && (
                                        <Badge className="bg-amber-100 text-amber-700 text-[10px]" variant="secondary">Upcoming</Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Not scheduled</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={`text-[10px] ${statusConfig[alloc.status].color}`} variant="secondary">
                                    {statusConfig[alloc.status].label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {expandedRow === alloc.id ? (
                                      <ChevronUp className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>

                              {/* Expanded row */}
                              {expandedRow === alloc.id && (
                                <TableRow key={`${alloc.id}-detail`}>
                                  <TableCell colSpan={7} className="bg-gray-50 p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Schedule</p>
                                        <p className="text-sm mt-0.5 flex items-center gap-1.5">
                                          <Calendar className="h-3.5 w-3.5 text-teal-600" />
                                          {alloc.schedule}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Allocated On</p>
                                        <p className="text-sm mt-0.5">{alloc.allocatedOn}</p>
                                      </div>
                                      {alloc.sessionsCompleted !== undefined && (
                                        <div>
                                          <p className="text-xs text-muted-foreground font-medium">Sessions Completed</p>
                                          <p className="text-sm mt-0.5">{alloc.sessionsCompleted} sessions</p>
                                        </div>
                                      )}
                                      {alloc.parentRating && (
                                        <div>
                                          <p className="text-xs text-muted-foreground font-medium">Parent Rating</p>
                                          <p className="text-sm mt-0.5 flex items-center gap-1">
                                            {Array.from({ length: alloc.parentRating }).map((_, i) => (
                                              <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                            ))}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {alloc.status === "demo-completed" && alloc.demoOutcome === "positive" && (
                                        <Button
                                          size="sm"
                                          className="bg-teal-700 hover:bg-teal-800 text-xs"
                                          onClick={(e) => { e.stopPropagation(); handleConfirmBooking(alloc.id, alloc.childName); }}
                                        >
                                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                          Confirm Booking
                                        </Button>
                                      )}
                                      {alloc.status === "reassign-needed" && (
                                        <Button
                                          size="sm"
                                          className="bg-orange-600 hover:bg-orange-700 text-xs"
                                          onClick={(e) => { e.stopPropagation(); handleReassign(alloc.id, alloc.childName); }}
                                        >
                                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                          Assign New Tutor
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs"
                                        onClick={(e) => { e.stopPropagation(); handleContactParent(alloc.parentName); }}
                                      >
                                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                                        Message Parent
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <p className="text-muted-foreground">No allocations found</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </ConsultantDashboardLayout>
  );
};

export default TutorAllocations;
