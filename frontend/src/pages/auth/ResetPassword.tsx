import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
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

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <PageLayout title="Reset Password" description="">
        <div className="max-w-md mx-auto text-center py-12">
          <p className="text-muted-foreground mb-4">
            Invalid or missing reset token. Please request a new password reset link.
          </p>
          <Button asChild>
            <Link to="/auth/forgot-password">Request New Link</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await authService.resetPassword(token, data.newPassword);
      toast({
        title: "Password reset successful!",
        description: "You can now log in with your new password.",
      });
      navigate("/auth/login", { replace: true });
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError.response?.data?.error?.message || "Failed to reset password. The link may be expired.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Set New Password"
      description="Enter your new password below."
    >
      <div className="max-w-md mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        {...field}
                        className="pl-10 pr-10"
                      />
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>

            <div className="text-center mt-4">
              <Link to="/auth/login" className="text-sm text-accent hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </PageLayout>
  );
};

export default ResetPassword;
