"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LogOut, User, MessageSquare, Calendar, Home } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

export function PatientNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/patient/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Chat",
      href: "/patient/dashboard/chat",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Appointments",
      href: "/patient/dashboard/appointments",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Profile",
      href: "/patient/dashboard/profile",
      icon: <User className="h-5 w-5" />,
    }
  ]

  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-4 mx-auto max-w-7xl">
        <Link href="/patient/dashboard" className="font-semibold text-lg mr-6">
          MediConnect
        </Link>
        <div className="hidden md:flex items-center gap-6 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="ml-auto">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
      <div className="md:hidden flex overflow-x-auto border-t px-4 py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-4 text-xs font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        ))}
      </div>
    </nav>
  )
} 