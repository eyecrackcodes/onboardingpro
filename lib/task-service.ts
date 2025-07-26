import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export interface Task {
  id?: string;
  candidateId: string;
  candidateName: string;
  type: string; // schedule_interview, schedule_callback, send_email, etc.
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  createdBy?: string;
  sourceType: "call_disposition" | "manual";
  sourceId?: string; // ID of the call record or note that created this task
}

export class TaskService {
  static async createTask(
    task: Omit<Task, "id" | "createdAt" | "completed">
  ): Promise<string> {
    try {
      const taskData = {
        ...task,
        completed: false,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "tasks"), taskData);
      console.log("✅ Task created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating task:", error);
      throw error;
    }
  }

  static async getTasks(userId?: string): Promise<Task[]> {
    try {
      let q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));

      // If userId is provided, filter by creator
      if (userId) {
        q = query(
          collection(db, "tasks"),
          where("createdBy", "==", userId),
          orderBy("createdAt", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        dueDate: doc.data().dueDate?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as Task[];

      console.log(`✅ Retrieved ${tasks.length} tasks`);
      return tasks;
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
      return [];
    }
  }

  static async completeTask(taskId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        completed: true,
        completedAt: serverTimestamp(),
      });

      console.log("✅ Task marked as completed:", taskId);
    } catch (error) {
      console.error("❌ Error completing task:", error);
      throw error;
    }
  }

  static async createTaskFromDisposition(
    candidateId: string,
    candidateName: string,
    disposition: any,
    callRecordId: string
  ): Promise<string | null> {
    // Only create tasks for specific next actions
    if (!disposition.nextAction || disposition.nextAction === "no_action") {
      return null;
    }

    const taskMap: Record<
      string,
      {
        title: string;
        description: string;
        priority: "low" | "medium" | "high";
        daysToComplete: number;
      }
    > = {
      schedule_interview: {
        title: "Schedule Interview",
        description: `Schedule interview with ${candidateName} following positive call outcome`,
        priority: "high",
        daysToComplete: 2,
      },
      schedule_callback: {
        title: "Schedule Callback",
        description: `Schedule callback with ${candidateName} as requested during call`,
        priority: "medium",
        daysToComplete: 1,
      },
      send_email: {
        title: "Send Follow-up Email",
        description: `Send follow-up email to ${candidateName} with additional information`,
        priority: "medium",
        daysToComplete: 1,
      },
      remove_from_pool: {
        title: "Remove from Candidate Pool",
        description: `Update ${candidateName}'s status and remove from active recruitment`,
        priority: "low",
        daysToComplete: 7,
      },
    };

    const taskConfig = taskMap[disposition.nextAction];
    if (!taskConfig) {
      console.log(
        "⚠️ No task configuration for action:",
        disposition.nextAction
      );
      return null;
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + taskConfig.daysToComplete);

    try {
      const taskId = await this.createTask({
        candidateId,
        candidateName,
        type: disposition.nextAction,
        title: taskConfig.title,
        description: taskConfig.description,
        priority: taskConfig.priority,
        dueDate,
        sourceType: "call_disposition",
        sourceId: callRecordId,
      });

      console.log("✅ Task created from disposition:", {
        taskId,
        action: disposition.nextAction,
        candidate: candidateName,
      });

      return taskId;
    } catch (error) {
      console.error("❌ Error creating task from disposition:", error);
      return null;
    }
  }

  static async getTasksForCandidate(candidateId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, "tasks"),
        where("candidateId", "==", candidateId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        dueDate: doc.data().dueDate?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as Task[];

      return tasks;
    } catch (error) {
      console.error("❌ Error fetching candidate tasks:", error);
      return [];
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        deleted: true,
        deletedAt: serverTimestamp(),
      });

      console.log("✅ Task deleted:", taskId);
    } catch (error) {
      console.error("❌ Error deleting task:", error);
      throw error;
    }
  }

  static async updateTask(
    taskId: string,
    updates: Partial<Task>
  ): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "tasks", taskId), updateData);
      console.log("✅ Task updated:", taskId);
    } catch (error) {
      console.error("❌ Error updating task:", error);
      throw error;
    }
  }
}
