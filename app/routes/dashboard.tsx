// routes/dashboard.tsx
import { json, LoaderFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import {
  TrendingUp,
  DollarSign,
  FileText,
  Users,

  Calculator,
  Bell,
  LogOut,
  User,
  DotSquare,
  User2,
  SquareMenu
} from "lucide-react";
import { GradientButton } from "~/components/layouts/gradient-button";
import { Navbar } from "~/components/layouts/nav-bar";
import { Sidebar, SidebarProvider, SidebarInset, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarFooter, useSidebar } from "~/components/ui/sidebar";
import { requireUser } from "~/domain/auth/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);

  return json({
    user
  })
}

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        {/* <SiteHeader /> */}

        <Outlet />
      </SidebarInset>
    </SidebarProvider>


  );
}

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: "IconDashboard",
    },
    {
      title: "Lifecycle",
      url: "#",
      icon: "IconListDetails",
    },
    {
      title: "Analytics",
      url: "#",
      icon: "IconChartBar",
    },
    {
      title: "Projects",
      url: "#",
      icon: "IconFolder",
    },
    {
      title: "Team",
      url: "#",
      icon: "IconUsers",
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: "IconCamera",
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: "IconFileDescription",
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: "IconFileAi",
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: "IconSettings",
    },
    {
      title: "Get Help",
      url: "#",
      icon: "IconHelp",
    },
    {
      title: "Search",
      url: "#",
      icon: "IconSearch",
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: "IconDatabase",
    },
    {
      name: "Reports",
      url: "#",
      icon: "IconReport",
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: "IconFileWord",
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-3">

                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-white" />
                  </div>

                  <h1 className="text-xl font-semibold text-gray-900">
                    FinanceFlow
                  </h1>

                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>



      </SidebarContent>
      <SidebarFooter>
        <NavUser user={props?.user} />
      </SidebarFooter>
    </Sidebar>
  )
}





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
import { DropdownMenuIcon } from "@radix-ui/react-icons";


export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
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
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
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
