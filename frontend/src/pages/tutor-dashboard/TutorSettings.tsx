
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import TutorDashboardLayout from "@/components/TutorDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Bell, Shield, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TutorSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [notifications, setNotifications] = useState({
    newDemoRequests: true,
    classReminders: true,
    messageAlerts: true,
    parentFeedback: true,
    paymentUpdates: true,
    weeklyReport: false,
  });

  const handleSaveProfile = () => {
    toast({ title: "Profile Updated", description: "Your account settings have been saved." });
  };

  const handleSaveNotifications = () => {
    toast({ title: "Settings Saved", description: "Notification preferences updated." });
  };

  return (
    <TutorDashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-purple-800">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Account */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatar} alt={user?.fullName} />
                <AvatarFallback className="bg-purple-600 text-white text-xl">
                  {user?.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <div className="relative mt-1">
                  <Input
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="pl-9"
                  />
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="relative mt-1">
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="pl-9"
                  />
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <div className="relative mt-1">
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="pl-9"
                  />
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <Button onClick={handleSaveProfile} className="bg-purple-600 hover:bg-purple-700">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-500" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "newDemoRequests" as const, label: "New Demo Requests", desc: "Get notified when a consultant assigns you a demo" },
              { key: "classReminders" as const, label: "Class Reminders", desc: "Reminders before your scheduled classes" },
              { key: "messageAlerts" as const, label: "Message Alerts", desc: "Instant notifications for new messages" },
              { key: "parentFeedback" as const, label: "Parent Feedback", desc: "When a parent submits a review" },
              { key: "paymentUpdates" as const, label: "Payment Updates", desc: "Earnings and payment notifications" },
              { key: "weeklyReport" as const, label: "Weekly Summary", desc: "Weekly teaching activity summary" },
            ].map((item, index) => (
              <div key={item.key}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, [item.key]: checked })
                    }
                  />
                </div>
                {index < 5 && <Separator className="mt-3" />}
              </div>
            ))}
            <Button onClick={handleSaveNotifications} variant="outline">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Change Password</p>
                <p className="text-xs text-muted-foreground">Update your account password</p>
              </div>
              <Button variant="outline" size="sm"
                onClick={() => toast({ title: "Password", description: "Password change coming soon." })}
              >
                Change
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Delete Account</p>
                <p className="text-xs text-muted-foreground">Permanently delete your account</p>
              </div>
              <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => toast({ title: "Delete", description: "Account deletion requires confirmation.", variant: "destructive" })}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TutorDashboardLayout>
  );
};

export default TutorSettings;
