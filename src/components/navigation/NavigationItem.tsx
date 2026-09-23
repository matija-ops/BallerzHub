import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

type NavigationItemProps = {
  to: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  onNavigate?: () => void;
  end?: boolean;
  nested?: boolean;
};

function NavigationItem({
  to,
  icon: Icon,
  title,
  description,
  onNavigate,
  end = false,
  nested = false,
}: NavigationItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex min-h-16 w-full items-center gap-3 rounded-xl px-3 py-3",
          "transition-colors",
          "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none",
          nested && "min-h-12 pl-6",
          isActive
            ? "bg-primary/10 text-foreground"
            : "text-foreground hover:bg-muted"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              nested && "size-8 rounded-md",
              isActive
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className={nested ? "size-4" : "size-5"} />
          </span>

          <span className="min-w-0">
            <span className={cn("block font-medium", nested && "text-sm")}>
              {title}
            </span>

            {description && (
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {description}
              </span>
            )}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default NavigationItem;
