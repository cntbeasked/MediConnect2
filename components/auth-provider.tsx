"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type UserRole = "patient" | "clinician" | null

interface AuthContextType {
  user: User | null
  userRole: UserRole
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, role: UserRole) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signUp: async () => {},
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Check if Firebase auth is available
  const isAuthAvailable = auth !== null

  useEffect(() => {
    // Only set up auth state listener if Firebase auth is available
    if (!isAuthAvailable) {
      setError("Firebase authentication is not available. Please check your configuration.")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user && db) {
        try {
          // Get user role from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role as UserRole)
          }
        } catch (err) {
          console.error("Error fetching user role:", err)
        }
      } else {
        setUserRole(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [isAuthAvailable])

  const signIn = async (email: string, password: string) => {
    if (!isAuthAvailable || !db) {
      toast({
        title: "Authentication Error",
        description: "Firebase authentication is not available. Please check your configuration.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)

      // Get user role and redirect accordingly
      const userDoc = await getDoc(doc(db, "users", auth.currentUser!.uid))
      if (userDoc.exists()) {
        const role = userDoc.data().role as UserRole
        if (role === "patient") {
          router.push("/patient/dashboard")
        } else if (role === "clinician") {
          router.push("/clinician/dashboard")
        }
      }
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    if (!isAuthAvailable || !db) {
      toast({
        title: "Authentication Error",
        description: "Firebase authentication is not available. Please check your configuration.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setError(null)
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", result.user.uid))

      if (!userDoc.exists()) {
        // New user, redirect to role selection
        router.push("/select-role")
      } else {
        // Existing user, redirect based on role
        const role = userDoc.data().role as UserRole
        if (role === "patient") {
          router.push("/patient/dashboard")
        } else if (role === "clinician") {
          router.push("/clinician/dashboard")
        }
      }
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error signing in with Google",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, role: UserRole) => {
    if (!isAuthAvailable || !db) {
      toast({
        title: "Authentication Error",
        description: "Firebase authentication is not available. Please check your configuration.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setError(null)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Store user role in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: userCredential.user.email,
        role: role,
        createdAt: new Date().toISOString(),
      })

      // Redirect based on role
      if (role === "patient") {
        router.push("/patient/onboarding")
      } else if (role === "clinician") {
        router.push("/clinician/onboarding")
      }
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!isAuthAvailable) {
      router.push("/")
      return
    }

    try {
      await firebaseSignOut(auth)
      router.push("/")
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        error,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

