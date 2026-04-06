
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Bell, Database, Mail, Globe } from "lucide-react";

const SystemSettings = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure platform settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Platform Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input id="platform-name" defaultValue="Indu AE" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-url">Platform URL</Label>
                  <Input id="platform-url" defaultValue="https://induae.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input id="support-email" defaultValue="support@induae.com" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <Switch id="maintenance-mode" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="registration">New User Registration</Label>
                  <Switch id="registration" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="class-creation">Class Creation</Label>
                  <Switch id="class-creation" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="payment-processing">Payment Processing</Label>
                  <Switch id="payment-processing" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="live-chat">Live Chat Support</Label>
                  <Switch id="live-chat" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="two-factor">Require Two-Factor Authentication</Label>
                  <Switch id="two-factor" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password-strength">Strong Password Requirements</Label>
                  <Switch id="password-strength" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input id="session-timeout" type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-attempts">Max Login Attempts</Label>
                  <Input id="login-attempts" type="number" defaultValue="5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rate-limiting">API Rate Limiting</Label>
                  <Switch id="rate-limiting" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input id="api-key" type="password" defaultValue="**********************" />
                </div>
                <Button variant="outline" className="w-full">
                  Regenerate API Key
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Email Notifications</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-user">New User Registration</Label>
                    <Switch id="new-user" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enrollment">Enrollments</Label>
                    <Switch id="enrollment" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payment-success">Payment Success</Label>
                    <Switch id="payment-success" defaultChecked />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">System Alerts</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-errors">System Errors</Label>
                    <Switch id="system-errors" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="server-issues">Server Issues</Label>
                    <Switch id="server-issues" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance">Maintenance Alerts</Label>
                    <Switch id="maintenance" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Database Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db-host">Database Host</Label>
                  <Input id="db-host" defaultValue="localhost" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-port">Port</Label>
                  <Input id="db-port" defaultValue="5432" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-name">Database Name</Label>
                  <Input id="db-name" defaultValue="induae" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-user">Username</Label>
                  <Input id="db-user" defaultValue="admin" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Test Connection</Button>
                <Button>Update Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input id="smtp-host" defaultValue="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input id="smtp-port" defaultValue="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input id="smtp-user" defaultValue="noreply@induae.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">SMTP Password</Label>
                  <Input id="smtp-pass" type="password" defaultValue="************" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="smtp-ssl">Use SSL/TLS</Label>
                <Switch id="smtp-ssl" defaultChecked />
              </div>
              <Button variant="outline">Send Test Email</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Third-party Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Payment Gateways</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stripe">Stripe</Label>
                    <Switch id="stripe" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="paypal">PayPal</Label>
                    <Switch id="paypal" defaultChecked />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Communication</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="zoom">Zoom Integration</Label>
                    <Switch id="zoom" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slack">Slack Notifications</Label>
                    <Switch id="slack" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset to Defaults</Button>
        <Button className="bg-gray-800 hover:bg-gray-900">
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;
