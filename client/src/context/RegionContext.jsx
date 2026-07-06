import { createContext, useContext, useState, useMemo } from "react";

const RegionContext = createContext(null);

export const ALL_REGIONS = [
 {
 id: "goa",
 name: "Goa",
 flag: "🇮🇳",
 color: "sky",
 gradient: "from-sky-500 to-blue-600",
 bgGlow: "bg-sky-500/10 border-sky-500/30",
 activeBg: "bg-gradient-to-br from-sky-500/20 to-blue-600/10 border-sky-400/50",
 zones: ["Goa", "North Goa", "South Goa", "Central Goa", "All Goa"],
 capital: "Panaji",
 stats: { teams: 4, users: 8, sites: 12 },
 },
 {
 id: "bhutan",
 name: "Bhutan",
 flag: "🇧🇹",
 color: "amber",
 gradient: "from-amber-500 to-orange-600",
 bgGlow: "bg-amber-500/10 border-amber-500/30",
 activeBg: "bg-gradient-to-br from-amber-500/20 to-orange-600/10 border-amber-400/50",
 zones: ["Bhutan", "Thimphu", "Paro"],
 capital: "Thimphu",
 stats: { teams: 2, users: 4, sites: 6 },
 },
];

export function RegionProvider({ children }) {
 const [selectedRegionId, setSelectedRegionId] = useState(null); // null = all regions

 const selectedRegion = useMemo(
 () => ALL_REGIONS.find((r) => r.id === selectedRegionId) || null,
 [selectedRegionId]
 );

 const value = useMemo(
 () => ({
 selectedRegion,
 selectedRegionId,
 setSelectedRegionId,
 allRegions: ALL_REGIONS,
 isRegionSelected: Boolean(selectedRegionId),
 }),
 [selectedRegion, selectedRegionId]
 );

 return (
 <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
 );
}

export function useRegion() {
 const ctx = useContext(RegionContext);
 if (!ctx) throw new Error("useRegion must be used within RegionProvider");
 return ctx;
}
