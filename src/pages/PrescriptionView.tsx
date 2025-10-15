import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Download, Loader2, QrCode } from "lucide-react";

const PrescriptionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [prescription, setPrescription] = useState<any>(null);
  const [pdfHtml, setPdfHtml] = useState<string>("");

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    try {
      console.log("Fetching prescription with ID:", id);
      
      // Get current user info for debugging
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user:", user?.id);
      
      // Check user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .single();
      console.log("User role:", roleData?.role);

      // First, try to get the basic prescription data
      let prescriptionData;
      const { data: initialData, error: prescriptionError } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("id", id)
        .single();

      if (prescriptionError) {
        console.error("Prescription fetch error:", prescriptionError);
        
        // If the first query failed due to RLS, try using the "verify" policy
        console.log("Trying with verify policy...");
        const { data: verifyData, error: verifyError } = await supabase
          .from("prescriptions")
          .select("*")
          .eq("id", id)
          .single();

        if (verifyError) {
          throw prescriptionError; // Throw original error
        }
        
        console.log("Prescription found via verify policy:", verifyData);
        prescriptionData = verifyData;
      } else {
        prescriptionData = initialData;
      }

      console.log("Prescription data:", prescriptionData);

      // Then fetch doctor information separately
      let doctorInfo = null;
      if (prescriptionData.doctor_id) {
        const { data: doctorData, error: doctorError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", prescriptionData.doctor_id)
          .single();

        if (!doctorError && doctorData) {
          // Get doctor credentials
          const { data: credentialsData } = await supabase
            .from("doctor_credentials")
            .select("specialization")
            .eq("user_id", prescriptionData.doctor_id)
            .single();

          doctorInfo = {
            profiles: doctorData,
            doctor_credentials: credentialsData
          };
        }
      }

      // Combine the data
      const combinedData = {
        ...prescriptionData,
        doctor: doctorInfo
      };

      console.log("Combined prescription data:", combinedData);
      setPrescription(combinedData);
    } catch (error: any) {
      console.error("Error fetching prescription:", error);
      toast({
        title: "Error",
        description: `Failed to load prescription: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      console.log("Generating PDF locally for prescription:", id);
      
      if (!prescription) {
        throw new Error("No prescription data available");
      }

      // Generate QR code URL
      const verifyUrl = `${window.location.origin}/verify?id=${id}`;
      console.log("Verify URL:", verifyUrl);
      
      // Generate QR code using a free API
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
      const qrSvg = `<img src="${qrApiUrl}" alt="QR Code" style="width: 150px; height: 150px;" />`;

      // Create HTML template for PDF
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; }
            .section { margin: 20px 0; }
            .section h3 { color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .medicine-item { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; }
            .qr-code { text-align: center; margin: 20px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { padding: 5px 0; }
            .info-label { font-weight: bold; color: #374151; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Medical Prescription</h1>
            <p style="color: #6b7280; margin-top: 10px;">Healthcare Management System</p>
          </div>

          <div class="section">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Doctor:</span> ${prescription.doctor?.profiles?.full_name || 'N/A'}
              </div>
              <div class="info-item">
                <span class="info-label">Specialization:</span> ${prescription.doctor?.doctor_credentials?.specialization || 'N/A'}
              </div>
              <div class="info-item">
                <span class="info-label">Patient:</span> ${prescription.patient_name}
              </div>
              <div class="info-item">
                <span class="info-label">Age:</span> ${prescription.patient_age} years
              </div>
              <div class="info-item">
                <span class="info-label">Date:</span> ${new Date(prescription.prescription_date).toLocaleDateString()}
              </div>
              <div class="info-item">
                <span class="info-label">Prescription ID:</span> ${id?.slice(0, 8)}
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Diagnosis</h3>
            <p>${prescription.diagnosis}</p>
          </div>

          <div class="section">
            <h3>Prescribed Medicines</h3>
            ${prescription.medicines.map((med: any) => `
              <div class="medicine-item">
                <strong>${med.name}</strong> - ${med.dosage}
              </div>
            `).join('')}
          </div>

          ${prescription.advice ? `
            <div class="section">
              <h3>Doctor's Advice</h3>
              <p>${prescription.advice}</p>
            </div>
          ` : ''}

          <div class="footer">
            <div class="qr-code">
              ${qrSvg}
              <p style="margin-top: 10px; color: #6b7280; font-size: 12px;">Scan to verify prescription authenticity</p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
              This is a computer-generated prescription. For verification, scan the QR code above.
            </p>
          </div>
        </body>
        </html>
      `;

      console.log("HTML generated successfully, length:", html.length);
      setPdfHtml(html);
      
      // Open in new window for printing/saving
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Auto-trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast({
        title: "Success",
        description: "Prescription PDF generated. You can now print or save it.",
      });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: `Failed to generate PDF: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-lg font-semibold mb-2">Prescription not found</p>
              <p className="text-muted-foreground mb-4">
                The prescription with ID "{id}" could not be found.
              </p>
              <div className="space-y-2">
                <Button onClick={() => navigate("/dashboard")} className="w-full">
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Prescription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prescription Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Doctor</p>
                <p className="font-medium">{prescription.doctor?.profiles?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Specialization</p>
                <p className="font-medium">{prescription.doctor?.doctor_credentials?.specialization || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-medium">{prescription.patient_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{prescription.patient_age} years</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(prescription.prescription_date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <h3 className="font-semibold mb-2">Diagnosis</h3>
              <p className="text-muted-foreground">{prescription.diagnosis}</p>
            </div>

            {/* Medicines */}
            <div>
              <h3 className="font-semibold mb-2">Prescribed Medicines</h3>
              <div className="space-y-2">
                {prescription.medicines.map((med: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-muted-foreground">{med.dosage}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Advice */}
            {prescription.advice && (
              <div>
                <h3 className="font-semibold mb-2">Doctor's Advice</h3>
                <p className="text-muted-foreground">{prescription.advice}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button onClick={generatePDF} disabled={generating} className="flex-1">
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/verify?id=${id}`)}>
                <QrCode className="mr-2 h-4 w-4" />
                View QR
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PrescriptionView;