import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { SocketProvider } from "@/context/SocketContext";
import { auth } from "@clerk/nextjs/server";
import { syncUser } from "@/lib/syncUser";

export const metadata: Metadata = {
  title: "LearnLoop | Peer-to-Peer Knowledge Exchange",
  description: "Learn from your peers, teach what you know, and grow together.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { userId } = await auth();
  console.log("user id: ", userId);

  if(userId) {
    await syncUser();
  }
  
  return (
    <ClerkProvider>
      <html
        lang="en"
        className="h-full antialiased scroll-smooth"
      >
        <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
          <SocketProvider>
            {children}
          </SocketProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
