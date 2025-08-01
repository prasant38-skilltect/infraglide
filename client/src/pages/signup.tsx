import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Shield, UserPlus, Folder, ArrowRight } from "lucide-react";
import { signupSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import CreateProjectModal from "@/components/modals/create-project-modal";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<"account" | "project">("account");
  const [userData, setUserData] = useState<any>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("/api/auth/signup", {
        method: "POST",
        body: values,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Signup failed");
      }

      const data = await response.json();
      
      // Store user data for project creation step
      setUserData(data);
      
      // Store authentication data temporarily
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("session_id", data.sessionId);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Move to project creation step
      setSignupStep("project");
      setShowProjectModal(true);

    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "An error occurred during signup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectCreation = async (projectData: { name: string; description: string }) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("/api/projects", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: projectData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Project creation failed");
      }

      const project = await response.json();

      toast({
        title: "Welcome to InfraGlide!",
        description: `Account created and project "${project.name}" set up successfully.`,
      });

      // Redirect to dashboard
      setLocation("/");
    } catch (error) {
      toast({
        title: "Project creation failed",
        description: error instanceof Error ? error.message : "Failed to create your first project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          {/* Step indicator */}
          {signupStep === "project" && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="w-3 h-3" />
                </div>
                Account Created
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <Folder className="w-3 h-3" />
                </div>
                Create Project
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-purple-600">InfraGlide</h1>
          </div>
          <CardTitle className="text-2xl">
            {signupStep === "account" ? "Create your account" : "Create Your Project"}
          </CardTitle>
          <CardDescription>
            {signupStep === "account" 
              ? "Sign up to start managing your cloud infrastructure"
              : "Set up your first project to organize your infrastructure resources"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signupStep === "account" && (
            <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="John Doe"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="john.doe@example.com"
                        disabled={isLoading}
                      />
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
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Create Account</span>
                  </div>
                )}
              </Button>
              </form>
            </Form>

            <div className="mt-6">
              <Separator />
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-purple-600 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
            </>
          )}

          {signupStep === "project" && (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Account Created Successfully!
                </h3>
                <p className="text-sm text-gray-600">
                  Welcome to InfraGlide, {userData?.user?.fullName}!
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                  The project creation modal will open automatically to complete your setup.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Project Creation Modal */}
      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => {}} // Prevent closing - mandatory step
        onSubmit={handleProjectCreation}
        isSubmitting={isLoading}
        isSignupFlow={true}
      />
    </div>
  );
}