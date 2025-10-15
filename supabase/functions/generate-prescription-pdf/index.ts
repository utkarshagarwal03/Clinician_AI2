import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PDF generation request received');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { prescriptionId } = await req.json();
    console.log('Generating PDF for prescription ID:', prescriptionId);

    // Fetch prescription details - use simple query first
    const { data: prescriptionData, error: prescError } = await supabaseClient
      .from('prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .single();

    if (prescError || !prescriptionData) {
      console.error('Prescription fetch error:', prescError);
      throw new Error(`Prescription not found: ${prescError?.message || 'Unknown error'}`);
    }

    // Fetch doctor information separately
    let doctorInfo = null;
    if (prescriptionData.doctor_id) {
      const { data: doctorData } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', prescriptionData.doctor_id)
        .single();

      if (doctorData) {
        const { data: credentialsData } = await supabaseClient
          .from('doctor_credentials')
          .select('specialization')
          .eq('user_id', prescriptionData.doctor_id)
          .single();

        doctorInfo = {
          profiles: doctorData,
          doctor_credentials: credentialsData
        };
      }
    }

    // Combine the data
    const prescription = {
      ...prescriptionData,
      doctor: doctorInfo
    };

    const verifyUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/verify?id=${prescriptionId}`;
    console.log('Verify URL:', verifyUrl);
    
    // Generate QR code SVG
    const qrSvg = await generateQRCode(verifyUrl);
    console.log('QR code generated successfully');

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
              <span class="info-label">Prescription ID:</span> ${prescriptionId.slice(0, 8)}
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

    console.log('HTML generated successfully, length:', html.length);
    
    return new Response(
      JSON.stringify({ html, prescriptionId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating prescription PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate prescription' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateQRCode(data: string): Promise<string> {
  try {
    console.log('Generating QR code for:', data);
    // Simple QR code generation using a free API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
    console.log('QR API URL:', qrApiUrl);
    return `<img src="${qrApiUrl}" alt="QR Code" style="width: 150px; height: 150px;" />`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return `<div style="width: 150px; height: 150px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">QR Code Error</div>`;
  }
}