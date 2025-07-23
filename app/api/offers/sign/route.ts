import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerId, signedPdfBytes, userIp } = body;

    if (!offerId || !signedPdfBytes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("[Sign API] Processing signature for offer:", offerId);
    console.log(
      "[Sign API] Storage bucket:",
      storage.app.options.storageBucket
    );

    // Convert base64 PDF back to bytes
    const pdfBuffer = Buffer.from(signedPdfBytes, "base64");
    console.log("[Sign API] PDF buffer size:", pdfBuffer.length, "bytes");

    // Upload to Firebase Storage
    let signedUrl: string | null = null;
    try {
      const fileRef = ref(storage, `signed-offers/${offerId}.pdf`);
      console.log("[Sign API] Storage reference path:", fileRef.fullPath);
      console.log("[Sign API] Storage bucket:", fileRef.bucket);

      console.log("[Sign API] Starting upload...");
      const uploadResult = await uploadBytes(fileRef, pdfBuffer);
      console.log("[Sign API] Upload completed:", uploadResult.metadata.name);

      signedUrl = await getDownloadURL(fileRef);
      console.log("[Sign API] Download URL obtained:", signedUrl);
    } catch (storageError: any) {
      console.error("[Sign API] Storage error details:", {
        code: storageError.code,
        message: storageError.message,
        status: storageError.status_,
        customData: storageError.customData,
        serverResponse: storageError.serverResponse,
      });

      // Try a simple workaround - save to Firestore instead
      console.log(
        "[Sign API] Storage failed, falling back to Firestore-only approach"
      );

      // Update Firestore without storage URL
      await updateDoc(doc(db, "offers", offerId), {
        signed: true,
        signedAt: serverTimestamp(),
        signerIp: userIp || "unknown",
        storagePath: null, // No file stored
        downloadUrl: null, // No download URL
        signedPdfBase64: signedPdfBytes, // Store PDF as base64 in Firestore temporarily
      });

      console.log("[Sign API] Firestore updated successfully (fallback mode)");

      return NextResponse.json({
        success: true,
        mode: "firestore_fallback",
        message: "Signature saved to database (storage unavailable)",
      });
    }

    // Update Firestore with storage info
    await updateDoc(doc(db, "offers", offerId), {
      signed: true,
      signedAt: serverTimestamp(),
      signerIp: userIp || "unknown",
      storagePath: `signed-offers/${offerId}.pdf`,
      downloadUrl: signedUrl,
    });

    console.log("[Sign API] Firestore updated successfully");

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
    });
  } catch (error: any) {
    console.error("[Sign API] General error:", error);
    console.error("[Sign API] Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to save signed offer", details: error.message },
      { status: 500 }
    );
  }
}
