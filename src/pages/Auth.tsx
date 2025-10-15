import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Heart, Stethoscope, User } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate("/dashboard");
        }
      });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mx-auto p-4 bg-gradient-to-br from-primary to-secondary rounded-xl w-fit mb-6">
              <Heart className="h-12 w-12 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to ClinicianAI
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose your role to access the appropriate portal for your healthcare needs
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Patient Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-green-200">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <User className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-2xl text-green-900">Patient Portal</CardTitle>
                <CardDescription className="text-gray-600">
                  Access your health records, book appointments, and manage your medical care
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Book doctor appointments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>View medical history</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Access prescriptions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>AI symptom checker</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => navigate("/auth/patient")}
                >
                  Access Patient Portal
                </Button>
              </CardContent>
            </Card>

            {/* Doctor Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-200">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Doctor Portal</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your practice, view patients, and access medical tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Patient management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Create prescriptions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Medical records access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Appointment scheduling</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate("/auth/doctor")}
                >
                  Access Doctor Portal
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm">
              Need help choosing? Contact our support team for assistance.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
