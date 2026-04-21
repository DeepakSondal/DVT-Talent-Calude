import * as React from "react"
import { cn } from "@/lib/utils"

const Dialog = ({ children }: { children: React.ReactNode }) => <div className="fixed inset-0 z-50 overflow-y-auto">{children}</div>
const DialogTrigger = ({ children, asChild }: any) => <>{children}</>
const DialogContent = ({ children, className }: any) => (
  <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
    <div className={cn("relative transform overflow-hidden rounded-lg bg-background text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg", className)}>
      {children}
    </div>
  </div>
)
const DialogHeader = ({ children, className }: any) => <div className={cn("px-4 pb-4 pt-5 sm:p-6 sm:pb-4", className)}>{children}</div>
const DialogTitle = ({ children, className }: any) => <h3 className={cn("text-base font-semibold leading-6 text-foreground", className)}>{children}</h3>
const DialogFooter = ({ children, className }: any) => <div className={cn("px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6", className)}>{children}</div>

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter }
