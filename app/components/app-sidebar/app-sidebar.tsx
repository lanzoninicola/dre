
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calculator, SquareMenu, User2, Bell, LogOut, LucideIcon, ChevronRight } from "lucide-react"
import { User } from "@prisma/client"
import { Link } from "@remix-run/react"
import { SIDEBAR_MENU_ITEMS } from "~/domain/navigation/sidebar-menu-items"
import { INavItem } from "~/domain/navigation/navigation.types"
import { useState } from "react"
import { Separator } from "../ui/separator"


interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User
}




export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/home" className="hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-3">

                  <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-white" />
                  </div>

                  <h1 className="text-md font-semibold text-gray-900">
                    FinanceFlow
                  </h1>

                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={SIDEBAR_MENU_ITEMS.navMain} />
        <Separator />
        <NavMain items={SIDEBAR_MENU_ITEMS.navSecondary || []} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

export function NavUser({
  user,
}: {
  user: User
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user?.avatar} alt={user.name || ""} />
                <AvatarFallback className="rounded-lg uppercase">{`${user.name?.slice(0, 2)}`}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <SquareMenu size={16} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User2 size={16} />
                Account
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Bell size={16} />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Link to="/logout">
              <DropdownMenuItem>

                <LogOut size={16} />
                Log out

              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

interface NavMainProps {
  items: INavItem[]
}

export function NavMain({ items }: NavMainProps) {
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());

  const toggleSubmenu = (itemLabel: string) => {
    setOpenSubmenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemLabel)) {
        newSet.delete(itemLabel);
      } else {
        newSet.add(itemLabel);
      }
      return newSet;
    });
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.label} >
              {item.subMenu ? (
                // Item with submenu
                <>
                  <SidebarMenuButton
                    tooltip={item.label}
                    onClick={() => toggleSubmenu(item.label)}
                    className="cursor-pointer"
                  >
                    {item.icon && <item.icon size={16} />}
                    <span>{item.label}</span>
                    <ChevronRight
                      className={`ml-auto h-4 w-4 transition-transform ${openSubmenus.has(item.label) ? 'rotate-90' : ''
                        }`}
                    />
                  </SidebarMenuButton>
                  {openSubmenus.has(item.label) && (
                    <SidebarMenuSub>
                      {item.subMenu.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.label}>
                          <SidebarMenuSubButton asChild>
                            <Link
                              to={subItem.href}
                              className="hover:opacity-80 transition-opacity"
                            >
                              <span>{subItem.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </>
              ) : (
                // Regular item without submenu
                <SidebarMenuButton tooltip={item.label}>
                  <Link
                    to={item.href}
                    className="hover:opacity-80 transition-opacity flex items-center gap-2 w-full"
                  >
                    {item.icon && <item.icon size={16} />}
                    <span className="tracking-normal">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

