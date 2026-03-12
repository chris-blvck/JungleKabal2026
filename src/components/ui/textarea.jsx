import { cn } from "@/lib/utils"

function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn("flex min-h-[80px] w-full rounded-xl border border-white/20 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500", className)}
      {...props}
    />
  )
}

export { Textarea }
