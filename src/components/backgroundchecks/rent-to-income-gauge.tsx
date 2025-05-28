"use client"

// Rent-to-income ratio ranges (lower is better)
const ratioRanges = [
  { name: "Excellent", min: 0, max: 25, color: "#4ade80" }, // Green
  { name: "Good", min: 25, max: 30, color: "#a3e635" }, // Light green
  { name: "Fair", min: 30, max: 40, color: "#fcd34d" }, // Yellow
  { name: "Concerning", min: 40, max: 50, color: "#f59e0b" }, // Orange
  { name: "Critical", min: 50, max: 100, color: "#f87171" }, // Red
]

// Function to determine if a section is active based on the ratio
const isSectionActive = (ratio: number, range: (typeof ratioRanges)[0]) => {
  return ratio >= range.min && ratio <= range.max
}

interface RentToIncomeGaugeProps {
  ratio?: number
}

export default function RentToIncomeGauge({ ratio = 28 }: RentToIncomeGaugeProps) {
  // Each section gets equal width
  const sectionWidth = 100 / ratioRanges.length

  return (
    <div className="w-full">
      {/* Rent-to-income gauge */}
      <div className="flex">
        {/* Ratio ranges - equal widths */}
        {ratioRanges.map((range, index) => {
          const isActive = isSectionActive(ratio, range)

          return (
            <div key={range.name} className="flex flex-col" style={{ width: `${sectionWidth}%` }}>
              {/* Gauge section - much brighter for active section */}
              <div
                className={`h-2 ${index === 0 ? "rounded-l-full" : ""} ${index === ratioRanges.length - 1 ? "rounded-r-full" : ""}`}
                style={{
                  backgroundColor: range.color,
                  opacity: isActive ? 1 : 0.3,
                  // Add a glow effect to the active section
                  boxShadow: isActive ? `0 0 8px ${range.color}` : "none",
                }}
              />

              {/* Label */}
              <div className="mt-3 flex items-start">
                <div
                  className="w-3 h-3 rounded-full mt-1 mr-2"
                  style={{
                    backgroundColor: range.color,
                    boxShadow: isActive ? `0 0 5px ${range.color}` : "none",
                  }}
                />
                <div className="flex flex-col">
                  <span className={`text-xs ${isActive ? "font-medium" : "text-gray-500"}`}>{range.name}</span>
                  <span className={`text-xs ${isActive ? "font-bold" : "font-semibold"}`}>
                    {range.min}
                    {index === ratioRanges.length - 1 ? "+" : `-${range.max}%`}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

