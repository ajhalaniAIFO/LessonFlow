import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LessonFlow",
  description: "Local-LLM-first lesson generation app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
