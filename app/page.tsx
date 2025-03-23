import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MediConnectLogo } from "@/components/logo"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <div className="flex items-center justify-between w-full">
          <MediConnectLogo />
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/login" className="text-lg font-medium hover:underline underline-offset-4">
              Log In
            </Link>
            <Link href="/register" className="text-lg font-medium hover:underline underline-offset-4">
              Register
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">MediConnect</h1>
                <p className="mx-auto max-w-[700px] text-xl md:text-2xl text-muted-foreground">
                  Patient-Clinician Portal for Connected Care and Healthy Aging
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg" className="text-lg">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="text-lg">
                    Log In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold">For Patients</h3>
                <p className="text-muted-foreground">Get reliable medical information verified by real clinicians</p>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold">For Clinicians</h3>
                <p className="text-muted-foreground">Help patients by verifying AI-generated medical information</p>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold">Easy to Use</h3>
                <p className="text-muted-foreground">Designed with accessibility in mind for users of all ages</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="mt-auto py-6 text-center text-muted-foreground">
        © 2025 MediConnect. All rights reserved.
      </footer>
    </div>
  )
}

