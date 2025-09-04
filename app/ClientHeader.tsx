"use client";
import Header from "./Header";
import { usePathname } from "next/navigation";

export default function ClientHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <Header />;
}
