import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  try {
    const { candidateId } = params;

    console.log("📞 Fetching call history for candidate:", candidateId);

    if (!candidateId) {
      return NextResponse.json(
        { error: "Candidate ID is required" },
        { status: 400 }
      );
    }

    try {
      // Query call logs for this candidate
      const callLogsRef = collection(db, "call_logs");
      const q = query(
        callLogsRef,
        where("candidateId", "==", candidateId),
        orderBy("createdAt", "desc"),
        limit(50) // Limit to last 50 calls
      );

      const querySnapshot = await getDocs(q);
      const calls = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to regular dates
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));

      console.log(
        `✅ Found ${calls.length} calls for candidate ${candidateId}`
      );

      return NextResponse.json({
        candidateId,
        calls,
        total: calls.length,
      });
    } catch (firestoreError: any) {
      console.error(
        "❌ Firestore error fetching call history:",
        firestoreError
      );
      return NextResponse.json(
        {
          error: "Failed to fetch call history",
          details: firestoreError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Call history API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch call history",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
