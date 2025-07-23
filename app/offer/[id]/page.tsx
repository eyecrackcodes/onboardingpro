"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
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

      // More precise positioning for different templates
      let nameX = 425; // Default for "Dear ____" field
      let nameY = height - 430; // Default Y position
      let dateX = 540; // Default for start date field
      let dateY = height - 508; // Default Y position

      // Adjust coordinates based on template type
      if (templateId.includes("Austin")) {
        // Austin template adjustments
        nameX = 425;
        nameY = height - 430;
        dateX = 540;
        dateY = height - 508;
      } else if (templateId.includes("Charlotte")) {
        // Charlotte template might have different positioning
        nameX = 425;
        nameY = height - 430;
        dateX = 540;
        dateY = height - 508;
      }

      // For UNLICENSED templates, text might be positioned differently
      if (templateId.includes("UNLICENSED")) {
        // Slight adjustments for unlicensed templates
        nameY = height - 435; // Slightly lower
        dateY = height - 513; // Slightly lower
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

      // Add projected start date to the start time field
      firstPage.drawText(projectedStartDate, {
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

      // Position signature (adjust coordinates as needed)
      firstPage.drawImage(signatureImage, {
        x: 100,
        y: 100,
        width: 200,
        height: 60,
      });

      console.log("PDF with signature created");

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
      if (result.mode === "firestore_fallback") {
        alert(
          "Offer signed successfully! (Saved to database - file storage temporarily unavailable)"
        );
      } else {
        alert("Offer signed successfully. Thank you!");
      }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Offer Already Signed</h1>
          <p>Thank you, {candidateName}! Your offer has been completed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
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
