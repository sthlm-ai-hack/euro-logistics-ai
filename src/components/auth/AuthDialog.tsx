import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignUpForm } from "./SignUpForm";
import { SignInForm } from "./SignInForm";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: "signin" | "signup";
}

export const AuthDialog = ({ open, onOpenChange, defaultView = "signin" }: AuthDialogProps) => {
  const [view, setView] = useState<"signin" | "signup">(defaultView);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {view === "signin" ? "Sign In" : "Create Account"}
          </DialogTitle>
          <DialogDescription>
            {view === "signin" 
              ? "Welcome back! Sign in to your RouteAI account." 
              : "Join RouteAI and start optimizing your logistics today."
            }
          </DialogDescription>
        </DialogHeader>
        
        {view === "signin" ? (
          <SignInForm onClose={handleClose} />
        ) : (
          <SignUpForm onClose={handleClose} />
        )}
        
        <div className="text-center text-sm text-muted-foreground">
          {view === "signin" ? (
            <>
              Don't have an account?{" "}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("signup")}
                className="p-0 h-auto font-medium text-primary hover:text-primary/80"
              >
                Sign up
              </Button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("signin")}
                className="p-0 h-auto font-medium text-primary hover:text-primary/80"
              >
                Sign in
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};