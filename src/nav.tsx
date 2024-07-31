
import { LucideIcon } from "lucide-react"
import { useLocation, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavProps {
  isCollapsed: boolean
  links: {
    
    title: string
    label?: string
    path:string,
    icon: LucideIcon
    variant: "default" | "ghost"
  }[]
}

export function Nav({ links, isCollapsed }: NavProps) {
  const location = useLocation(); 
  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) =>
          isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                   to={link.path}
                  className={cn(
                    buttonVariants({ variant:  link.path === location.pathname? 'default': 'ghost', size: "icon" }),
                    "h-9 w-9",
                    link.variant === 'default' &&
                      "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                  )}
                >
                  <link.icon className={cn("w-4 h-4", link.path === location.pathname && "animate-spin")} />
                  <span className="sr-only">{link.title}</span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && (
                  <span className="ml-auto text-muted-foreground">
                    {link.label}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              key={index}
              to={ link.path} 
              className={cn(
                buttonVariants({ variant:  link.path === location.pathname? 'default': 'ghost', size: "sm" }),
                link.variant === "default" &&
                  "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
                "justify-start"
              )}
            >
             <link.icon className={cn("w-4 h-4 mr-2", link.path === location.pathname && "animate-spin")} />
              {link.title}
              {link.label && (
                <span
                  className={cn(
                    "ml-auto",
                    link.variant === "default" &&
                      "text-background dark:text-white"
                  )}
                >
                  {link.label}
                </span>
              )}
            </NavLink>
          )
        )}
      </nav>
    </div>
  )
}
