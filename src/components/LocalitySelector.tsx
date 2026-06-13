"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Plus, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const BENGALURU_LOCALITIES = [
  "Attibele",
  "Banashankari",
  "Bannerghatta Road",
  "Basavanagudi",
  "Bellandur",
  "Brookefield",
  "BTM Layout",
  "CV Raman Nagar",
  "Domlur",
  "Electronic City",
  "Hebbal",
  "Hennur",
  "Hoodi",
  "HSR Layout",
  "Indiranagar",
  "Jayanagar",
  "JP Nagar",
  "Kengeri",
  "Koramangala",
  "KR Puram",
  "Mahadevapura",
  "Malleshwaram",
  "Marathahalli",
  "Nagarbhavi",
  "Peenya",
  "Rajajinagar",
  "RR Nagar",
  "RT Nagar",
  "Sadashivanagar",
  "Sarjapur Road",
  "Thanisandra",
  "Ulsoor",
  "Vijayanagar",
  "Whitefield",
  "Yeshwanthpur"
]

export const POPULAR_LOCALITIES = [
  "Koramangala", "Indiranagar", "Jayanagar", "Whitefield", "HSR Layout"
]

interface LocalitySelectorProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function LocalitySelector({ value, onChange, error }: LocalitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customLocality, setCustomLocality] = useState("")
  
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredLocalities = BENGALURU_LOCALITIES.filter(loc => 
    loc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (loc: string) => {
    onChange(loc)
    setIsOpen(false)
    setSearchQuery("")
    setIsCustomMode(false)
  }

  const handleCustomSubmit = () => {
    if (customLocality.trim()) {
      onChange(customLocality.trim())
      setIsOpen(false)
      setIsCustomMode(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className={`w-full h-12 px-3 flex items-center justify-between rounded-xl border bg-background cursor-pointer transition-colors ${
          error ? 'border-red-500 bg-red-50/50 dark:bg-red-950/10' : 'border-input hover:border-primary/50'
        } ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <MapPin className={`w-4 h-4 shrink-0 ${value ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`truncate ${value ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            {value || "Select your locality"}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          {!isCustomMode ? (
            <div className="flex flex-col max-h-[300px]">
              <div className="p-3 border-b border-border/50 bg-secondary/30 sticky top-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    autoFocus
                    placeholder="Search localities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-lg border-border"
                  />
                </div>
              </div>

              <div className="overflow-y-auto p-2">
                {searchQuery === "" && (
                  <div className="mb-2">
                    <p className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Popular</p>
                    {POPULAR_LOCALITIES.map(loc => (
                      <div 
                        key={`pop-${loc}`}
                        onClick={() => handleSelect(loc)}
                        className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between ${
                          value === loc ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-secondary/50'
                        }`}
                      >
                        {loc}
                        {value === loc && <Check className="w-4 h-4" />}
                      </div>
                    ))}
                    <div className="h-px bg-border my-2 mx-2" />
                    <p className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">All Localities</p>
                  </div>
                )}

                {filteredLocalities.length > 0 ? (
                  filteredLocalities.map(loc => (
                    <div 
                      key={loc}
                      onClick={() => handleSelect(loc)}
                      className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between ${
                        value === loc ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-secondary/50'
                      }`}
                    >
                      {loc}
                      {value === loc && <Check className="w-4 h-4" />}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No matching localities found.
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-border/50 bg-secondary/30">
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full text-sm font-medium border-dashed hover:border-primary hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsCustomMode(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Custom Locality
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-3">
              <h4 className="font-bold text-sm">Add Custom Locality</h4>
              <p className="text-xs text-muted-foreground mb-1">
                Enter your exact area/locality in Bengaluru.
              </p>
              <Input 
                autoFocus
                placeholder="e.g. Vidyaranyapura"
                value={customLocality}
                onChange={(e) => setCustomLocality(e.target.value)}
                className="h-10"
              />
              <div className="flex gap-2 mt-2">
                <Button 
                  type="button"
                  variant="ghost" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsCustomMode(false)
                  }}
                >
                  Back
                </Button>
                <Button 
                  type="button"
                  className="flex-1"
                  onClick={handleCustomSubmit}
                  disabled={!customLocality.trim()}
                >
                  Add Locality
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
