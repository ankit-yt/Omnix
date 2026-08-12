import type { Metadata } from "next"
import './globals.css'
import { Inter, Geist } from "next/font/google"
import React from "react"
import { cn } from "@/lib/utils";

import { Toaster } from "sonner";
import Script from "next/script";
const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })

export const metaData: Metadata = {
  title: "ERP Genius",
  description: "Ai assistant for ERP systems"
}

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <Script
  src="http://localhost:5001/widget.js"
  data-workspace-id="6a74a84ecdc5133dad8c5f5d"
/>
      </head>
      <body className={inter.className}>
        
        {children}
         <Toaster
          position="top-right"
          richColors
          expand
        />
      </body>
    </html>
  )
}