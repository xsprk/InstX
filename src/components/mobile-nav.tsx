"use client";

import React from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";

import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { siteLinks } from "@/lib/constants";
import { Separator } from "./ui/separator";

export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);

  const pathname = usePathname();

  const handleCloseSheet = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className={className}>
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <h2 className="mb-4 text-center text-lg font-semibold">
          Menu
        </h2>
        <ul className="mb-8 space-y-3">
  {siteLinks.map((link) => (
    <li key={link.href}>
      <Button
        variant={pathname === link.href ? "default" : "outline"}
        asChild
      >
        <Link
          href={link.href}
          className="w-full"
          onClick={handleCloseSheet}
        >
          {link.name}
        </Link>
      </Button>
    </li>
  ))}

  {/* Created by Hari */}
  <li>
    <Button
      variant="outline"
      asChild
    >
      <Link
        href="/"
        className="w-full"
        onClick={handleCloseSheet}
      >
        Created by Hari
      </Link>
    </Button>
  </li>
</ul>
<Separator className="my-4" />
      </SheetContent>
    </Sheet>
  );
}
