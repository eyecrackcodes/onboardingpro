import { db } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

export interface CallDisposition {
  status: string;
  outcome: string;
  nextAction: string;
  conversationNotes: string;
  internalNotes: string;
}

export interface CandidateNote {
  id?: string;
  candidateId: string;
  type: "call" | "general" | "interview" | "follow_up";
  content: string;
  createdAt: Date;
  createdBy?: string;
  callRecord?: any;
  disposition?: CallDisposition;
}

export class CandidateNotesService {
  static async saveCallDisposition(
    candidateId: string,
    callRecord: any,
    disposition: CallDisposition
  ): Promise<void> {
    try {
      // Format the comprehensive note
      const noteContent = this.formatCallNote(callRecord, disposition);

      const note: Omit<CandidateNote, "id"> = {
        candidateId,
        type: "call",
        content: noteContent,
        createdAt: new Date(),
        callRecord,
        disposition,
      };

      // Save to candidate_notes collection
      await addDoc(collection(db, "candidate_notes"), {
        ...note,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Call disposition saved successfully");
    } catch (error) {
      console.error("❌ Error saving call disposition:", error);
      throw new Error("Failed to save call disposition");
    }
  }

  static async getCandidateNotes(
    candidateId: string
  ): Promise<CandidateNote[]> {
    try {
      const q = query(
        collection(db, "candidate_notes"),
        where("candidateId", "==", candidateId),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as CandidateNote[];
    } catch (error) {
      console.error("❌ Error fetching candidate notes:", error);
      return [];
    }
  }

  private static formatCallNote(
    callRecord: any,
    disposition: CallDisposition
  ): string {
    const timestamp = new Date().toLocaleString();
    const status = disposition.status.toUpperCase();

    let note = `[${timestamp}] CALL - ${status}\n`;
    note += `📞 CALL DETAILS:\n`;
    note += `Phone: ${callRecord.candidatePhone}\n`;
    note += `Purpose: ${callRecord.purpose}\n`;
    note += `Status: ${status}\n\n`;

    note += `📋 CALL OUTCOME: ${disposition.outcome.toUpperCase()}\n\n`;

    if (disposition.conversationNotes) {
      note += `💬 CONVERSATION NOTES:\n`;
      note += `${disposition.conversationNotes}\n\n`;
    }

    if (disposition.nextAction) {
      note += `📅 NEXT ACTION: ${disposition.nextAction.toUpperCase()}\n\n`;
    }

    if (disposition.internalNotes) {
      note += `🔒 INTERNAL NOTES:\n`;
      note += `${disposition.internalNotes}\n`;
    }

    return note;
  }

  static async addGeneralNote(
    candidateId: string,
    content: string,
    createdBy?: string
  ): Promise<void> {
    try {
      const note: Omit<CandidateNote, "id"> = {
        candidateId,
        type: "general",
        content,
        createdAt: new Date(),
        createdBy,
      };

      await addDoc(collection(db, "candidate_notes"), {
        ...note,
        createdAt: serverTimestamp(),
      });

      console.log("✅ General note saved successfully");
    } catch (error) {
      console.error("❌ Error saving general note:", error);
      throw new Error("Failed to save note");
    }
  }
}
