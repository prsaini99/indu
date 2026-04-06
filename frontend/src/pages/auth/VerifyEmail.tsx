import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/PageLayout";
import { authService } from "@/services/auth.service";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    // Prevent React StrictMode from calling the API twice
    if (calledRef.current) return;
    calledRef.current = true;

    authService
      .verifyEmail(token)
      .then((result) => {
        setStatus("success");
        setMessage(result.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.error?.message ||
            "Verification failed. The link may be expired or already used."
        );
      });
  }, [token]);

  return (
    <PageLayout title="Email Verification" description="">
      <div className="max-w-md mx-auto text-center py-12">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-semibold">Email Verified!</h2>
            <p className="text-muted-foreground">{message}</p>
            <Button asChild className="w-full">
              <Link to="/auth/login">Log In to Your Account</Link>
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-semibold">Verification Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth/signup">Back to Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default VerifyEmail;
