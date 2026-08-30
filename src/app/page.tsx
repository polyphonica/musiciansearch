"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-4xl font-semibold tracking-tight"
      >
        MusicianSearch
      </motion.h1>
      <p className="max-w-md text-muted-foreground">
        Find musicians to play with — bandmates, accompanists, and jam
        partners. Search and messaging land after signup/verification; this
        is the first working slice of the MVP.
      </p>
      <Link href="/signup" className={buttonVariants({})}>
        Get started
      </Link>
    </div>
  );
}
