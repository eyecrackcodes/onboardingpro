"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { use } from "react";

export default function OfferSignPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string>("");
  const [candidateName, setCandidateName] = useState<string>("");
  const [projectedStartDate, setProjectedStartDate] = useState<string>("");
  const [signed, setSigned] = useState(false);
  const [sigCanvas, setSigCanvas] = useState<SignatureCanvas | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOfferData();
  }, [id]);

  const fetchOfferData = async () => {
    try {
      console.log("[OfferPage] Fetching offer data for candidate ID:", id);

      // Check if the offers collection exists first
      const offerRef = doc(db, "offers", id);
      console.log("[OfferPage] Looking for document at path:", `offers/${id}`);

      const offerDoc = await getDoc(offerRef);
      console.log("[OfferPage] Document exists:", offerDoc.exists());

      if (!offerDoc.exists()) {
        console.error("[OfferPage] Offer document not found in Firestore");
        console.log("[OfferPage] Attempted to find document with ID:", id);
        console.log("[OfferPage] Document path:", offerRef.path);

        // Try to provide more helpful error info
        throw new Error(
          `Offer not found for candidate ID: ${id}. Please ensure the offer was sent successfully.`
        );
      }

      const offerData = offerDoc.data();
      console.log("[OfferPage] Found offer data:", offerData);

      if (!offerData) {
        throw new Error("Offer data is empty");
      }

      setTemplateId(offerData.templateId || "");
      setCandidateName(offerData.candidateName || "");

      // Use the formatted start date if available, otherwise format the raw date
      if (offerData.formattedStartDate) {
        console.log(
          "[OfferPage] Using pre-formatted start date:",
          offerData.formattedStartDate
        );
        setProjectedStartDate(offerData.formattedStartDate);
      } else if (offerData.projectedStartDate) {
        console.log(
          "[OfferPage] Formatting raw start date:",
          offerData.projectedStartDate
        );
        const startDate = offerData.projectedStartDate.toDate
          ? offerData.projectedStartDate.toDate()
          : new Date(offerData.projectedStartDate);
        const formatted = startDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        console.log("[OfferPage] Formatted start date:", formatted);
        setProjectedStartDate(formatted);
      } else {
        console.log("[OfferPage] No start date found, using TBD");
        setProjectedStartDate("TBD");
      }

      setSigned(offerData.signed || false);

      // Load the PDF template
      const pdfPath = `/offer-templates/${offerData.templateId}.pdf`;
      console.log("[OfferPage] Loading PDF template from:", pdfPath);
      setPdfUrl(pdfPath);

      console.log("[OfferPage] ✅ Offer data loaded successfully:", {
        candidateName: offerData.candidateName,
        projectedStartDate: projectedStartDate,
        formattedStartDate: offerData.formattedStartDate,
        templateId: offerData.templateId,
        signed: offerData.signed,
        pdfPath,
      });
    } catch (error) {
      console.error("[OfferPage] ❌ Error fetching offer data:", error);

      // Show more specific error message
      if (error instanceof Error) {
        alert(`Failed to load offer: ${error.message}`);
      } else {
        alert(
          "Failed to load offer. Please check that the offer was sent successfully."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    sigCanvas?.clear();
  };

  const handleSubmit = async () => {
    if (sigCanvas?.isEmpty()) {
      alert("Please provide signature");
      return;
    }
    if (!pdfUrl) return;
    setIsSubmitting(true);
    try {
      console.log("Starting signature submission...");

      // Load the PDF
      console.log("Loading PDF from:", pdfUrl);
      const response = await fetch(pdfUrl);
      const pdfBytes = await response.arrayBuffer();
      console.log("PDF loaded successfully");

      // Modify the PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Embed font for text
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      console.log("Embedding candidate data:", {
        candidateName,
        projectedStartDate,
      });

      // Get PDF page dimensions for better positioning
      const { width, height } = firstPage.getSize();
      console.log("PDF dimensions:", { width, height });

      // More precise positioning based on DigitalBGA template
      // Standard letter size is 612 x 792 points
      let nameX = 60; // After "Dear " on line 3
      let nameY = height - 145; // Line 3 position (~145 points from top)
      let dateX = 260; // After "8:00AM CST on " - adjusted right
      let dateY = height - 240; // Move up to align with the sentence
      
      // Signature section coordinates (bottom of page)
      let signatureX = 90; // Left side "Accepted By:" field - moved right
      let signatureY = 95; // Bottom of page - slightly lower
      let signatureDateX = 340; // Right side "Date" field - moved right
      let signatureDateY = 95; // Same height as signature

      // Adjust coordinates based on template type if needed
      if (templateId.includes("Austin")) {
        // Austin template uses standard positioning
        // No adjustments needed
      } else if (templateId.includes("Charlotte")) {
        // Charlotte template might have slightly different positioning
        // No adjustments needed for now
      }

      // For UNLICENSED templates, text might be positioned differently
      if (templateId.includes("UNLICENSED")) {
        // Use same positioning for consistency
      }

      console.log("Calculated text positions:", {
        template: templateId,
        candidateName: { x: nameX, y: nameY },
        projectedStartDate: { x: dateX, y: dateY },
      });

      // Add candidate name to the "Dear ____" field
      firstPage.drawText(candidateName, {
        x: nameX,
        y: nameY,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Add projected start date to the start time field (format as MM/DD/YYYY)
      // Convert the formatted date to MM/DD/YYYY format
      const dateForPDF = projectedStartDate.includes(',') 
        ? new Date(projectedStartDate).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          })
        : projectedStartDate; // Keep as-is if already in correct format
        
      firstPage.drawText(dateForPDF, {
        x: dateX,
        y: dateY,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });

      console.log("✅ Text embedded successfully at calculated positions");

      // capture signature as png - improved handling
      const canvas = sigCanvas?.getCanvas();
      if (!canvas) {
        throw new Error("Unable to get signature canvas");
      }

      console.log("Signature captured and embedded");

      // Add signature to PDF
      const signatureDataUrl = canvas.toDataURL();
      const signatureImage = await pdfDoc.embedPng(signatureDataUrl);

      // Add candidate's typed name inline with signature
      firstPage.drawText(candidateName, {
        x: signatureX,
        y: signatureY + 15, // Move up to be more visible
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      // Position signature image to the right of the typed name
      const nameWidth = font.widthOfTextAtSize(candidateName, 12);
      firstPage.drawImage(signatureImage, {
        x: signatureX + nameWidth + 10, // Position to the right of name
        y: signatureY, // Same line as the field
        width: 120,
        height: 30,
      });

      // Add current date/timestamp in the "Date" field (right side, bottom)
      const currentDate = new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
      
      firstPage.drawText(currentDate, {
        x: signatureDateX,
        y: signatureDateY + 5, // Align with typed name
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });

      console.log("PDF with signature and date created");

      // Get the modified PDF as bytes
      const signedPdfBytes = await pdfDoc.save();
      const signedPdfBase64 = Buffer.from(signedPdfBytes).toString("base64");

      console.log("PDF converted to base64, sending to server API...");

      // Get user's IP
      const userIp = await fetch("https://api.ipify.org?format=json")
        .then((res) => res.json())
        .then((data) => data.ip)
        .catch(() => "unknown");

      console.log("Sending to server API...");
      const serverResponse = await fetch("/api/offers/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: id,
          signedPdfBytes: signedPdfBase64,
          userIp: userIp,
        }),
      });

      if (!serverResponse.ok) {
        const errorText = await serverResponse.text();
        console.error("Server API error:", errorText);
        throw new Error("Failed to save signed offer");
      }

      const result = await serverResponse.json();
      console.log("Server API response:", result);

      console.log("Offer signed successfully!");
      
      // Update local state to show signed status
      setSigned(true);
      
      // Reload the page to show the thank you message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      console.error("Error signing offer:", e);
      alert("Failed to sign offer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Thank You!</h1>
            <p className="text-gray-600 mb-6">
              {candidateName}, your offer letter has been successfully signed and submitted.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>What&apos;s Next?</strong><br />
                Our HR team will be in contact with you shortly regarding your start date and next steps.
              </p>
            </div>
            <p className="text-xs text-gray-500">
              You may close this window. A copy of your signed offer will be sent to your email.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Employment Offer Letter</h1>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Candidate Information</h2>
          <p>
            <strong>Name:</strong> {candidateName}
          </p>
          <p>
            <strong>Projected Start Date:</strong> {projectedStartDate}
          </p>
        </div>

        {pdfUrl && (
          <div className="mb-6">
            <iframe
              src={pdfUrl}
              className="w-full h-96 border"
              title="Offer Letter"
            />
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="mb-2 font-medium">Please sign below:</p>
          <SignatureCanvas
            ref={(ref) => setSigCanvas(ref)}
            penColor="black"
            canvasProps={{ width: 500, height: 150, className: "border" }}
          />
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isSubmitting}
            >
              Clear
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Signing...
                </>
              ) : (
                "Sign Offer"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
