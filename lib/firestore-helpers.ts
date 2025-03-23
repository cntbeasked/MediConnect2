import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  DocumentReference,
  DocumentData,
  CollectionReference,
  QueryConstraint
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Type-safe wrapper for Firestore collection
 * @param collectionName Name of the collection
 * @returns Properly typed collection reference
 */
export function getCollection<T = DocumentData>(collectionName: string): CollectionReference<T> {
  return collection(db, collectionName) as CollectionReference<T>;
}

/**
 * Type-safe wrapper for Firestore document
 * @param collectionName Name of the collection
 * @param docId Document ID
 * @returns Properly typed document reference
 */
export function getDocument<T = DocumentData>(collectionName: string, docId: string): DocumentReference<T> {
  return doc(db, collectionName, docId) as DocumentReference<T>;
}

/**
 * Add a document to a collection with type safety
 * @param collectionName Name of the collection
 * @param data Data to add
 * @returns Promise with document reference
 */
export async function addDocument<T>(collectionName: string, data: T) {
  return addDoc(getCollection(collectionName), {
    ...data,
    timestamp: serverTimestamp()
  });
}

/**
 * Update a document with type safety
 * @param collectionName Name of the collection
 * @param docId Document ID
 * @param data Data to update
 * @returns Promise
 */
export async function updateDocument<T>(collectionName: string, docId: string, data: Partial<T>) {
  return updateDoc(getDocument(collectionName, docId), data as DocumentData);
}

/**
 * Create a query with type safety
 * @param collectionName Name of the collection
 * @param constraints Query constraints (where, orderBy, etc.)
 * @returns Query
 */
export function createQuery<T = DocumentData>(collectionName: string, ...constraints: QueryConstraint[]) {
  return query(getCollection<T>(collectionName), ...constraints);
}

/**
 * Execute a query with type safety
 * @param collectionName Name of the collection
 * @param constraints Query constraints (where, orderBy, etc.)
 * @returns Promise with query snapshot
 */
export async function queryDocuments<T = DocumentData>(collectionName: string, ...constraints: QueryConstraint[]) {
  const q = createQuery<T>(collectionName, ...constraints);
  return getDocs(q);
}

// Re-export firebase functions and types for convenience
export {
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  getDoc
}; 