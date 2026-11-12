'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { FlaskConical, Inbox, Info, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type PreviewInfo = { title: string; description: string }
export type OpenPreview = (info: PreviewInfo) => void
export const plannedFeature = (title: string): PreviewInfo => ({ title, description: `${title} is planned for a later milestone. This prototype only includes the Superuser/Admin dashboard. No records are changed, uploaded, or sent to a server.` })

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <Badge variant="secondary" className={cn('status-badge', `status-${tone}`)}>{children}</Badge>
}

export function DemoModeBanner() {
  return <div className="demo-banner"><div className="flex items-center gap-2"><FlaskConical className="size-3.5" aria-hidden="true" /><span>UI prototype <span className="mx-1 opacity-40">/</span> demo data</span></div><span className="hidden sm:inline">A preview of your future workspace. No live data connected.</span><Badge variant="outline">Milestone 01</Badge></div>
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}

export function KpiCard({ label, value, note, icon: Icon, tone = 'neutral' }: { label: string; value: number; note: string; icon: LucideIcon; tone?: 'neutral' | 'warning' | 'danger' | 'success' }) {
  return <Card className="kpi-card"><CardHeader><CardTitle><span className="kpi-label">{label}</span></CardTitle><Icon className={cn('kpi-icon', `tone-${tone}`)} aria-hidden="true" /></CardHeader><CardContent><p className="kpi-value">{value.toLocaleString('en-US')}</p><p className={cn('kpi-note', `tone-${tone}`)}>{tone === 'success' && <span className="status-dot" />}{note}</p></CardContent></Card>
}

export function EmptyState({ title = 'Nothing to show just yet', description = 'Try a different team or date range to explore the fictional data.' }: { title?: string; description?: string }) {
  return <Empty><EmptyHeader><EmptyMedia variant="icon"><Inbox /></EmptyMedia><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{description}</EmptyDescription></EmptyHeader></Empty>
}

export function PreviewButton({ label, onPreview, compact = false }: { label: string; onPreview: OpenPreview; compact?: boolean }) {
  return <Tooltip><TooltipTrigger render={<Button variant="outline" size="lg" onClick={() => onPreview(plannedFeature(label))} aria-label={`${label} — preview only`} />}><span>{compact ? 'Preview' : label}</span><ArrowUpRight data-icon="inline-end" /></TooltipTrigger><TooltipContent>Preview only — planned for a later milestone</TooltipContent></Tooltip>
}

export function InfoTip({ text }: { text: string }) {
  return <Tooltip><TooltipTrigger aria-label={text} className="info-tip"><Info className="size-3.5" /></TooltipTrigger><TooltipContent>{text}</TooltipContent></Tooltip>
}
