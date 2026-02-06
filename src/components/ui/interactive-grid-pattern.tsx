"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface InteractiveGridPatternProps {
  className?: string
  children?: React.ReactNode
  /** Size of each grid cell in pixels */
  cellSize?: number
  /** Glow color on hover */
  glowColor?: string
  /** Border color of grid lines */
  borderColor?: string
  /** Mouse proximity radius for subtle highlighting */
  proximity?: number
}

interface CellState {
  hovered: boolean
  proximity: number // 0-1 based on distance from mouse
}

export function InteractiveGridPattern({
  className,
  children,
  cellSize = 50,
  glowColor = "rgba(34, 211, 238, 0.4)",
  borderColor = "rgba(63, 63, 70, 0.4)",
  proximity = 100,
}: InteractiveGridPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef({ rows: 0, cols: 0, scale: 1 })
  const [grid, setGrid] = useState({ rows: 0, cols: 0, scale: 1 })
  const [hoveredCell, setHoveredCell] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })

  // Keep ref in sync so global listener always has latest dimensions
  gridRef.current = grid

  const updateGrid = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { width, height } = container.getBoundingClientRect()
    const scale = Math.max(1, Math.min(width, height) / 800)
    const scaledCellSize = cellSize * scale

    const cols = Math.ceil(width / scaledCellSize) + 1
    const rows = Math.ceil(height / scaledCellSize) + 1

    setGrid({ rows, cols, scale })
  }, [cellSize])

  useEffect(() => {
    updateGrid()
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(updateGrid)
    ro.observe(container)
    return () => ro.disconnect()
  }, [updateGrid])

  // Global pointer listeners so the grid reacts to cursor anywhere on the page
  // (content layer sits on top and would otherwise block grid mouse events)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePos({ x, y })
      const g = gridRef.current
      const scaledCellSize = cellSize * g.scale
      const { cols, rows } = g
      if (cols > 0 && rows > 0 && scaledCellSize > 0) {
        const col = Math.floor(x / scaledCellSize)
        const row = Math.floor(y / scaledCellSize)
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          setHoveredCell(row * cols + col)
          return
        }
      }
      setHoveredCell(null)
    }

    const onLeave = () => {
      setMousePos({ x: -1000, y: -1000 })
      setHoveredCell(null)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)

    return () => {
      window.removeEventListener("mousemove", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeave)
    }
  }, [cellSize])

  const scaledCellSize = cellSize * grid.scale
  const scaledProximity = proximity * grid.scale

  return (
    <div
      ref={containerRef}
      className={cn("fixed inset-0 overflow-hidden bg-neutral-950", className)}
      aria-hidden
    >
      {/* Grid */}
      <div className="absolute inset-0">
        {Array.from({ length: grid.rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex">
            {Array.from({ length: grid.cols }).map((_, colIndex) => {
              const index = rowIndex * grid.cols + colIndex
              const cellX = colIndex * scaledCellSize + scaledCellSize / 2
              const cellY = rowIndex * scaledCellSize + scaledCellSize / 2
              const dx = mousePos.x - cellX
              const dy = mousePos.y - cellY
              const distance = Math.sqrt(dx * dx + dy * dy)
              const proximityFactor = Math.max(0, 1 - distance / scaledProximity)
              const isHovered = hoveredCell === index

              return (
                <div
                  key={index}
                  className="shrink-0 border transition-all duration-1000 ease-out"
                  style={{
                    width: scaledCellSize,
                    height: scaledCellSize,
                    borderColor: borderColor,
                    backgroundColor: isHovered
                      ? glowColor
                      : proximityFactor > 0
                        ? glowColor.replace(/[\d.]+\)$/, `${proximityFactor * 0.15})`)
                        : "transparent",
                    boxShadow: isHovered
                      ? `0 0 ${20 * grid.scale}px ${glowColor}, inset 0 0 ${10 * grid.scale}px ${glowColor.replace(/[\d.]+\)$/, "0.2)")}`
                      : "none",
                    transitionDuration: isHovered ? "0ms" : "1000ms",
                  }}
                  onMouseEnter={() => setHoveredCell(index)}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Center ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
        style={{
          width: "60vmin",
          height: "60vmin",
          background: `radial-gradient(circle, ${glowColor.replace(/[\d.]+\)$/, "0.3)")} 0%, transparent 70%)`,
        }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(10,10,10,0.8) 100%)",
        }}
      />

      {/* Content layer */}
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  )
}

export default function InteractiveGridPatternDemo() {
  return <InteractiveGridPattern />
}
