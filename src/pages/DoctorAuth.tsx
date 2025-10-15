import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Stethoscope, UserCheck, Shield, GraduationCap } from "lucide-react";

const DoctorAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      // Set user role as doctor
      if (data.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: "doctor",
          });

        if (roleError) {
          console.error("Error setting doctor role:", roleError);
        }
      }

      toast.success("Doctor account created successfully! Please check your email to confirm.");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create doctor account");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify user is a doctor
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleData?.role !== "doctor") {
          await supabase.auth.signOut();
          toast.error("Access denied. This account is not authorized for doctor access.");
          return;
        }
      }

      toast.success("Welcome back, Doctor!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-24 bg-gradient-to-br from-blue-50 via-background to-indigo-50">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Doctor features */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="mx-auto lg:mx-0 p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl w-fit mb-4">
                <Stethoscope className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Doctor Portal
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Access your medical practice tools and patient management system
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                <UserCheck className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Patient Management</h3>
                  <p className="text-sm text-gray-600">View and manage patient records</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Prescription Tools</h3>
                  <p className="text-sm text-gray-600">Create and verify prescriptions</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                <GraduationCap className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Medical Records</h3>
                  <p className="text-sm text-gray-600">Access comprehensive patient history</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                <Stethoscope className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Appointment System</h3>
                  <p className="text-sm text-gray-600">Manage your schedule and consultations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <Card className="w-full max-w-md shadow-xl animate-fade-in">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl text-blue-900">Doctor Access</CardTitle>
              <CardDescription>
                Sign in to your doctor account or register for medical practice access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Medical Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="doctor@clinic.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                      {loading ? "Signing in..." : "Access Doctor Portal"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Medical Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="doctor@clinic.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a secure password (min 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <strong>Doctor Registration:</strong> You'll need to provide medical credentials and license verification after account creation.
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                      {loading ? "Creating account..." : "Register as Doctor"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DoctorAuth;
