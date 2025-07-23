import { useEffect } from "react";
import { useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Candidate } from "@/lib/types";

interface OfferListenerProps {
  candidateId: string;
  onUpdate: (updates: Partial<Candidate>) => void;
}

export function OfferListener({ candidateId, onUpdate }: OfferListenerProps) {
  const previousDataRef = useRef<any>(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep the callback reference current
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const offerRef = doc(db, "offers", candidateId);

    const unsubscribe = onSnapshot(offerRef, (docSnap) => {
      if (docSnap.exists()) {
        const offerData = docSnap.data();

        // Create the current data structure
        const currentOfferState = {
          sent: !!offerData.sentAt,
          signed: !!offerData.signed,
          sentAt: offerData.sentAt?.toDate()?.getTime(), // Use timestamp for comparison
          signedAt: offerData.signedAt?.toDate()?.getTime(),
        };

        // Check if data has actually changed
        const previousState = previousDataRef.current;
        if (
          previousState &&
          previousState.sent === currentOfferState.sent &&
          previousState.signed === currentOfferState.signed &&
          previousState.sentAt === currentOfferState.sentAt &&
          previousState.signedAt === currentOfferState.signedAt
        ) {
          console.log("[OfferListener] No changes detected, skipping update");
          return; // No changes, skip update
        }

        console.log("[OfferListener] Data changed:", {
          previous: previousState,
          current: currentOfferState,
        });

        // Store current state for next comparison
        previousDataRef.current = currentOfferState;

        // Map offers collection data to candidate.offers structure
        const updates: Partial<Candidate> = {
          offers: {
            preLicenseOffer: {
              sent: !!offerData.sentAt,
              signed: !!offerData.signed,
              ...(offerData.sentAt && { sentAt: offerData.sentAt.toDate() }),
              ...(offerData.signedAt && {
                signedAt: offerData.signedAt.toDate(),
              }),
            },
            fullAgentOffer: {
              sent: false, // separate docs for different offer types
              signed: false,
            },
          },
        };

        onUpdateRef.current(updates);
      } else {
        // Document doesn't exist, reset our tracking
        console.log("[OfferListener] Offer document doesn't exist");
        previousDataRef.current = null;
      }
    });

    return () => unsubscribe();
  }, [candidateId]); // Remove onUpdate from dependencies

  return null; // This component only handles side effects
}
