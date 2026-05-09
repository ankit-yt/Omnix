import type { Metadata } from "next"
import './globals.css'
import { Inter, Geist } from "next/font/google"
import React from "react"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })

export const metaData: Metadata = {
  title: "ERP Genius",
  description: "Ai assistant for ERP systems"
}

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}