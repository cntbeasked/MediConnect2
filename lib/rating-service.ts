import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function updateClinicianRating(clinicianId: string) {
  try {
    // Get all verified queries by this clinician
    const queriesSnapshot = await getDocs(
      query(collection(db, "queries"), where("clinicianId", "==", clinicianId), where("verified", "==", true)),
    )

    // Calculate the rating
    let totalRatings = 0
    let positiveRatings = 0

    queriesSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.rating !== null) {
        totalRatings++
        if (data.rating === 1) {
          positiveRatings++
        }
      }
    })

    // Calculate the rating (scale of 1-5)
    let rating = 5.0 // Default rating

    if (totalRatings > 0) {
      // Convert from ratio to 1-5 scale
      // 0% positive = 1.0, 100% positive = 5.0
      rating = 1.0 + (positiveRatings / totalRatings) * 4.0
    }

    // Update the clinician's rating in Firestore
    await updateDoc(doc(db, "clinicianDetails", clinicianId), {
      rating,
      verifiedResponses: queriesSnapshot.size,
      updatedAt: new Date().toISOString(),
    })

    return rating
  } catch (error) {
    console.error("Error updating clinician rating:", error)
    throw error
  }
}

