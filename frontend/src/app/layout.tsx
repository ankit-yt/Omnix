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
  title: "Ominx",
  description: "AI-powered chatbots that turn your website's knowledge into instant, accurate answers."
}

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        
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