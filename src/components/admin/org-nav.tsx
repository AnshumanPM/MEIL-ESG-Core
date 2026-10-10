"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Globe, Building, FolderTree, MapPin } from "lucide-react";

const navItems = [
  {
    label: "Groups",
    href: "/dashboard/admin/groups",
    icon: Globe,
  },
  {
    label: "Companies",
    href: "/dashboard/admin/companies",
    icon: Building,
  },
  {
    label: "Business Units",
    href: "/dashboard/admin/business-units",
    icon: FolderTree,
  },
  {
    label: "Projects & Sites",
    href: "/dashboard/admin/sites",
    icon: MapPin,
  },
];

export function OrgHierarchyNav() {
  const pathname = usePathname();

  return (
    <div className="border-border flex flex-wrap items-center gap-2 border-b pb-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                : "border-border bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
