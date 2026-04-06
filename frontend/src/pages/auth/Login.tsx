
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Mail, User } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { AxiosError } from "axios";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const getRoleDashboard = (role: string) => {
  switch (role) {
    case "admin": return "/admin";
    case "tutor": return "/tutor-dashboard";
    case "consultant": return "/consultant-dashboard";
    case "parent": return "/parent-dashboard";
    default: return "/student-dashboard";
  }
};

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login, isLoading, user, isAuthenticated } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      navigate(getRoleDashboard(user.role), { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);
      toast({ title: "Login successful!", description: "Welcome back to Indu AE." });
      // Navigation handled by useEffect above once user state updates
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { code?: string; message?: string } }>;
      const code = axiosError.response?.data?.error?.code;
      const message = axiosError.response?.data?.error?.message || "Invalid email or password.";

      if (code === "EMAIL_NOT_VERIFIED") {
        toast({
          title: "Email not verified",
          description: "Please check your inbox and click the verification link before logging in.",
          variant: "destructive",
        });
      } else if (code === "PASSWORD_CHANGE_REQUIRED") {
        toast({
          title: "Password change required",
          description: "You need to set a new password before logging in.",
        });
        navigate("/auth/force-change-password", { state: { email: data.email } });
      } else {
        toast({
          title: "Login failed",
          description: message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <PageLayout
      title="Welcome Back"
      description="Log in to your Indu AE account to access your classes and continue your learning journey."
    >
      <div className="max-w-md mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="your.email@example.com"
                        {...field}
                        className="pl-10"
                      />
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      to="/auth/forgot-password"
                      className="text-sm text-accent hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...field}
                        className="pl-10 pr-10"
                      />
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-3 text-muted-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </Button>
            <div className="text-center mt-4">
              <p className="text-muted-foreground text-sm">
                Don't have an account yet?{" "}
                <Link to="/auth/signup" className="text-accent hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </Form>

        {/* Quick login buttons */}
        <div className="mt-8 pt-6 border-t">
          <p className="text-xs text-muted-foreground text-center mb-3">Quick Login (Dev Only)</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Parent", email: "testparent@induae.com", color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
              { label: "Tutor", email: "testtutor@induae.com", color: "bg-teal-100 text-teal-700 hover:bg-teal-200" },
              { label: "Consultant", email: "testconsultant@induae.com", color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
              { label: "Admin", email: "testadmin@induae.com", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
              { label: "Super Admin", email: "admin@induae.com", color: "bg-red-100 text-red-700 hover:bg-red-200" },
            ].map((acc) => (
              <Button
                key={acc.label}
                type="button"
                variant="ghost"
                size="sm"
                className={`text-xs font-medium ${acc.color}`}
                disabled={isLoading}
                onClick={async () => {
                  const password = acc.email === "admin@induae.com" ? "Admin123!" : "Test123!";
                  try {
                    await login(acc.email, password);
                    toast({ title: `Logged in as ${acc.label}` });
                  } catch {
                    toast({
                      title: "Quick login failed",
                      description: `Run "npx prisma db seed" to create test accounts.`,
                      variant: "destructive",
                    });
                  }
                }}
              >
                {acc.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Login;
