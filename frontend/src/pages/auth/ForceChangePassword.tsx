import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/PageLayout";
import { authService } from "@/services/auth.service";
import { AxiosError } from "axios";

const schema = z.object({
  currentPassword: z.string().min(1, "Temporary password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

const ForceChangePassword = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  if (!email) {
    return (
      <PageLayout title="Password Change Required" description="">
        <div className="max-w-md mx-auto text-center py-12">
          <p className="text-muted-foreground mb-4">
            No email provided. Please go back to login.
          </p>
          <Button asChild>
            <Link to="/auth/login">Go to Login</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await authService.forceChangePassword(email, data.currentPassword, data.newPassword);
      toast({
        title: "Password updated!",
        description: "You can now log in with your new password.",
      });
      navigate("/auth/login", { replace: true });
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError.response?.data?.error?.message || "Failed to change password.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Set Your New Password"
      description="Your account was created with a temporary password. Please set a new password to continue."
    >
      <div className="max-w-md mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Account:</strong> {email}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Enter the temporary password you received, then choose a new password.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrent ? "text" : "password"}
                        placeholder="Enter temporary password"
                        {...field}
                        className="pl-10 pr-10"
                      />
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-3 text-muted-foreground"
                        tabIndex={-1}
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        placeholder="Choose a new password"
                        {...field}
                        className="pl-10 pr-10"
                      />
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-3 text-muted-foreground"
                        tabIndex={-1}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min 8 characters, one uppercase letter, one number
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      {...field}
                      className="pl-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Updating Password..." : "Set New Password"}
            </Button>
          </form>
        </Form>
      </div>
    </PageLayout>
  );
};

export default ForceChangePassword;
