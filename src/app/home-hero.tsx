"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function HomeHero({ primaryCta }: { primaryCta: { href: string; label: string } }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-1 flex-col items-center justify-center gap-7 bg-background px-6 text-center"
    >
      <motion.span
        variants={item}
        className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium tracking-wide text-primary"
      >
        Verified musicians only — never a dating app
      </motion.span>
      <motion.h1
        variants={item}
        className="text-5xl font-semibold tracking-tight md:text-7xl"
      >
        MusicianSearch
      </motion.h1>
      <motion.p variants={item} className="max-w-lg text-lg text-muted-foreground md:text-xl">
        Find musicians to play with — bandmates, accompanists, and jam
        partners. Messaging lands next; search is live now.
      </motion.p>
      <motion.div variants={item} className="flex flex-wrap justify-center gap-4">
        <Link href={primaryCta.href} className={cn(buttonVariants({ size: "lg" }))}>
          {primaryCta.label}
        </Link>
        <Link href="/musicians" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Browse musicians
        </Link>
      </motion.div>
    </motion.div>
  );
}
