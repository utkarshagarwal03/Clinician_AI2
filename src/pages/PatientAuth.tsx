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
import { Heart, Calendar, FileText, Search, Clock, Shield } from "lucide-react";

const PatientAuth = () => {
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

      // Set user role as patient
      if (data.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: "patient",
          });

        if (roleError) {
          console.error("Error setting patient role:", roleError);
        }
      }

      toast.success("Patient account created successfully! Please check your email to confirm.");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create patient account");
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

      // Verify user is a patient
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleData?.role !== "patient") {
          await supabase.auth.signOut();
          toast.error("Access denied. This account is not authorized for patient access.");
          return;
        }
      }

      toast.success("Welcome back!");
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
      
      <div className="flex-1 flex items-center justify-center px-4 py-24 bg-gradient-to-br from-green-50 via-background to-emerald-50">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Patient features */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="mx-auto lg:mx-0 p-4 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl w-fit mb-4">
                <Heart className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Patient Portal
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Manage your health records, book appointments, and access medical services
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Book Appointments</h3>
                  <p className="text-sm text-gray-600">Schedule with your preferred doctors</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Medical Records</h3>
                  <p className="text-sm text-gray-600">View your health history and prescriptions</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                <Search className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Symptom Checker</h3>
                  <p className="text-sm text-gray-600">AI-powered health assessment</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Prescription Verification</h3>
                  <p className="text-sm text-gray-600">Verify your medication authenticity</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-gray-900">24/7 Health Support</h3>
              </div>
              <p className="text-gray-700">
                Access your health information anytime, anywhere. Our secure platform ensures your medical data is protected and easily accessible when you need it most.
              </p>
            </div>
          </div>

          {/* Right side - Login form */}
          <Card className="w-full max-w-md shadow-xl animate-fade-in">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl text-green-900">Patient Access</CardTitle>
              <CardDescription>
                Sign in to your patient account or create a new one to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email Address</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-green-200 focus:border-green-500"
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
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                      {loading ? "Signing in..." : "Access Patient Portal"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email Address</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div className="text-xs text-gray-600 bg-green-50 p-3 rounded-lg">
                      <strong>Quick Setup:</strong> After creating your account, you can immediately start booking appointments and accessing health services.
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                      {loading ? "Creating account..." : "Create Patient Account"}
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

export default PatientAuth;
