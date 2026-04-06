
import { useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Mail, User, CheckCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { AxiosError } from "axios";

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
});

type SignUpFormValues = z.infer<typeof signupSchema>;

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { signup } = useAuth();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
  });

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const onSubmit = async (data: SignUpFormValues) => {
    setIsSubmitting(true);
    try {
      await signup(data.firstName, data.lastName, data.email, data.password);
      setSubmittedEmail(data.email);
      setSignupComplete(true);
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const message = axiosError.response?.data?.error?.message || "There was a problem creating your account. Please try again.";
      toast({
        title: "Error creating account",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (signupComplete) {
    return (
      <PageLayout title="Check Your Email" description="">
        <div className="max-w-md mx-auto text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-3">Account Created!</h2>
          <p className="text-muted-foreground mb-2">
            We've sent a verification link to:
          </p>
          <p className="font-medium text-lg mb-6">{submittedEmail}</p>
          <p className="text-sm text-muted-foreground mb-8">
            Please check your inbox and click the verification link to activate your account.
            The link expires in 24 hours.
          </p>
          <Link
            to="/auth/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-full"
          >
            Go to Login
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Create Your Account"
      description="Join Indu AE as a parent to discover live online classes for your children taught by inspiring teachers."
    >
      <div className="max-w-md mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Min 8 characters, one uppercase letter, one number
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      I agree to the{" "}
                      <Link to="/terms" className="text-accent hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-accent hover:underline">
                        Privacy Policy
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="text-center mt-4">
              <p className="text-muted-foreground text-sm">
                Already have an account?{" "}
                <Link to="/auth/login" className="text-accent hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </div>

    </PageLayout>
  );
};

export default SignUp;
