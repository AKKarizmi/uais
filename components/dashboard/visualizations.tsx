'use client'

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis, LabelList } from 'recharts'
import { ArrowUpRight, ChevronRight, Clock3, FileQuestion, LockKeyhole, Timer, Users } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { DashboardData } from '@/lib/mock/operations'
import { EmptyState, InfoTip, SectionHeader, type OpenPreview } from './shared'

const pipelineConfig = {
  value: { label: 'Applications' },
  preparing: { label: 'Preparing', color: 'var(--chart-1)' },
  review: { label: 'Internal Review', color: 'var(--chart-2)' },
  submitted: { label: 'Submitted', color: 'var(--chart-3)' },
  decision: { label: 'Decision Received', color: 'var(--chart-4)' },
} satisfies ChartConfig

export function ApplicationPipeline({ data }: { data: DashboardData }) {
  const total = data.pipeline.reduce((n, stage) => n + stage.value, 0)
  return <Card className="dashboard-card pipeline-card"><CardHeader><SectionHeader title="Application pipeline" description="A clearer picture of every next step." action={<Badge variant="outline">Illustrative</Badge>} /></CardHeader><CardContent><div className="pipeline-total"><strong>{total}</strong><span>applications in this period</span><InfoTip text="Stage counts describe fictional application cohorts in the selected period. Decision Received is excluded from the active applications KPI." /></div><ChartContainer config={pipelineConfig} className="h-[180px] w-full aspect-auto"><BarChart accessibilityLayer data={data.pipeline} margin={{ top: 24, right: 2, left: -25, bottom: 0 }} barSize={64}><CartesianGrid vertical={false} strokeDasharray="3 4" /><XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={12} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} interval={0} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} width={48} /><ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent hideLabel />} /><Bar dataKey="value" radius={[5, 5, 0, 0]} isAnimationActive={false}>{data.pipeline.map(stage => <Cell key={stage.key} fill={`var(--color-${stage.key})`} />)}<LabelList dataKey="value" position="top" fill="var(--foreground)" fontSize={11} fontWeight={600} /></Bar></BarChart></ChartContainer><div className="pipeline-footnote"><span className="status-dot" />Every application has a next step.<span>Demo snapshot</span></div></CardContent></Card>
}

const attentionIcons = { overdue: Clock3, documents: FileQuestion, stale: Timer, locks: LockKeyhole }
export function NeedsAttention({ data, onPreview }: { data: DashboardData; onPreview: OpenPreview }) {
  return <Card className="dashboard-card attention-card"><CardHeader><SectionHeader title="Needs attention" description="The important things, brought into focus." action={<span className="attention-count">{data.attention.length}</span>} /></CardHeader><CardContent><div className="attention-list">{data.attention.length === 0 ? <EmptyState title="All clear" /> : data.attention.map(item => { const Icon = attentionIcons[item.kind]; return <button key={item.id} className={`attention-row attention-${item.kind}`} onClick={() => onPreview({ title: item.title, description: `${item.count} fictional ${item.title.toLowerCase()} in this view. ${item.description}. Detailed resolution workflows are planned; this preview does not change tasks, documents, applications, or locks.` })}><span className="attention-icon"><Icon size={17} /></span><span className="attention-copy"><strong>{item.title}</strong><small>{item.description}</small></span><span className="attention-value">{item.count}</span><ChevronRight size={14} /></button> })}</div><p className="attention-note"><span className="tiny-dot" />Demo alerts only. No actions are sent.</p></CardContent></Card>
}

export function EmployeeWorkload({ data, onPreview }: { data: DashboardData; onPreview: OpenPreview }) {
  const max = Math.max(...data.employees.map(e => e.completed + e.inProgress + e.overdue), 1)
  return <Card className="dashboard-card"><CardHeader><SectionHeader title="Team workload" description={`${data.totalTasks} tasks across ${data.employees.length} fictional team members`} action={<InfoTip text="Task counts follow the selected team and period. Names and workloads are fictional." />} /></CardHeader><CardContent><div className="workload-legend"><span><i className="legend-completed" />Completed</span><span><i className="legend-progress" />In progress</span><span><i className="legend-overdue" />Overdue</span></div><div className="workload-list">{data.employees.map((employee, index) => { const total = employee.completed + employee.inProgress + employee.overdue; return <div className="workload-row" key={employee.id}><span className={`person-avatar avatar-${index % 4}`}>{employee.initials}</span><span className="workload-person">{employee.name}<small>{employee.team === 'admissions' ? 'Admissions' : 'Counseling'}</small></span><div className="workload-bar" role="img" aria-label={`${employee.name}: ${employee.completed} completed, ${employee.inProgress} in progress, ${employee.overdue} overdue`} title={`${employee.completed} completed · ${employee.inProgress} in progress · ${employee.overdue} overdue`}><span className="bar-completed" style={{ width: `${employee.completed / max * 100}%` }} /><span className="bar-progress" style={{ width: `${employee.inProgress / max * 100}%` }} /><span className="bar-overdue" style={{ width: `${employee.overdue / max * 100}%` }} /></div><strong className="workload-total">{total}</strong></div> })}</div><button className="section-bottom-link" onClick={() => onPreview({ title: 'Team task details', description: 'The full Tasks workspace and individual employee task views are planned. This illustrative workload is read-only.' })}><Users size={14} />Explore team tasks <ArrowUpRight size={14} /><span>Preview only</span></button></CardContent></Card>
}
