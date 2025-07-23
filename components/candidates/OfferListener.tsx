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
  // Store the onUpdate function in a ref to avoid recreating the effect
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Track previous data to avoid unnecessary updates
  const previousPreLicenseDataRef = useRef<any>(null);
  const previousFullAgentDataRef = useRef<any>(null);

  useEffect(() => {
    console.log("[OfferListener] Setting up listeners for candidate:", candidateId);
    
    // Listen to pre-license offer
    const preLicenseOfferRef = doc(db, "offers", candidateId);
    const unsubscribePreLicense = onSnapshot(preLicenseOfferRef, (docSnap) => {
      if (docSnap.exists()) {
        const offerData = docSnap.data();
        console.log("[OfferListener] Pre-license offer data received:", {
          candidateId,
          signed: offerData.signed,
          sentAt: offerData.sentAt,
          signedAt: offerData.signedAt,
        });

        // Check if data actually changed
        const dataStr = JSON.stringify({
          signed: offerData.signed,
          sentAt: offerData.sentAt?.toMillis(),
          signedAt: offerData.signedAt?.toMillis(),
        });

        if (previousPreLicenseDataRef.current === dataStr) {
          console.log("[OfferListener] Pre-license data unchanged, skipping update");
          return;
        }

        previousPreLicenseDataRef.current = dataStr;

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
            // Preserve existing full agent offer data
            fullAgentOffer: previousFullAgentDataRef.current || {
              sent: false,
              signed: false,
            },
          },
        };

        onUpdateRef.current(updates);
      } else {
        console.log("[OfferListener] Pre-license offer document doesn't exist");
        previousPreLicenseDataRef.current = null;
      }
    });

    // Listen to full agent offer
    const fullAgentOfferRef = doc(db, "offers", `${candidateId}_full`);
    const unsubscribeFullAgent = onSnapshot(fullAgentOfferRef, (docSnap) => {
      if (docSnap.exists()) {
        const offerData = docSnap.data();
        console.log("[OfferListener] Full agent offer data received:", {
          candidateId,
          signed: offerData.signed,
          sentAt: offerData.sentAt,
          signedAt: offerData.signedAt,
        });

        // Check if data actually changed
        const dataStr = JSON.stringify({
          signed: offerData.signed,
          sentAt: offerData.sentAt?.toMillis(),
          signedAt: offerData.signedAt?.toMillis(),
        });

        if (previousFullAgentDataRef.current === dataStr) {
          console.log("[OfferListener] Full agent data unchanged, skipping update");
          return;
        }

        previousFullAgentDataRef.current = dataStr;

        // Map offers collection data to candidate.offers structure
        const updates: Partial<Candidate> = {
          offers: {
            // Preserve existing pre-license offer data
            preLicenseOffer: previousPreLicenseDataRef.current ? {
              sent: true,
              signed: true,
              sentAt: new Date(),
              signedAt: new Date(),
            } : {
              sent: false,
              signed: false,
            },
            fullAgentOffer: {
              sent: !!offerData.sentAt,
              signed: !!offerData.signed,
              ...(offerData.sentAt && { sentAt: offerData.sentAt.toDate() }),
              ...(offerData.signedAt && {
                signedAt: offerData.signedAt.toDate(),
              }),
            },
          },
        };

        onUpdateRef.current(updates);
      } else {
        console.log("[OfferListener] Full agent offer document doesn't exist");
        previousFullAgentDataRef.current = null;
      }
    });

    return () => {
      unsubscribePreLicense();
      unsubscribeFullAgent();
    };
  }, [candidateId]);

  return null; // This component only handles side effects
}
