"use client"

// Score ranges based on the provided image
const scoreRanges = [
  { name: "Low", min: 360, max: 559, color: "#f87171" },
  { name: "Fair", min: 560, max: 639, color: "#f59e0b" },
  { name: "Good", min: 640, max: 699, color: "#fcd34d" },
  { name: "Great", min: 700, max: 759, color: "#a3e635" },
  { name: "Excellent", min: 760, max: 850, color: "#4ade80" },
]

// Function to determine if a section is active based on the score
const isSectionActive = (score: number, range: (typeof scoreRanges)[0]) => {
  return score >= range.min && score <= range.max
}

interface CreditScoreGaugeProps {
  score?: number
}

export default function CreditScoreGauge({ score = 613 }: CreditScoreGaugeProps) {
  // Each section gets equal width (20% since we have 5 sections)
  const sectionWidth = 100 / scoreRanges.length

  return (
    <div className="w-full max-w-full mx-auto">
      {/* Credit score gauge */}
      <div className="flex">
        {/* Score ranges - now with equal widths */}
        {scoreRanges.map((range, index) => {
          const isActive = isSectionActive(score, range)

          return (
            <div key={range.name} className="flex flex-col" style={{ width: `${sectionWidth}%` }}>
              {/* Gauge section - much brighter for active section */}
              <div
                className={`h-2 ${index === 0 ? "rounded-l-full" : ""} ${index === scoreRanges.length - 1 ? "rounded-r-full" : ""}`}
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
                    {index === scoreRanges.length - 1 ? "+" : `-${range.max}`}
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

