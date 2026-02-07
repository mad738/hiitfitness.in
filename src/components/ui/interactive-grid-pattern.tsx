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

export function InteractiveGridPattern({
  className,
  children,
  cellSize = 50,
  glowColor = "rgba(255, 0, 0, 0.4)",
  borderColor = "rgba(255, 255, 255, 0.12)",
  proximity = 100,
}: InteractiveGridPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef({ rows: 0, cols: 0, scale: 1 })
  const [grid, setGrid] = useState({ rows: 0, cols: 0, scale: 1 })
  const [hoveredCell, setHoveredCell] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
  const [patternPos, setPatternPos] = useState({ x: -1000, y: -1000 })
  const [enableGlow, setEnableGlow] = useState(false)

  // Enable cursor-following glow only on devices with a fine pointer (mouse); mobile/tablet use pattern animation
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)")
    const update = () => setEnableGlow(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  // On mobile/tablet: animate a glow position along a smooth pattern (Lissajous-style) so the grid feels alive
  useEffect(() => {
    if (enableGlow) return
    const container = containerRef.current
    if (!container) return

    let rafId: number
    const start = performance.now()

    const tick = () => {
      const rect = container.getBoundingClientRect()
      const { width, height } = rect
      const centerX = width / 2
      const centerY = height / 2
      const radiusX = width * 0.32
      const radiusY = height * 0.22
      const t = (performance.now() - start) / 1000
      const x = centerX + radiusX * Math.sin(t * 0.45)
      const y = centerY + radiusY * Math.sin(t * 0.65 + 0.5)
      setPatternPos({ x, y })
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [enableGlow])

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

  // Global pointer listeners so the grid reacts to cursor anywhere (desktop only; disabled on mobile)
  useEffect(() => {
    if (!enableGlow) return
    const container = containerRef.current
    if (!container) return

    const onMove = (e: PointerEvent) => {
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

    // pointerdown: show effect immediately on touch/mouse down (no need to drag first)
    window.addEventListener("pointerdown", onMove, { passive: true })
    window.addEventListener("pointermove", onMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)
    document.documentElement.addEventListener("pointercancel", onLeave)
    document.documentElement.addEventListener("pointerup", onLeave)

    return () => {
      window.removeEventListener("pointerdown", onMove)
      window.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      document.documentElement.removeEventListener("pointercancel", onLeave)
      document.documentElement.removeEventListener("pointerup", onLeave)
    }
  }, [cellSize, enableGlow])

  const scaledCellSize = cellSize * grid.scale
  const scaledProximity = proximity * grid.scale
  const glowPos = enableGlow ? mousePos : patternPos

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
              const dx = glowPos.x - cellX
              const dy = glowPos.y - cellY
              const distance = Math.sqrt(dx * dx + dy * dy)
              const proximityFactor = Math.max(0, 1 - distance / scaledProximity)
              const isHovered = enableGlow && hoveredCell === index

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
                  onPointerEnter={enableGlow ? () => setHoveredCell(index) : undefined}
                  onPointerLeave={enableGlow ? () => setHoveredCell(null) : undefined}
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
