import * as React from 'react'

import type { VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import { Button, type buttonVariants } from '@/components/ui/button'

interface MatterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: VariantProps<typeof buttonVariants>['size']
  children: React.ReactNode
  className?: string
  asChild?: boolean
  /** Hover glow color: 'red' (default, logo palette), 'cyan', or 'orange' */
  hoverGlowColor?: 'red' | 'cyan' | 'orange'
}

function MatterButton({ children, size, className, asChild = false, hoverGlowColor = 'red', ...props }: MatterButtonProps) {
  const isRedHover = hoverGlowColor === 'red'
  const isOrangeHover = hoverGlowColor === 'orange'
  return (
    <div
      className={cn(
        'relative inline-flex min-w-0 max-w-full overflow-hidden rounded-full p-[4px] backdrop-blur-xl transition-all duration-500 ease-out',
        'bg-white/[0.14] dark:bg-white/[0.1]',
        'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.28),inset_0_1px_0_rgba(255,255,255,0.22)]',
        'has-hover:bg-white/[0.18] has-hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.38),inset_0_1px_0_rgba(255,255,255,0.28)]',
        'dark:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.2)] dark:has-hover:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.3)]',
        className
      )}
    >
      <Button
        asChild={asChild}
        size={size}
        className={cn(
          'relative overflow-hidden rounded-full backdrop-blur-md text-white transition-[box-shadow] duration-500 ease-out w-auto min-w-0 font-semibold',
          'bg-black/90 hover:bg-black/95',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',

          // Fluid min-height: scales with viewport, keeps touch target
          'min-h-[clamp(2.75rem,5vw+2rem,3rem)]',

          // Top highlight – thin edge
          'before:absolute before:inset-0 before:block before:size-full before:rounded-full before:shadow-[inset_0_1px_2px_0_rgba(255,255,255,0.5)] before:transition-[box-shadow] before:duration-500 before:ease-out',

          // Hover glow – red (default), orange, or cyan – stronger glow
          isOrangeHover
            ? 'hover:shadow-[inset_0_-10px_32px_-4px_rgba(251,146,60,0.85),inset_0_-5px_16px_-2px_rgba(251,146,60,0.55)] hover:before:shadow-[inset_0_0.5px_1px_0_rgba(255,255,255,0.4)] dark:hover:shadow-[inset_0_-6px_20px_-2px_rgba(251,146,60,0.8),inset_0_-3px_10px_-1px_rgba(251,146,60,0.5)]'
            : isRedHover
              ? 'hover:shadow-[inset_0_-8px_24px_-4px_rgba(255,0,0,0.7),inset_0_-4px_12px_-2px_rgba(255,0,0,0.45)] hover:before:shadow-[inset_0_0.5px_1px_0_rgba(255,255,255,0.4)] dark:hover:shadow-[inset_0_-6px_18px_-2px_rgba(255,0,0,0.65),inset_0_-3px_10px_-1px_rgba(255,0,0,0.4)]'
              : 'hover:shadow-[inset_0_-8px_20px_-2px_rgba(25,175,253,0.7),inset_0_-4px_10px_-1px_rgba(25,175,253,0.45)] hover:before:shadow-[inset_0_0.5px_1px_0_rgba(255,255,255,0.4)] dark:hover:shadow-[inset_0_-5px_14px_-1px_rgba(25,175,253,0.65)]',

          // lg: same font/size as paired outline button (equal sizing)
          size === 'lg' &&
            '!h-auto py-[0.5em] px-[clamp(1rem,2vw+0.5rem,1.75rem)] text-[clamp(0.875rem,1.5vw+0.5rem,1rem)] has-[>svg]:px-[1em] has-[>svg]:sm:px-[1.25em]'
        )}
        {...props}
      >
        {children}
      </Button>
    </div>
  )
}

export { MatterButton, type MatterButtonProps }
