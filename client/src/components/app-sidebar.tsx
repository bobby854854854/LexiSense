import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Sparkles,
  Settings,
  Shield,
  AlertTriangle,
} from 'lucide-react'
import { Link, useLocation } from 'wouter'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar'

const menuItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    testId: 'link-dashboard',
  },
  {
    title: 'Contracts',
    url: '/contracts',
    icon: FileText,
    testId: 'link-contracts',
  },
  {
    title: 'AI Drafting',
    url: '/ai-drafting',
    icon: Sparkles,
    testId: 'link-ai-drafting',
  },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
    testId: 'link-analytics',
  },
  {
    title: 'Risk Monitor',
    url: '/risk',
    icon: AlertTriangle,
    testId: 'link-risk',
  },
]

const settingsItems = [
  {
    title: 'Compliance',
    url: '/compliance',
    icon: Shield,
    testId: 'link-compliance',
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    testId: 'link-settings',
  },
]

function MenuGroup({
  label,
  items,
  location,
}: {
  label: string
  items: typeof menuItems
  location: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={location === item.url}>
                <Link href={item.url} data-testid={item.testId}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const [location] = useLocation()

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">L</span>
          </div>
          <span className="font-bold text-lg">LexiSense</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <MenuGroup label="Main" items={menuItems} location={location} />
        <MenuGroup label="System" items={settingsItems} location={location} />
      </SidebarContent>
    </Sidebar>
  )
}
