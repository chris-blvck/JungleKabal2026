import { cn } from "@/lib/utils"

function Card({ className, ...props }) {
  return <div className={cn("rounded-2xl border border-white/10 bg-zinc-900/80 shadow", className)} {...props} />
}
function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
}
function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-xl font-semibold leading-none tracking-tight text-white", className)} {...props} />
}
function CardContent({ className, ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardContent }
