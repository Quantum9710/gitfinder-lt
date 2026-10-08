import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  query,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import firebaseConfig from '../firebase-applet-config.json'

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// CRITICAL: Must pass databaseId from firebase-applet-config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string
  operationType: OperationType
  path: string | null
  authInfo: {
    userId?: string | null
    email?: string | null
    emailVerified?: boolean | null
    isAnonymous?: boolean | null
    tenantId?: string | null
    providerInfo?: {
      providerId?: string | null
      email?: string | null
    }[]
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo))
  throw new Error(JSON.stringify(errInfo))
}

export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'))
    return true
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.')
    }
    return false
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    // Upsert user profile
    const userPath = `users/${user.uid}`
    try {
      await setDoc(
        doc(db, userPath),
        {
          uid: user.uid,
          displayName: user.displayName || 'Developer',
          email: user.email || '',
          photoURL: user.photoURL || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userPath)
    }

    return user
  } catch (err) {
    console.error('Google Sign-in failed:', err)
    throw err
  }
}

export async function logOut() {
  return signOut(auth)
}

export interface SavedBookmark {
  id: string
  userId: string
  repoId: number
  fullName: string
  description: string
  htmlUrl: string
  stars: number
  forks: number
  language: string
  ownerLogin: string
  ownerAvatarUrl: string
  createdAt?: string
}

export async function saveRepositoryBookmark(user: User, repo: {
  id: number
  full_name: string
  description?: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language?: string | null
  owner: {
    login: string
    avatar_url: string
  }
}) {
  const bookmarkId = String(repo.id)
  const path = `users/${user.uid}/bookmarks/${bookmarkId}`
  try {
    await setDoc(doc(db, path), {
      id: bookmarkId,
      userId: user.uid,
      repoId: repo.id,
      fullName: repo.full_name,
      description: repo.description || '',
      htmlUrl: repo.html_url,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language || '',
      ownerLogin: repo.owner.login,
      ownerAvatarUrl: repo.owner.avatar_url,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path)
  }
}

export async function removeRepositoryBookmark(userId: string, repoId: number) {
  const path = `users/${userId}/bookmarks/${repoId}`
  try {
    await deleteDoc(doc(db, path))
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path)
  }
}

export function subscribeToBookmarks(
  userId: string,
  onUpdate: (bookmarks: SavedBookmark[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/bookmarks`
  const colRef = collection(db, path)
  return onSnapshot(
    query(colRef),
    (snapshot) => {
      const items: SavedBookmark[] = []
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as SavedBookmark)
      })
      onUpdate(items)
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path)
      onError?.(error)
    }
  )
}
