'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Activity, ArrowUpRight, Bell, BookOpen, Building2, CalendarCheck, ChartNoAxesCombined, ChevronDown, ChevronRight, ChevronsUpDown, CircleHelp, ClipboardList, Command, Files, FlaskConical, GraduationCap, LayoutDashboard, LockKeyhole, Menu, Moon, PanelLeftClose, Search, Settings2, ShieldCheck, Sun, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { TooltipProvider } from '@/components/ui/tooltip'
import { mockOperationsService, type PreviewState } from '@/lib/mock/operations'
import { DemoModeBanner, EmptyState, plannedFeature, type OpenPreview, type PreviewInfo } from './shared'

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard }, { name: 'Students', icon: GraduationCap },
  { name: 'Universities', icon: Building2 }, { name: 'Applications', icon: Files },
  { name: 'Tasks', icon: ClipboardList }, { name: 'Documents', icon: BookOpen }, { name: 'Reports', icon: ChartNoAxesCombined },
]
const administration = [{ name: 'Employees', icon: Users }, { name: 'Attendance', icon: CalendarCheck }, { name: 'Activity Log', icon: Activity }, { name: 'Settings', icon: Settings2 }]

export function SidebarNav({ onPreview, close }: { onPreview: OpenPreview; close?: () => void }) {
  return <div className="sidebar-inner">
    <Link href="/admin" className="brand" onClick={close} aria-label="UAIS Operations Hub home"><span className="brand-mark"><GraduationCap size={23} strokeWidth={1.7} /></span><span><strong>UAIS<span className="brand-web">web</span></strong><small>OPERATIONS HUB</small></span></Link>
    <div className="workspace-label"><span className="workspace-symbol">U</span><div><strong>UAIS workspace</strong><small>Demo organization</small></div><LockKeyhole size={13} /></div>
    <nav aria-label="Main navigation"><div className="nav-label">WORKSPACE</div>{navigation.map(({ name, icon: Icon }) => name === 'Dashboard' ? <Link key={name} href="/admin" aria-current="page" className="nav-item active" onClick={close}><Icon size={18} /><span>{name}</span><span className="nav-active-dot" /></Link> : <button key={name} className="nav-item" onClick={() => { close?.(); onPreview(plannedFeature(name)) }}><Icon size={18} /><span>{name}</span><span className="nav-planned">Planned</span></button>)}<div className="nav-label administration-label">ADMINISTRATION</div>{administration.map(({ name, icon: Icon }) => <button key={name} className="nav-item" onClick={() => { close?.(); onPreview(plannedFeature(name)) }}><Icon size={18} /><span>{name}</span><span className="nav-planned">Planned</span></button>)}</nav>
    <div className="sidebar-bottom"><div className="preview-note"><span className="preview-note-icon"><FlaskConical size={16} /></span><strong>A workspace in the making</strong><p>Explore the foundation.<br />The possibilities come next.</p><button onClick={() => onPreview({ title: 'About this prototype', description: 'Milestone 01 brings together the admin shell and operations dashboard. All people, figures, activity, and locks are fictional. The future Django API will provide authoritative records and permissions; desktop automation remains separate.' })}>About this preview <ArrowUpRight size={14} /></button></div><button className="help-button" onClick={() => onPreview({ title: 'A quick guide', description: 'Use the team and date filters to explore coordinated demo data. Search finds fictional employees, student codes, and planned sections. The profile menu includes theme and UI-state previews. Nothing is saved between sessions.' })}><CircleHelp size={17} />Help & getting started<ChevronRight size={14} /></button><div className="sidebar-version"><span>UAIS Web</span><span>v0.1 · Prototype</span></div></div>
  </div>
}

function DemoProfileMenu({ onPreview, setState, onTheme, dark }: { onPreview: OpenPreview; setState: (state: PreviewState) => void; onTheme: () => void; dark: boolean }) {
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" size="lg" className="profile-trigger" aria-label="Demo profile menu" />}><span className="profile-avatar">AD</span><span className="profile-copy"><strong>Admin Demo</strong><small>Superuser</small></span><ChevronDown /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-64"><DropdownMenuGroup><DropdownMenuLabel>Demo profile · not authenticated</DropdownMenuLabel><DropdownMenuItem onClick={onTheme}>{dark ? <Sun /> : <Moon />}{dark ? 'Switch to light theme' : 'Switch to dark theme'}</DropdownMenuItem><DropdownMenuItem onClick={() => onPreview({ title: 'Demo role preview', description: 'Superuser/Admin is the only implemented interface. Employee and Student interfaces are planned. This selector does not grant permissions or simulate authentication.' })}><ShieldCheck />About role previews</DropdownMenuItem></DropdownMenuGroup><DropdownMenuSeparator /><DropdownMenuGroup><DropdownMenuLabel>UI state preview · no network request</DropdownMenuLabel>{(['ready', 'loading', 'empty', 'error'] as const).map(state => <DropdownMenuItem key={state} onClick={() => setState(state)}>{state === 'ready' ? 'Restore dashboard' : `Show ${state} state`}</DropdownMenuItem>)}</DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
}

export function TopBar({ onMenu, onSearch, onPreview, setState, onTheme, dark }: { onMenu: () => void; onSearch: () => void; onPreview: OpenPreview; setState: (state: PreviewState) => void; onTheme: () => void; dark: boolean }) {
  return <header className="topbar"><div className="flex min-w-0 items-center gap-3"><Button variant="outline" size="icon-lg" className="lg:hidden" aria-label="Open navigation" onClick={onMenu}><Menu /></Button><PanelLeftClose className="hidden size-4 text-muted-foreground lg:block" aria-hidden="true" /><nav aria-label="Breadcrumb" className="breadcrumb"><span>Workspace</span><ChevronRight size={12} /><strong>Dashboard</strong></nav></div><div className="topbar-actions"><Button variant="outline" size="lg" className="search-trigger" onClick={onSearch} aria-label="Search workspace"><Search /><span>Search anything...</span><kbd><Command size={10} /> K</kbd></Button><Button variant="outline" size="icon-lg" aria-label="View demo notifications" onClick={() => onPreview({ title: 'Demo notifications', description: '8 overdue tasks and 1 editing lock need review in the all-team, 30-day demo. These are fictional notification examples, not live alerts. Explore Needs attention for the currently selected filters.' })}><Bell /></Button><div className="topbar-divider" /><DemoProfileMenu onPreview={onPreview} setState={setState} onTheme={onTheme} dark={dark} /></div></header>
}

export function AppShell({ children, state, setState }: { children: (open: OpenPreview) => ReactNode; state: PreviewState; setState: (state: PreviewState) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [info, setInfo] = useState<PreviewInfo | null>(null)
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(media.matches)
    const update = () => setDark(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
  }, [dark])
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key === 'k') { event.preventDefault(); setSearchOpen(value => !value) } }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  }, [])
  const results = mockOperationsService.search(query)
  return <TooltipProvider delay={250}><div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a><aside className="desktop-sidebar"><SidebarNav onPreview={setInfo} /></aside><div className="workspace-main"><TopBar onMenu={() => setMobileOpen(true)} onSearch={() => setSearchOpen(true)} onPreview={setInfo} setState={setState} onTheme={() => setDark(value => !value)} dark={dark} /><DemoModeBanner /><main id="main-content" tabIndex={-1}>{state !== 'ready' && <div className="state-preview-label">UI state preview: {state}<Button variant="outline" size="lg" onClick={() => setState('ready')}>Restore dashboard</Button></div>}{children(setInfo)}</main><footer className="workspace-footer"><span>Thoughtfully connected. Purposefully simple.</span><span><ShieldCheck size={13} /> Fictional data. Real possibilities.</span></footer></div></div>
    <Dialog open={mobileOpen} onOpenChange={setMobileOpen}><DialogContent className="mobile-nav-dialog top-0 left-0 translate-x-0 translate-y-0 data-open:animate-none data-closed:animate-none"><DialogHeader><DialogTitle className="sr-only">Workspace navigation</DialogTitle><DialogDescription className="sr-only">Admin dashboard and planned sections</DialogDescription></DialogHeader><SidebarNav close={() => setMobileOpen(false)} onPreview={setInfo} /></DialogContent></Dialog>
    <Dialog open={info !== null} onOpenChange={open => { if (!open) setInfo(null) }}><DialogContent className="sm:max-w-md"><DialogHeader><Badge variant="secondary">Preview only</Badge><DialogTitle>{info?.title}</DialogTitle><DialogDescription className="leading-relaxed">{info?.description}</DialogDescription></DialogHeader><Button size="lg" onClick={() => setInfo(null)}>Back to workspace</Button></DialogContent></Dialog>
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Search your demo workspace</DialogTitle><DialogDescription>Fictional records and planned sections only.</DialogDescription></DialogHeader><div className="search-field"><Search size={18} /><input autoFocus aria-label="Search demo records" placeholder="Try a name, student code, or section..." value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={16} /></button>}</div><div className="search-results">{query.trim() ? results.length ? results.map(result => <button key={result.title} onClick={() => { setSearchOpen(false); if (result.title !== 'Dashboard') setInfo({ title: result.title, description: `${result.description}. Record detail screens are not implemented in this milestone. No live personal data is available.` }) }}><Search size={15} /><span><strong>{result.title}</strong><small>{result.description}</small></span><ArrowUpRight size={15} /></button>) : <EmptyState title="No matches found" description="Try “Alex”, “Tasks”, or “DEMO-0001”." /> : <p className="search-hint">Search students, team members, and your workspace.</p>}</div></DialogContent></Dialog>
  </TooltipProvider>
}

export function RolePreview({ onPreview }: { onPreview: OpenPreview }) {
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" size="lg" />}><ShieldCheck data-icon="inline-start" /><span>Superuser view</span><ChevronsUpDown data-icon="inline-end" /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuGroup><DropdownMenuLabel>Visual preview · not security</DropdownMenuLabel><DropdownMenuItem onClick={() => onPreview({ title: 'Superuser/Admin', description: 'You are viewing the demo admin dashboard. No real session or permissions exist in this frontend prototype.' })}>Superuser / Admin · current</DropdownMenuItem><DropdownMenuItem onClick={() => onPreview(plannedFeature('Employee interface'))}>Employee · planned</DropdownMenuItem><DropdownMenuItem onClick={() => onPreview(plannedFeature('Student interface'))}>Student · planned</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
}
