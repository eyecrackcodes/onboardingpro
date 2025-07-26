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
import { TaskService } from "./task-service";

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
      console.log("💾 Saving call disposition:", {
        candidateId,
        callSid: callRecord.callSid,
        disposition,
      });

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
      const docRef = await addDoc(collection(db, "candidate_notes"), {
        ...note,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Call disposition saved successfully");

      // 🆕 Create task from disposition if next action is specified
      if (disposition.nextAction && disposition.nextAction !== "no_action") {
        try {
          const taskId = await TaskService.createTaskFromDisposition(
            candidateId,
            callRecord.candidateName || "Unknown Candidate",
            disposition,
            callRecord.id || callRecord.callSid
          );

          if (taskId) {
            console.log("✅ Task created from call disposition:", taskId);
          }
        } catch (taskError) {
          console.error(
            "⚠️ Failed to create task from disposition:",
            taskError
          );
          // Don't throw here - disposition save was successful
        }
      }
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

  static formatCallNote(callRecord: any, disposition: CallDisposition): string {
    const timestamp = new Date().toLocaleString();

    let note = `📞 Call completed at ${timestamp}\n\n`;
    note += `**Status:** ${disposition.status}\n`;
    note += `**Outcome:** ${disposition.outcome}\n`;

    if (disposition.nextAction && disposition.nextAction !== "no_action") {
      note += `**Next Action:** ${disposition.nextAction.replace("_", " ")}\n`;
    }

    if (disposition.conversationNotes) {
      note += `\n**Conversation Notes:**\n${disposition.conversationNotes}\n`;
    }

    if (disposition.internalNotes) {
      note += `\n**Internal Notes:**\n${disposition.internalNotes}\n`;
    }

    note += `\n**Call Details:**\n`;
    note += `- Call SID: ${callRecord.callSid}\n`;
    note += `- Duration: ${callRecord.duration || "N/A"}\n`;
    note += `- Phone: ${callRecord.candidatePhone}\n`;

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

      console.log("✅ General note added successfully");
    } catch (error) {
      console.error("❌ Error adding general note:", error);
      throw new Error("Failed to add note");
    }
  }

  static async addInterviewNote(
    candidateId: string,
    content: string,
    interviewData?: any,
    createdBy?: string
  ): Promise<void> {
    try {
      const note: Omit<CandidateNote, "id"> = {
        candidateId,
        type: "interview",
        content,
        createdAt: new Date(),
        createdBy,
      };

      await addDoc(collection(db, "candidate_notes"), {
        ...note,
        createdAt: serverTimestamp(),
        interviewData,
      });

      console.log("✅ Interview note added successfully");
    } catch (error) {
      console.error("❌ Error adding interview note:", error);
      throw new Error("Failed to add interview note");
    }
  }
}
