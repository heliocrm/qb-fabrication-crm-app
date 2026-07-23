"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  filterMaterialCatalog,
  isExactCatalogMatch,
} from "@/lib/material-catalog"
import { cn } from "@/lib/utils"

const BROWSE_LIMIT = 20
const SEARCH_LIMIT = 12

interface MaterialCatalogPickerProps {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  required?: boolean
  disabled?: boolean
  className?: string
  onChange?: (value: string) => void
}

export function MaterialCatalogPicker({
  id,
  name = "material",
  value: controlledValue,
  defaultValue = "",
  required,
  disabled,
  className,
  onChange,
}: MaterialCatalogPickerProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [query, setQuery] = useState(controlledValue ?? defaultValue)

  const isControlled = controlledValue !== undefined
  const selected = isControlled ? controlledValue : uncontrolled

  useEffect(() => {
    if (isControlled) setQuery(controlledValue)
  }, [controlledValue, isControlled])

  const matches = filterMaterialCatalog(
    query,
    query.trim() ? SEARCH_LIMIT : BROWSE_LIMIT
  )
  const showCustom =
    query.trim().length > 0 && !isExactCatalogMatch(query.trim())

  const optionCount = matches.length + (showCustom ? 1 : 0)

  function commit(next: string) {
    if (!isControlled) setUncontrolled(next)
    setQuery(next)
    onChange?.(next)
    setOpen(false)
    setHighlight(0)
  }

  function handleInputChange(next: string) {
    setQuery(next)
    if (!isControlled) setUncontrolled(next)
    onChange?.(next)
    setOpen(true)
    setHighlight(0)
  }

  useEffect(() => {
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = rootRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("touchstart", onPointerDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("touchstart", onPointerDown)
    }
  }, [])

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        setHighlight(0)
        return
      }
      setHighlight((h) => (optionCount === 0 ? 0 : (h + 1) % optionCount))
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        setHighlight(Math.max(optionCount - 1, 0))
        return
      }
      setHighlight((h) =>
        optionCount === 0 ? 0 : (h - 1 + optionCount) % optionCount
      )
      return
    }

    if (e.key === "Enter" && open && optionCount > 0) {
      e.preventDefault()
      if (highlight < matches.length) {
        commit(matches[highlight].label)
      } else if (showCustom) {
        commit(query.trim())
      }
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={selected} required={required} />
      <div className="relative">
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-required={required}
          disabled={disabled}
          autoComplete="off"
          placeholder="Search angles, WF, pipe…"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-h-11 pr-10 text-base md:text-sm"
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md"
        >
          {matches.map((item, index) => {
            const active = index === highlight
            return (
              <li key={item.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={cn(
                    "flex min-h-11 w-full items-center px-3 py-2.5 text-left text-base touch-manipulation md:text-sm",
                    active ? "bg-accent text-accent-foreground" : "hover:bg-muted/80"
                  )}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => commit(item.label)}
                >
                  {item.label}
                </button>
              </li>
            )
          })}

          {matches.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">
              {showCustom
                ? "No catalog matches."
                : "No matches. Type a custom material name."}
            </li>
          ) : null}

          {showCustom ? (
            <li role="option" aria-selected={highlight === matches.length}>
              <button
                type="button"
                className={cn(
                  "flex min-h-11 w-full items-center border-t border-border px-3 py-2.5 text-left text-base touch-manipulation md:text-sm",
                  highlight === matches.length
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/80"
                )}
                onMouseEnter={() => setHighlight(matches.length)}
                onClick={() => commit(query.trim())}
              >
                Use custom material &ldquo;{query.trim()}&rdquo;
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
