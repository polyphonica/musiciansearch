"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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
        partners. Scaffold placeholder; the real signup/search flow lands in
        the MVP build.
      </p>
      <Button>Get started</Button>
    </div>
  );
}
