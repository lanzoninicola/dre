import { LucideIcon } from "lucide-react";

export interface INavItem {
  label: string;
  href: string;
  icon?: LucideIcon | ((props: React.SVGProps<SVGSVGElement>) => JSX.Element);
  active?: Boolean;
  subMenu?: INavItem[];
}

export interface SidebarMenuItems {
  navMain: INavItem[];
  navSecondary?: INavItem[];
}
