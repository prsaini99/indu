import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ParentDashboardLayout from "@/components/ParentDashboardLayout";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Bell, Shield, Camera, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/user.service";

const ParentSettings = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
  });

  const [notifications, setNotifications] = useState({
    demoReminders: true,
    assessmentResults: true,
    creditAlerts: true,
    tutorMessages: true,
    weeklyProgress: false,
    promotionalEmails: false,
  });

  useEffect(() => {
    userService
      .getParentProfile()
      .then((data) => {
        setProfile({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          country: data.country || "",
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
      await userService.updateParentProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone || undefined,
        address: profile.address || undefined,
        city: profile.city || undefined,
        country: profile.country || undefined,
      });
      await refreshProfile();
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    toast({ title: "Notification Settings Updated", description: "Your notification preferences have been saved." });
  };

  return (
    <ParentDashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-indigo-800">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="bg-indigo-600 text-white text-xl">
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
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative mt-1">
                      <Input
                        value={profile.email}
                        disabled
                        className="pl-9 bg-gray-50"
                      />
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
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
                  <div>
                    <label className="text-sm font-medium">Address</label>
                    <div className="relative mt-1">
                      <Input
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="Street address"
                        className="pl-9"
                      />
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">City</label>
                    <div className="relative mt-1">
                      <Input
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        placeholder="City"
                        className="pl-9"
                      />
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Country</label>
                    <div className="relative mt-1">
                      <Input
                        value={profile.country}
                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                        placeholder="Country"
                        className="pl-9"
                      />
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
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

        {/* Notification Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-500" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "demoReminders" as const, label: "Demo Class Reminders", desc: "Get notified before scheduled demo classes" },
              { key: "assessmentResults" as const, label: "Assessment Results", desc: "Receive alerts when new results are available" },
              { key: "creditAlerts" as const, label: "Credit Balance Alerts", desc: "Notify when credits are low or transactions occur" },
              { key: "tutorMessages" as const, label: "Tutor Messages", desc: "Instant notifications for messages from tutors" },
              { key: "weeklyProgress" as const, label: "Weekly Progress Reports", desc: "Receive weekly summary of children's progress" },
              { key: "promotionalEmails" as const, label: "Promotional Emails", desc: "Updates about new features and offers" },
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

            <Button onClick={handleSaveNotifications} variant="outline" className="mt-2">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" />
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
                <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => toast({ title: "Account Deletion", description: "This action requires confirmation. Feature coming soon.", variant: "destructive" })}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </ParentDashboardLayout>
  );
};

export default ParentSettings;
