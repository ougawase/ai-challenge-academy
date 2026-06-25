'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Map,
  User,
  Brain,
  Globe,
  FolderOpen,
  BookOpen,
  FileText,
  LogOut,
  Menu,
  Lightbulb,
  GitMerge,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

const navGroups: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'ホーム', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/roadmap', label: 'ロードマップ', icon: Map },
    ],
  },
  {
    label: '自分を知る',
    items: [
      { href: '/dashboard/profile', label: 'プロフィール', icon: User },
      { href: '/dashboard/self-analysis', label: 'AI自己分析', icon: Brain },
      { href: '/dashboard/social-issues', label: '社会課題診断', icon: Globe },
    ],
  },
  {
    label: '実績を作る',
    items: [
      { href: '/dashboard/guidance', label: '活動提案', icon: Lightbulb },
      { href: '/dashboard/projects', label: 'プロジェクト', icon: FolderOpen },
      { href: '/dashboard/activity-logs', label: '活動ログ', icon: BookOpen },
    ],
  },
  {
    label: '書類を作る',
    items: [
      { href: '/dashboard/essays', label: '志望理由書', icon: FileText },
      { href: '/dashboard/consistency-check', label: '一貫性チェック', icon: GitMerge },
    ],
  },
]

function NavLinks({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ブランドヘッダー */}
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href="/dashboard" onClick={onClose} className="block group">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">AI Challenge</p>
              <p className="font-bold text-blue-600 text-sm leading-tight">Academy</p>
            </div>
          </div>
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-blue-600' : 'text-gray-400')} />
                    <span>{item.label}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ログアウト */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <LogOut className="h-4 w-4 text-gray-400" />
          ログアウト
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-56 md:flex-col border-r border-gray-100 min-h-screen bg-white">
      <NavLinks />
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-56 border-r border-gray-100">
        <NavLinks onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
