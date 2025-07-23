import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
  QueryConstraint,
  Unsubscribe,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Candidate, Cohort, Trainer } from "./types";

// Helper function to convert Firestore timestamps to Date objects
function convertTimestamps(data: DocumentData): any {
  const converted = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    } else if (
      converted[key] &&
      typeof converted[key] === "object" &&
      converted[key].constructor === Object
    ) {
      converted[key] = convertTimestamps(converted[key]);
    } else if (Array.isArray(converted[key])) {
      converted[key] = converted[key].map((item: any) =>
        typeof item === "object" ? convertTimestamps(item) : item
      );
    }
  });
  return converted;
}

// Candidate CRUD operations
export const createCandidate = async (
  candidateData: Omit<Candidate, "id" | "createdAt" | "updatedAt">
) => {
  try {
    const docRef = await addDoc(collection(db, "candidates"), {
      ...candidateData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating candidate:", error);
    throw error;
  }
};

export const updateCandidate = async (
  id: string,
  updates: Partial<Candidate>
) => {
  try {
    const candidateRef = doc(db, "candidates", id);
    await updateDoc(candidateRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating candidate:", error);
    throw error;
  }
};

export const deleteCandidate = async (id: string) => {
  try {
    console.log(`[Firestore] Starting cascade deletion for candidate: ${id}`);

    // Use a batch to ensure all deletions happen atomically
    const batch = writeBatch(db);

    // 1. Delete the candidate document
    const candidateRef = doc(db, "candidates", id);
    batch.delete(candidateRef);
    console.log(`[Firestore] ✓ Queued candidate document for deletion`);

    // 2. Delete associated notifications
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("candidateId", "==", id)
    );
    const notificationsSnapshot = await getDocs(notificationsQuery);

    console.log(
      `[Firestore] Found ${notificationsSnapshot.size} notifications to delete`
    );
    notificationsSnapshot.forEach((notificationDoc) => {
      batch.delete(notificationDoc.ref);
    });

    // 3. Delete associated offer (if exists)
    const offerRef = doc(db, "offers", id);
    const offerDoc = await getDoc(offerRef);
    if (offerDoc.exists()) {
      batch.delete(offerRef);
      console.log(`[Firestore] ✓ Queued offer document for deletion`);
    } else {
      console.log(`[Firestore] No offer document found for candidate`);
    }

    // Execute all deletions atomically
    await batch.commit();

    console.log(
      `[Firestore] ✅ Successfully completed cascade deletion for candidate: ${id}`
    );
    console.log(
      `[Firestore] Deleted: 1 candidate + ${
        notificationsSnapshot.size
      } notifications + ${offerDoc.exists() ? 1 : 0} offers`
    );
  } catch (error) {
    console.error("Error in cascade deletion:", error);
    throw error;
  }
};

export const getCandidate = async (id: string): Promise<Candidate | null> => {
  try {
    const docSnap = await getDoc(doc(db, "candidates", id));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as Candidate;
    }
    return null;
  } catch (error) {
    console.error("Error getting candidate:", error);
    throw error;
  }
};

export const getCandidates = async (filters?: {
  callCenter?: string;
  licenseStatus?: string;
  status?: string;
}) => {
  try {
    // Fetch all candidates without complex queries to avoid index requirements
    const querySnapshot = await getDocs(collection(db, "candidates"));

    let candidates = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Candidate[];

    // Apply filters in memory
    if (filters) {
      if (filters.callCenter) {
        candidates = candidates.filter(
          (c) => c.callCenter === filters.callCenter
        );
      }
      if (filters.licenseStatus) {
        candidates = candidates.filter(
          (c) => c.licenseStatus === filters.licenseStatus
        );
      }
      if (filters.status) {
        candidates = candidates.filter((c) => c.status === filters.status);
      }
    }

    // Sort by creation date (newest first)
    candidates.sort((a, b) => {
      const dateA =
        a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB =
        b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    return candidates;
  } catch (error) {
    console.error("Error getting candidates:", error);
    throw error;
  }
};

// Real-time listener for candidates
export const subscribeToCandidates = (
  callback: (candidates: Candidate[]) => void,
  filters?: {
    callCenter?: string;
    licenseStatus?: string;
    status?: string;
  }
): Unsubscribe => {
  const constraints: QueryConstraint[] = [];

  if (filters?.callCenter) {
    constraints.push(where("callCenter", "==", filters.callCenter));
  }
  if (filters?.licenseStatus) {
    constraints.push(where("licenseStatus", "==", filters.licenseStatus));
  }
  if (filters?.status) {
    constraints.push(where("status", "==", filters.status));
  }

  constraints.push(orderBy("createdAt", "desc"));

  const q = query(collection(db, "candidates"), ...constraints);

  return onSnapshot(q, (querySnapshot) => {
    const candidates = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Candidate[];
    callback(candidates);
  });
};

// Real-time listener for a single candidate
export const subscribeToCandidateUpdates = (
  candidateId: string,
  callback: (candidate: Candidate | null) => void
): Unsubscribe => {
  const candidateRef = doc(db, "candidates", candidateId);

  return onSnapshot(candidateRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as Candidate);
    } else {
      callback(null);
    }
  });
};

// Cohort CRUD operations
export const createCohort = async (
  cohortData: Omit<Cohort, "id" | "createdAt" | "updatedAt">
) => {
  try {
    const docRef = await addDoc(collection(db, "cohorts"), {
      ...cohortData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating cohort:", error);
    throw error;
  }
};

export const updateCohort = async (id: string, updates: Partial<Cohort>) => {
  try {
    const cohortRef = doc(db, "cohorts", id);
    await updateDoc(cohortRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating cohort:", error);
    throw error;
  }
};

export const getCohort = async (id: string): Promise<Cohort | null> => {
  try {
    const docSnap = await getDoc(doc(db, "cohorts", id));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as Cohort;
    }
    return null;
  } catch (error) {
    console.error("Error getting cohort:", error);
    throw error;
  }
};

export const getCohorts = async (filters?: {
  callCenter?: string;
  classType?: string;
  status?: string;
}) => {
  try {
    // Fetch all cohorts without complex queries to avoid index requirements
    const querySnapshot = await getDocs(collection(db, "cohorts"));

    let cohorts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Cohort[];

    // Apply filters in memory
    if (filters) {
      if (filters.callCenter) {
        cohorts = cohorts.filter((c) => c.callCenter === filters.callCenter);
      }
      if (filters.classType) {
        cohorts = cohorts.filter((c) => c.classType === filters.classType);
      }
      if (filters.status) {
        cohorts = cohorts.filter((c) => c.status === filters.status);
      }
    }

    // Sort by start date (newest first)
    cohorts.sort((a, b) => {
      const dateA =
        a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
      const dateB =
        b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
      return dateB.getTime() - dateA.getTime();
    });

    return cohorts;
  } catch (error) {
    console.error("Error getting cohorts:", error);
    throw error;
  }
};

// Real-time listener for cohorts
export const subscribeToCohorts = (
  callback: (cohorts: Cohort[]) => void,
  filters?: {
    callCenter?: string;
    classType?: string;
    status?: string;
  }
): Unsubscribe => {
  const constraints: QueryConstraint[] = [];

  if (filters?.callCenter) {
    constraints.push(where("callCenter", "==", filters.callCenter));
  }
  if (filters?.classType) {
    constraints.push(where("classType", "==", filters.classType));
  }
  if (filters?.status) {
    constraints.push(where("status", "==", filters.status));
  }

  constraints.push(orderBy("startDate", "desc"));

  const q = query(collection(db, "cohorts"), ...constraints);

  return onSnapshot(q, (querySnapshot) => {
    const cohorts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Cohort[];
    callback(cohorts);
  });
};

// Trainer CRUD operations
export const createTrainer = async (
  trainerData: Omit<Trainer, "id" | "createdAt" | "updatedAt">
) => {
  try {
    const docRef = await addDoc(collection(db, "trainers"), {
      ...trainerData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating trainer:", error);
    throw error;
  }
};

export const updateTrainer = async (id: string, updates: Partial<Trainer>) => {
  try {
    const trainerRef = doc(db, "trainers", id);
    await updateDoc(trainerRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating trainer:", error);
    throw error;
  }
};

// Function to create Austin Houser trainer if it doesn't exist
export const createAustinHouserTrainer = async () => {
  try {
    console.log("[Firestore] createAustinHouserTrainer: Starting...");

    // Check if Austin Houser already exists
    const trainersSnapshot = await getDocs(collection(db, "trainers"));
    console.log("[Firestore] Checking existing trainers:", {
      totalDocs: trainersSnapshot.size,
      isEmpty: trainersSnapshot.empty,
    });

    const existingTrainer = trainersSnapshot.docs.find((doc) => {
      const data = doc.data();
      console.log("[Firestore] Checking trainer:", {
        name: data.name,
        id: doc.id,
      });
      return data.name === "Austin Houser";
    });

    if (existingTrainer) {
      console.log(
        "Austin Houser trainer already exists with ID:",
        existingTrainer.id
      );

      // Check if callCenter needs to be fixed
      const data = existingTrainer.data();
      if (data.callCenter !== "ATX") {
        console.log(
          `[Firestore] Fixing Austin Houser's callCenter from "${data.callCenter}" to "ATX"`
        );
        await updateDoc(existingTrainer.ref, {
          callCenter: "ATX",
          updatedAt: Timestamp.now(),
        });
        console.log("✅ Austin Houser's callCenter updated to ATX");
      }

      return existingTrainer.id;
    }

    console.log("[Firestore] Austin Houser not found, creating new trainer...");

    // Create Austin Houser trainer
    const austinHouser: Omit<Trainer, "id" | "createdAt" | "updatedAt"> = {
      name: "Austin Houser",
      email: "austin.houser@luminarylife.com",
      phone: "(512) 555-0123",
      type: "SSS", // or "CAP" - adjust as needed
      callCenter: "ATX", // ✅ Make sure this is ATX
      currentAssignments: [],
      maxCapacity: 20,
      specializations: [
        "Customer Service",
        "Sales Training",
        "New Agent Training",
      ],
      isActive: true,
    };

    console.log("[Firestore] Creating trainer with data:", austinHouser);

    const docRef = await addDoc(collection(db, "trainers"), {
      ...austinHouser,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(
      "✅ Austin Houser trainer created successfully with ID:",
      docRef.id
    );

    // Verify the creation
    const verifyDoc = await getDoc(docRef);
    if (verifyDoc.exists()) {
      console.log("✅ Trainer creation verified - document exists");
      console.log("Document data:", verifyDoc.data());
    } else {
      console.error(
        "❌ Trainer creation failed - document does not exist after creation"
      );
    }

    return docRef.id;
  } catch (error) {
    console.error("Error creating Austin Houser trainer:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
};

// Function to fix Austin Houser's callCenter specifically
export const fixAustinHouserCallCenter = async () => {
  try {
    console.log("[Firestore] Fixing Austin Houser's call center...");

    const trainersSnapshot = await getDocs(collection(db, "trainers"));
    const austinDoc = trainersSnapshot.docs.find((doc) => {
      const data = doc.data();
      return data.name === "Austin Houser";
    });

    if (!austinDoc) {
      throw new Error("Austin Houser trainer not found");
    }

    const currentData = austinDoc.data();
    console.log("[Firestore] Current Austin Houser data:", currentData);

    await updateDoc(austinDoc.ref, {
      callCenter: "ATX",
      updatedAt: Timestamp.now(),
    });

    console.log("✅ Austin Houser's callCenter fixed to ATX");
    return austinDoc.id;
  } catch (error) {
    console.error("Error fixing Austin Houser's call center:", error);
    throw error;
  }
};

export const getTrainers = async (filters?: {
  callCenter?: string;
  type?: string;
  isActive?: boolean;
}) => {
  try {
    console.log("[Firestore] getTrainers called with filters:", filters);

    // Fetch all trainers without complex queries to avoid index requirements
    const querySnapshot = await getDocs(collection(db, "trainers"));

    console.log("[Firestore] Raw trainers query result:", {
      empty: querySnapshot.empty,
      size: querySnapshot.size,
      docs: querySnapshot.docs.length,
    });

    let trainers = querySnapshot.docs.map((doc) => {
      const data = convertTimestamps(doc.data());
      console.log("[Firestore] Processing trainer doc:", {
        id: doc.id,
        name: data.name,
        callCenter: data.callCenter,
        isActive: data.isActive,
        rawData: data,
      });
      return {
        id: doc.id,
        ...data,
      };
    }) as Trainer[];

    console.log("[Firestore] All trainers before filtering:", trainers);

    // Apply filters in memory
    if (filters) {
      if (filters.callCenter) {
        console.log("[Firestore] Filtering by callCenter:", filters.callCenter);
        const beforeFilter = trainers.length;
        trainers = trainers.filter(
          (t) => t.callCenter === filters.callCenter || t.callCenter === "Both"
        );
        console.log("[Firestore] After callCenter filter:", {
          before: beforeFilter,
          after: trainers.length,
          filtered: trainers.map((t) => ({
            name: t.name,
            callCenter: t.callCenter,
          })),
        });
      }
      if (filters.type) {
        console.log("[Firestore] Filtering by type:", filters.type);
        trainers = trainers.filter((t) => t.type === filters.type);
      }
      if (filters.isActive !== undefined) {
        console.log("[Firestore] Filtering by isActive:", filters.isActive);
        const beforeFilter = trainers.length;
        trainers = trainers.filter((t) => t.isActive === filters.isActive);
        console.log("[Firestore] After isActive filter:", {
          before: beforeFilter,
          after: trainers.length,
          filtered: trainers.map((t) => ({
            name: t.name,
            isActive: t.isActive,
          })),
        });
      }
    }

    console.log("[Firestore] Final trainers result:", trainers);
    return trainers;
  } catch (error) {
    console.error("Error getting trainers:", error);
    throw error;
  }
};
