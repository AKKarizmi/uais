'use client'

import { useState } from 'react'
import { ArrowUpRight, CalendarDays, ChevronDown, Clock3, FileCheck2, Files, GraduationCap, LockKeyhole, Users, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AppShell, RolePreview } from './app-shell'
import { EmptyState, KpiCard, plannedFeature } from './shared'
import { ApplicationPipeline, EmployeeWorkload, NeedsAttention } from './visualizations'
import { ActiveLocks, QuickManagement, RecentActivity } from './operations-panels'
import { mockOperationsService, type DateRange, type Team, type PreviewState } from '@/lib/mock/operations'

export function DashboardSkeleton() {
  return <div className="dashboard-skeleton" role="status" aria-label="Loading dashboard preview"><span className="sr-only">Loading UI preview. No network request is running.</span><div className="kpi-grid">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-32" />)}</div><div className="primary-grid"><Skeleton className="h-80" /><Skeleton className="h-80" /></div><div className="secondary-grid"><Skeleton className="h-72" /><Skeleton className="h-72" /></div></div>
}

export default function AdminDashboard() {
  const [team, setTeam] = useState<Team>('all')
  const [range, setRange] = useState<DateRange>('30')
  const [state, setState] = useState<PreviewState>('ready')
  const data = mockOperationsService.getDashboard({ team, range })
  const activeApplications = data.pipeline.filter(stage => stage.key !== 'decision').reduce((sum, stage) => sum + stage.value, 0)
  return <AppShell state={state} setState={setState}>{onPreview => <div className="dashboard-content"><div className="page-eyebrow"><span>YOUR WORKSPACE AT A GLANCE</span><RolePreview onPreview={onPreview} /></div><div className="page-heading"><div><div className="title-line"><h1>Operations overview</h1><Badge variant="secondary">Demo data</Badge></div><p>A little clarity for everything ahead.</p></div><Button size="lg" onClick={() => onPreview(plannedFeature('Student directory'))}>View student directory<ArrowUpRight data-icon="inline-end" /></Button></div><div className="dashboard-toolbar"><div className="snapshot-date"><CalendarDays size={15} /><span>Thursday, November 12, 2026</span><span className="snapshot-label">Demo snapshot</span></div><div className="dashboard-filters"><label className="filter-select"><Users size={14} /><select aria-label="Filter by team" value={team} onChange={event => setTeam(event.target.value as Team)}><option value="all">All teams</option><option value="admissions">Admissions</option><option value="counseling">Counseling</option></select><ChevronDown size={13} /></label><label className="filter-select"><CalendarDays size={14} /><select aria-label="Filter by date range" value={range} onChange={event => setRange(event.target.value as DateRange)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><ChevronDown size={13} /></label>{(team !== 'all' || range !== '30') && <Button variant="outline" size="icon-lg" aria-label="Reset filters" onClick={() => { setTeam('all'); setRange('30') }}><RotateCcw /></Button>}</div></div>
      {state === 'loading' ? <DashboardSkeleton /> : state === 'empty' ? <div className="state-card"><EmptyState title="A fresh start for your workspace" description="This is the empty-state preview. When data is available, your applications, tasks, and team activity will appear here." /><Button size="lg" variant="outline" onClick={() => setState('ready')}>Explore demo data</Button></div> : state === 'error' ? <Alert variant="destructive"><AlertCircle /><AlertTitle>Dashboard unavailable — error preview</AlertTitle><AlertDescription>This is an intentional UI example, not a failed request. Your demo data has not changed.<div className="mt-4"><Button variant="outline" size="lg" onClick={() => setState('ready')}>Restore demo dashboard</Button></div></AlertDescription></Alert> : <><div className="sr-only" role="status" aria-live="polite">Showing {team === 'all' ? 'all teams' : team}, last {range} days. {data.students} students, {activeApplications} active applications. Online employees and locks are current demo snapshots.</div><section aria-label="Key performance indicators" className="kpi-grid"><KpiCard label="Total students" value={data.students} note="In selected cohort" icon={GraduationCap} /><KpiCard label="Active applications" value={activeApplications} note="Across 3 active stages" icon={Files} /><KpiCard label="Document reviews" value={data.documents} note="Pending review" icon={FileCheck2} tone="warning" /><KpiCard label="Overdue tasks" value={data.overdue} note="Need your attention" icon={Clock3} tone="danger" /><KpiCard label="Employees online" value={data.online} note={`Of ${data.employees.length} team members`} icon={Users} tone="success" /><KpiCard label="Active student locks" value={data.locks.length} note="Demo snapshot only" icon={LockKeyhole} /></section><div className="primary-grid"><ApplicationPipeline data={data} /><NeedsAttention data={data} onPreview={onPreview} /></div><div className="secondary-grid"><EmployeeWorkload data={data} onPreview={onPreview} /><RecentActivity data={data} onPreview={onPreview} /></div><ActiveLocks data={data} onPreview={onPreview} /><QuickManagement onPreview={onPreview} /></>}
    </div>}</AppShell>
}
