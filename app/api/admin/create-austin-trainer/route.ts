import { NextRequest, NextResponse } from "next/server";
import { createAustinHouserTrainer } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Creating Austin Houser trainer...");
    const trainerId = await createAustinHouserTrainer();

    return NextResponse.json({
      success: true,
      trainerId,
      message: "Austin Houser trainer created/verified successfully",
    });
  } catch (error: any) {
    console.error("[API] Error creating Austin Houser trainer:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Failed to create Austin Houser trainer",
      },
      { status: 500 }
    );
  }
}
