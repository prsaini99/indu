import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ConsultantDashboardLayout from "@/components/ConsultantDashboardLayout";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Bell, Shield, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { consultantService } from "@/services/user.service";

const ConsultantSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    loginEmail: "",
    contactEmail: "",
    phone: "",
  });

  const [notifications, setNotifications] = useState({
    newDemoRequests: true,
    demoScheduled: true,
    messageAlerts: true,
    parentFeedback: true,
    allocationUpdates: true,
    weeklyReport: false,
  });

  useEffect(() => {
    consultantService
      .getProfile()
      .then((data) => {
        setProfile({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          loginEmail: data.loginEmail || "",
          contactEmail: data.contactEmail || "",
          phone: data.phone || "",
        });
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await consultantService.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone || undefined,
        email: profile.contactEmail || undefined,
      });
      toast({ title: "Profile Updated", description: "Your account settings have been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    toast({ title: "Settings Saved", description: "Notification preferences updated." });
  };

  return (
    <ConsultantDashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-teal-800">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account, notifications, and security preferences.
          </p>
        </div>

        {/* Account */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-teal-500" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="bg-teal-600 text-white text-xl">
                      {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <div className="relative mt-1">
                      <Input
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="pl-9"
                      />
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <div className="relative mt-1">
                      <Input
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="pl-9"
                      />
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Login Email</label>
                    <div className="relative mt-1">
                      <Input
                        value={profile.loginEmail}
                        disabled
                        className="pl-9 bg-gray-50"
                      />
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Login email cannot be changed</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact Email</label>
                    <div className="relative mt-1">
                      <Input
                        value={profile.contactEmail}
                        onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                        placeholder="Contact email (optional)"
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
                <Button onClick={handleSaveProfile} className="bg-teal-600 hover:bg-teal-700" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-teal-500" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "newDemoRequests" as const, label: "New Demo Requests", desc: "Get notified when a parent submits a demo request" },
              { key: "demoScheduled" as const, label: "Demo Scheduled", desc: "Alerts when a demo class is confirmed or rescheduled" },
              { key: "messageAlerts" as const, label: "Message Alerts", desc: "Instant notifications for new messages" },
              { key: "parentFeedback" as const, label: "Parent Feedback", desc: "When a parent rates a tutor match" },
              { key: "allocationUpdates" as const, label: "Allocation Updates", desc: "Tutor acceptance, decline, or reassignment alerts" },
              { key: "weeklyReport" as const, label: "Weekly Summary", desc: "Weekly activity and performance report" },
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
              <Shield className="h-5 w-5 text-teal-500" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Change Password</p>
                <p className="text-xs text-muted-foreground">Update your account password</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangePasswordOpen(true)}
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

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </ConsultantDashboardLayout>
  );
};

export default ConsultantSettings;
