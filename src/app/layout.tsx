import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import '@solana/wallet-adapter-react-ui/styles.css';
import AiAssistant from '@/components/AiAssistant';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IMU",
  description: "The AI Agent designed for trenchers",
  icons: {
    icon: '/imuicon.png',
    shortcut: '/imuicon.png',
    apple: '/imuicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-black`}>
        <Providers>
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <AiAssistant />
        </Providers>
      </body>
    </html>
  );
}
