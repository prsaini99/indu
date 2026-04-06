
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
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
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await resetPassword(data.email);
      
      toast({
        title: "Reset link sent!",
        description: "If an account exists with this email, you will receive a password reset link.",
      });
      
      // Redirect to login page after a delay
      setTimeout(() => navigate("/auth/login"), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem sending the reset link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout 
      title="Reset Your Password" 
      description="Enter your email address below and we'll send you a link to reset your password."
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
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>
            <div className="text-center mt-4">
              <p className="text-muted-foreground text-sm">
                Remember your password?{" "}
                <Link to="/auth/login" className="text-accent hover:underline">
                  Back to login
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </PageLayout>
  );
};

export default ForgotPassword;
