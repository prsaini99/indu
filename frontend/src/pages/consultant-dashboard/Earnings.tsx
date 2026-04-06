
import { useState } from "react";
import {
  Calendar as CalendarIcon,
  DollarSign
} from "lucide-react";
import ConsultantDashboardLayout from "@/components/ConsultantDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const monthlyRevenueData = [
  { month: "Jun 24", value: 30000 },
  { month: "Jul 24", value: 25000 },
  { month: "Aug 24", value: 35000 },
  { month: "Sep 24", value: 60000 },
  { month: "Oct 24", value: 40000 },
  { month: "Nov 24", value: 38000 },
  { month: "Dec 24", value: 50000 },
  { month: "Jan 25", value: 65000 },
  { month: "Feb 25", value: 45000 },
  { month: "Mar 25", value: 42000 },
  { month: "Apr 25", value: 48000 },
  { month: "May 25", value: 55000 }
];

const recentTransactions = [
  { id: 1, sessionTitle: "Business Strategy Review", format: "Video Call", type: "1-on-1", duration: "60 min", amount: "Rs. 3,500", date: "12-07-2024", status: "Completed" },
  { id: 2, sessionTitle: "Financial Planning Consultation", format: "Video Call", type: "1-on-1", duration: "45 min", amount: "Rs. 2,500", date: "09-07-2024", status: "Completed" },
  { id: 3, sessionTitle: "Digital Transformation Workshop", format: "Group Call", type: "Group", duration: "90 min", amount: "Rs. 8,000", date: "28-06-2024", status: "Completed" },
  { id: 4, sessionTitle: "Career Guidance Session", format: "Phone Call", type: "1-on-1", duration: "30 min", amount: "Rs. 1,500", date: "17-06-2024", status: "Completed" },
  { id: 5, sessionTitle: "Startup Mentoring", format: "Video Call", type: "1-on-1", duration: "60 min", amount: "Rs. 4,000", date: "16-06-2024", status: "Pending" },
];

const ConsultantEarnings = () => {
  return (
    <ConsultantDashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-teal-800">Earnings</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and track your consulting revenue</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <Card className="bg-white shadow-sm md:col-span-5 rounded-xl">
            <CardContent className="p-6">
              <div>
                <h2 className="text-5xl font-bold text-gray-900">₹5.33 Lac</h2>
                <p className="text-sm text-gray-500 mt-1">Earned Till Now</p>
              </div>
              <div className="mt-6 mb-3 h-16 relative">
                <div className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { x: 1, y: 30 }, { x: 2, y: 60 }, { x: 3, y: 20 },
                      { x: 4, y: 40 }, { x: 5, y: 70 }, { x: 6, y: 90 }
                    ]}>
                      <defs>
                        <linearGradient id="consultantGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0D9488" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="y" stroke="#000" strokeWidth={2} fill="url(#consultantGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute top-0 right-0 bg-white rounded-lg border border-green-100 px-2 py-1">
                  <span className="text-green-500 text-sm font-medium">+18%</span>
                </div>
              </div>
              <div className="flex items-center text-green-500 text-sm font-medium">
                <span className="mr-1">+18% Revenue</span>
                <span className="text-gray-500 font-normal">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm md:col-span-7 rounded-xl">
            <CardContent className="p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Monthly Revenue Overview</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickMargin={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(value) => `₹ ${value / 1000}k`} domain={[0, 100000]} ticks={[0, 25000, 50000, 75000, 100000]} />
                    <Tooltip formatter={(value) => [`₹ ${value}`, "Revenue"]} contentStyle={{ backgroundColor: "#fff", borderRadius: "0.375rem", border: "1px solid #f0f0f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }} />
                    <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">This Month</h3>
                  <div className="mt-1">
                    <h2 className="text-2xl font-bold">₹ 55,000</h2>
                    <p className="text-xs text-gray-500 mt-1">12 Sessions Completed</p>
                  </div>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <CalendarIcon className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Previous Month</h3>
                  <div className="mt-1">
                    <h2 className="text-2xl font-bold">₹ 48,000</h2>
                    <p className="text-xs text-gray-500 mt-1">10 Sessions Completed</p>
                  </div>
                </div>
                <div className="bg-teal-100 p-3 rounded-full">
                  <DollarSign className="h-5 w-5 text-teal-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <Card className="bg-white shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[120px] h-9 bg-white border border-gray-200 rounded-lg">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sort by</SelectItem>
                    <SelectItem value="amount-high">Amount High-Low</SelectItem>
                    <SelectItem value="amount-low">Amount Low-High</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium text-gray-700">Session Title</TableHead>
                      <TableHead className="font-medium text-gray-700">Format</TableHead>
                      <TableHead className="font-medium text-gray-700">Type</TableHead>
                      <TableHead className="font-medium text-gray-700">Duration</TableHead>
                      <TableHead className="font-medium text-gray-700">Amount</TableHead>
                      <TableHead className="font-medium text-gray-700">Date</TableHead>
                      <TableHead className="font-medium text-gray-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.sessionTitle}</TableCell>
                        <TableCell>{transaction.format}</TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>{transaction.duration}</TableCell>
                        <TableCell>{transaction.amount}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>
                          <Badge
                            className={`
                              ${transaction.status === 'Completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                              ${transaction.status === 'Pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}
                            `}
                            variant="outline"
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ConsultantDashboardLayout>
  );
};

export default ConsultantEarnings;
