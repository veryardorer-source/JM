import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inpaint — 부분 수정 선택 도구",
  description: "이미지에서 수정할 영역을 칠하고 ChatGPT로 복사하세요.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

