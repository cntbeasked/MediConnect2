import { NextResponse } from "next/server"
import { updateClinicianRating } from "@/lib/rating-service"

export async function POST(request: Request) {
  try {
    const { clinicianId } = await request.json()

    if (!clinicianId) {
      return NextResponse.json({ error: "Clinician ID is required" }, { status: 400 })
    }

    const rating = await updateClinicianRating(clinicianId)

    return NextResponse.json({ rating })
  } catch (error) {
    console.error("Error updating rating:", error)
    return NextResponse.json({ error: "Failed to update rating" }, { status: 500 })
  }
}

