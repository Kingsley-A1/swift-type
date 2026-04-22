"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit", label: "Audit" },
];

export function AdminPortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 -mb-px overflow-x-auto">
      {links.map((link) => {
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(`${link.href}/`) ||
              pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "px-4 py-3 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap",
              isActive
                ? "border-[#ff6b35] text-[#ff6b35]"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
