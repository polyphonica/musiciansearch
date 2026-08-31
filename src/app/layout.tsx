import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { getCurrentUser } from "@/lib/auth";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "variable",
  axes: ["SOFT", "WONK", "opsz"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: "MusicianSearch",
  description: "Find musicians to play with — bandmates, accompanists, and jam partners.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavBar user={user ? { isAdmin: user.isAdmin } : null} />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
