"use client"

import { useState } from "react"
import { Search, Shield } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Typewriter } from "@/components/ui/typewriter"

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <section className="relative py-20 md:py-32 overflow-hidden min-h-[600px] flex items-center">
      {/* Animation Styles */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 60s linear infinite;
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 60s linear infinite;
        }
      `}</style>

      {/* Background Decorative Layer */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer ring - spins clockwise */}
        <div className="absolute animate-spin-slow">
          <div
            className="rounded-full"
            style={{
              width: "700px",
              height: "700px",
              background: `conic-gradient(from 0deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.1))`,
              filter: "blur(40px)",
            }}
          />
        </div>

        {/* Middle ring - spins counter-clockwise */}
        <div className="absolute animate-spin-slow-reverse">
          <div
            className="rounded-full"
            style={{
              width: "500px",
              height: "500px",
              background: `conic-gradient(from 180deg, hsl(var(--accent) / 0.15), hsl(var(--primary) / 0.25), hsl(var(--accent) / 0.15))`,
              filter: "blur(30px)",
            }}
          />
        </div>

        {/* Inner ring - spins clockwise */}
        <div className="absolute animate-spin-slow">
          <div
            className="rounded-full"
            style={{
              width: "300px",
              height: "300px",
              background: `conic-gradient(from 90deg, hsl(var(--primary) / 0.2), hsl(var(--success) / 0.1), hsl(var(--primary) / 0.2))`,
              filter: "blur(20px)",
            }}
          />
        </div>
      </div>

      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, transparent 0%, hsl(var(--background)) 70%)`,
        }}
      />

      {/* Content Container */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Protecting Nigerian Consumers
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            <span className="text-foreground">Check Before You Pay.</span>{" "}
            <Typewriter
              words={["Protect Yourself."]}
              speed={80}
              delayBetweenWords={3000}
              cursor={true}
              cursorChar="|"
              className="text-primary"
            />
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 text-balance">
            BadVendor is Nigeria's verified misconduct registry. Search vendors before transacting 
            and report fraud to protect others in our community.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <div 
                className="flex flex-col sm:flex-row gap-3 p-2 rounded-full bg-card border border-border"
                style={{
                  boxShadow: `0 4px 20px hsl(var(--primary) / 0.1), inset 0 0 0 1px hsl(var(--border))`,
                }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by phone number, bank account number or social handle..."
                    className="pl-12 h-12 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8 rounded-full">
                  Search Vendor
                </Button>
              </div>
            </div>
          </form>

          <p className="text-sm text-muted-foreground mt-6">
            Over <span className="font-semibold text-foreground">2,500+</span> verified reports 
            protecting Nigerian consumers
          </p>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
