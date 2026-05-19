import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  onSnapshot,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Helper to handle Firestore errors as per the skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: any, operationType: OperationType, path: string) {
  console.error(`Firestore Error [${operationType}] at ${path}:`, error);
  throw error;
}

export const firebaseService = {
  // Santri
  async getSantri(gender?: string) {
    if (!db) return [];
    try {
      const colRef = collection(db, "santri");
      const q = gender ? query(colRef, where("gender", "==", gender)) : colRef;
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, "santri");
      return [];
    }
  },

  async saveSantri(santri: any) {
    if (!db) return;
    try {
      const docRef = doc(db, "santri", santri.nis);
      await setDoc(docRef, {
        ...santri,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `santri/${santri.nis}`);
    }
  },

  async deleteSantri(nis: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "santri", nis));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `santri/${nis}`);
    }
  },

  // Attendance
  async getAttendance(date: string) {
    if (!db) return {};
    try {
      const q = query(collection(db, "attendance"), where("date", "==", date));
      const snapshot = await getDocs(q);
      const data: any = {};
      snapshot.docs.forEach(doc => {
        const d = doc.data();
        data[`${date}_${d.santriId}`] = d;
      });
      return data;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, "attendance");
      return {};
    }
  },

  async saveAttendance(date: string, santriId: string, status: any) {
    if (!db) return;
    try {
      const id = `${date}_${santriId}`;
      await setDoc(doc(db, "attendance", id), {
        date,
        santriId,
        ...status,
        updatedAt: Timestamp.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `attendance/${date}_${santriId}`);
    }
  },

  // Payments
  async getPayments(santriIds?: string[]) {
    if (!db) return [];
    try {
      const colRef = collection(db, "payments");
      const q = (santriIds && santriIds.length > 0) 
        ? query(colRef, where("santriId", "in", santriIds)) 
        : colRef;
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, "payments");
      return [];
    }
  },

  async savePayment(payment: any) {
    if (!db) return;
    try {
      const id = payment.id || Date.now().toString();
      await setDoc(doc(db, "payments", id), {
        ...payment,
        id,
        date: payment.date || new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `payments/${payment.id}`);
    }
  },

  async deletePayment(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "payments", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `payments/${id}`);
    }
  },

  // Violations
  async getViolations(santriIds?: string[]) {
    if (!db) return [];
    try {
      const colRef = collection(db, "violations");
      const q = (santriIds && santriIds.length > 0) 
        ? query(colRef, where("santriId", "in", santriIds)) 
        : colRef;
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, "violations");
      return [];
    }
  },

  async saveViolation(violation: any) {
    if (!db) return;
    try {
      const id = violation.id || Date.now().toString();
      await setDoc(doc(db, "violations", id), {
        ...violation,
        id,
        date: violation.date || new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `violations/${violation.id}`);
    }
  },

  async deleteViolation(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "violations", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `violations/${id}`);
    }
  },

  // Information
  async getInformation() {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, "information"));
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, "information");
      return [];
    }
  },

  async saveInformation(info: any) {
    if (!db) return;
    try {
      const id = info.id || Date.now().toString();
      await setDoc(doc(db, "information", id), {
        ...info,
        id,
        date: info.date || new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `information/${info.id}`);
    }
  },

  async deleteInformation(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "information", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `information/${id}`);
    }
  }
};
