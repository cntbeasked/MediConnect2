"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { MediConnectLogo } from "@/components/logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, User, LogOut, Star } from "lucide-react"

interface ClinicianHeaderProps {
  clinicianDetails: any
}

export function ClinicianHeader({ clinicianDetails }: ClinicianHeaderProps) {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const getInitials = (name: string) => {
    if (!name) return "CL"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/clinician/dashboard"
                  className="text-lg font-medium hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/clinician/dashboard/profile"
                  className="text-lg font-medium hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <Button
                  variant="ghost"
                  className="justify-start p-0 text-lg font-medium hover:underline"
                  onClick={() => {
                    signOut()
                    setIsOpen(false)
                  }}
                >
                  Sign Out
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          <MediConnectLogo />

          <nav className="hidden md:flex gap-6 ml-6">
            <Link href="/clinician/dashboard" className="text-lg font-medium hover:underline">
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {clinicianDetails && (
            <div className="hidden md:block text-right">
              <div className="flex items-center">
                <p className="text-lg font-medium">Dr. {clinicianDetails.fullName}</p>
                <div className="flex items-center ml-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1">{clinicianDetails.rating?.toFixed(1) || "5.0"}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{clinicianDetails.specialization}</p>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarFallback>
                    {clinicianDetails?.fullName ? getInitials(clinicianDetails.fullName) : "CL"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-base">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-base cursor-pointer" asChild>
                <Link href="/clinician/dashboard/profile">
                  <User className="mr-2 h-5 w-5" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-base cursor-pointer" onClick={() => signOut()}>
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

