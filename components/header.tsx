"use client"

import type React from "react"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User, LogOut, Gavel, Plus, Wallet, Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Header() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const isAuthenticated = !!session

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/auctions?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Gavel className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              BidToBuy
            </span>
          </Link>

          {/* Desktop Navigation - Only show for authenticated users */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/auctions" className="text-sm font-medium hover:text-primary transition-colors">
                Auctions
              </Link>
              {/* <Link href="/sell" className="text-sm font-medium hover:text-primary transition-colors">
                Sell
              </Link> */}
            </nav>
          )}
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-4">
          {/* Search - Only show for authenticated users */}
          {isAuthenticated && (
            <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search auctions..."
                  className="pl-8 w-[200px] lg:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          )}

          {/* Authentication Actions */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Quick Sell Button */}
              <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                <Link href="/wallet">
                  <Plus className="h-4 w-4 mr-1" />
                  Wallet
                </Link>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{session.user?.name || "Account"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="cursor-pointer">
                      <Wallet className="h-4 w-4 mr-2" />
                      Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col gap-4 mt-8">
                    <Link href="/" className="text-lg font-medium hover:text-primary">
                      Dashboard
                    </Link>
                    <Link href="/auctions" className="text-lg font-medium hover:text-primary">
                      Auctions
                    </Link>
                    <Link href="/sell" className="text-lg font-medium hover:text-primary">
                      Sell
                    </Link>
                    <Link href="/profile" className="text-lg font-medium hover:text-primary">
                      Profile
                    </Link>
                    <Link href="/wallet" className="text-lg font-medium hover:text-primary">
                      Wallet
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          ) : (
            // Unauthenticated state
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
