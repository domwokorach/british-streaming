"use client"

import * as React from "react"
import { Autocomplete } from "@base-ui/react/autocomplete"
import { cn } from "cn"

import { InputGroupInput } from "@/components/ui/input-group"

/** Root: drives an always-visible search-as-you-type list (no trigger button), built on Base UI's Autocomplete. */
const Command = Autocomplete.Root

function CommandInput({ className, ...props }: Autocomplete.Input.Props) {
  return (
    <Autocomplete.Input
      render={<InputGroupInput data-slot="command-input" />}
      className={cn(className)}
      {...props}
    />
  )
}

function CommandList({
  className,
  children,
  emptyMessage,
  sideOffset = 8,
  ...props
}: Autocomplete.List.Props &
  Pick<Autocomplete.Positioner.Props, "sideOffset"> & {
    emptyMessage?: React.ReactNode
  }) {
  return (
    <Autocomplete.Portal>
      <Autocomplete.Positioner sideOffset={sideOffset} className="isolate z-50 w-(--anchor-width)">
        <Autocomplete.Popup
          data-slot="command-popup"
          className="group/command-list max-h-(--available-height) w-full origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          {emptyMessage !== undefined && <CommandEmpty>{emptyMessage}</CommandEmpty>}
          <Autocomplete.List
            data-slot="command-list"
            className={cn("no-scrollbar max-h-(--available-height) overflow-y-auto overscroll-contain p-1", className)}
            {...props}
          >
            {children}
          </Autocomplete.List>
        </Autocomplete.Popup>
      </Autocomplete.Positioner>
    </Autocomplete.Portal>
  )
}

function CommandGroup({ className, heading, children, ...props }: React.ComponentProps<"div"> & { heading?: React.ReactNode }) {
  return (
    <div data-slot="command-group" className={cn("py-1 first:pt-0 last:pb-0", className)} {...props}>
      {heading && <div className="px-2 pb-1 text-xs font-medium text-muted-foreground select-none">{heading}</div>}
      {children}
    </div>
  )
}

function CommandItem({ className, ...props }: Autocomplete.Item.Props) {
  return (
    <Autocomplete.Item
      data-slot="command-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({ className, ...props }: Autocomplete.Empty.Props) {
  return (
    <Autocomplete.Empty
      data-slot="command-empty"
      className={cn("hidden py-6 text-center text-sm text-muted-foreground group-data-empty/command-list:flex", className)}
      {...props}
    />
  )
}

export { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty }
