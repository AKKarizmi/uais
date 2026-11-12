export type Team = 'all' | 'admissions' | 'counseling'
export type DateRange = '7' | '30' | '90'
export type PreviewState = 'ready' | 'loading' | 'empty' | 'error'
export type NullableBoolean = boolean | null
export const booleanLabel = (value: NullableBoolean) => value === null ? 'Unknown' : value ? 'Yes' : 'No'
export type Filters = { team: Team; range: DateRange }
export type Employee = { id: string; name: string; initials: string; team: Exclude<Team, 'all'>; online: boolean; completed: number; inProgress: number; overdue: number }
export type StudentLock = { id: string; studentId: string; publicCode: string; employeeId: string; state: 'Editing' | 'Needs review'; heartbeat: string; verified: NullableBoolean }
export type AttentionItem = { id: string; title: string; description: string; count: number; kind: 'overdue' | 'documents' | 'stale' | 'locks' }
export type Activity = { id: string; employeeId: string; action: string; target: string; time: string; daysAgo: number }
export type DashboardData = { students: number; pipeline: { name: string; value: number; key: string }[]; documents: number; overdue: number; online: number; employees: Employee[]; locks: StudentLock[]; attention: AttentionItem[]; activity: Activity[]; totalTasks: number }

const employees: Employee[] = [
  { id: 'emp-a7', name: 'Alex Morgan', initials: 'AM', team: 'admissions', online: true, completed: 18, inProgress: 8, overdue: 3 },
  { id: 'emp-b2', name: 'Jamie Chen', initials: 'JC', team: 'admissions', online: true, completed: 15, inProgress: 10, overdue: 2 },
  { id: 'emp-c8', name: 'Sam Rivera', initials: 'SR', team: 'counseling', online: true, completed: 21, inProgress: 5, overdue: 1 },
  { id: 'emp-d3', name: 'Taylor Reed', initials: 'TR', team: 'counseling', online: false, completed: 12, inProgress: 7, overdue: 2 },
]
const locks: StudentLock[] = [
  { id: 'lock-f1', studentId: 'stu-9c12-a8f4', publicCode: 'UAIS-STU-DEMO-0001', employeeId: 'emp-a7', state: 'Editing', heartbeat: '12 seconds ago', verified: null },
  { id: 'lock-f2', studentId: 'stu-7b82-c6e1', publicCode: 'UAIS-STU-DEMO-0007', employeeId: 'emp-b2', state: 'Editing', heartbeat: '28 seconds ago', verified: null },
  { id: 'lock-f3', studentId: 'stu-1a43-e9b2', publicCode: 'UAIS-STU-DEMO-0012', employeeId: 'emp-c8', state: 'Needs review', heartbeat: '18 minutes ago', verified: null },
]
const activity: Activity[] = [
  { id: 'act-1', employeeId: 'emp-a7', action: 'moved an application to', target: 'Internal Review', time: '8 min ago', daysAgo: 0 },
  { id: 'act-2', employeeId: 'emp-b2', action: 'reviewed documents for', target: 'UAIS-STU-DEMO-0007', time: '24 min ago', daysAgo: 0 },
  { id: 'act-3', employeeId: 'emp-c8', action: 'completed', target: 'University shortlist review', time: '42 min ago', daysAgo: 0 },
  { id: 'act-4', employeeId: 'emp-d3', action: 'updated an application to', target: 'Submitted', time: '1 hour ago', daysAgo: 0 },
  { id: 'act-5', employeeId: 'emp-a7', action: 'prepared', target: 'Monthly admissions summary', time: '12 days ago', daysAgo: 12 },
]
const cohorts = [
  { team: 'admissions', daysAgo: 3, students: 204, preparing: 32, review: 22, submitted: 26, decision: 8, documents: 9 },
  { team: 'counseling', daysAgo: 5, students: 108, preparing: 18, review: 12, submitted: 16, decision: 6, documents: 4 },
  { team: 'admissions', daysAgo: 18, students: 624, preparing: 60, review: 34, submitted: 48, decision: 18, documents: 19 },
  { team: 'counseling', daysAgo: 24, students: 312, preparing: 32, review: 18, submitted: 28, decision: 8, documents: 10 },
  { team: 'admissions', daysAgo: 48, students: 385, preparing: 34, review: 19, submitted: 32, decision: 21, documents: 12 },
  { team: 'counseling', daysAgo: 62, students: 167, preparing: 19, review: 10, submitted: 19, decision: 12, documents: 7 },
] as const

export interface OperationsService {
  getDashboard(filters: Filters): DashboardData
  search(query: string): { title: string; description: string }[]
}

export const mockOperationsService: OperationsService = {
  getDashboard({ team, range }) {
    const selected = cohorts.filter(c => (team === 'all' || c.team === team) && c.daysAgo < Number(range))
    const sum = (key: 'students' | 'preparing' | 'review' | 'submitted' | 'decision' | 'documents') => selected.reduce((total, c) => total + c[key], 0)
    const factor = range === '7' ? 0.4 : range === '90' ? 1.8 : 1
    const staff = employees.filter(e => team === 'all' || e.team === team).map(e => ({ ...e, completed: Math.round(e.completed * factor), inProgress: Math.round(e.inProgress * factor), overdue: Math.round(e.overdue * factor) }))
    const staffIds = new Set(staff.map(e => e.id))
    const activeLocks = locks.filter(l => staffIds.has(l.employeeId))
    const overdue = staff.reduce((n, e) => n + e.overdue, 0)
    const stale = Math.round(sum('preparing') / 24)
    return {
      students: sum('students'),
      pipeline: [{ name: 'Preparing', key: 'preparing', value: sum('preparing') }, { name: 'Internal Review', key: 'review', value: sum('review') }, { name: 'Submitted', key: 'submitted', value: sum('submitted') }, { name: 'Decision Received', key: 'decision', value: sum('decision') }],
      documents: sum('documents'), overdue, online: staff.filter(e => e.online).length, employees: staff, locks: activeLocks,
      totalTasks: staff.reduce((n, e) => n + e.completed + e.inProgress + e.overdue, 0),
      attention: [
        { id: 'att-1', title: 'Overdue tasks', description: 'Follow-ups waiting for a little attention', count: overdue, kind: 'overdue' },
        { id: 'att-2', title: 'Documents awaiting review', description: 'Missing or unreviewed application files', count: sum('documents'), kind: 'documents' },
        { id: 'att-3', title: 'Stale applications', description: 'No progress recorded in over 7 days', count: stale, kind: 'stale' },
        { id: 'att-4', title: 'Lock needs review', description: 'Last heartbeat more than 15 minutes ago', count: activeLocks.filter(l => l.state === 'Needs review').length, kind: 'locks' },
      ].filter(a => a.count > 0) as AttentionItem[],
      activity: activity.filter(a => staffIds.has(a.employeeId) && a.daysAgo < Number(range)),
    }
  },
  search(query) {
    if (!query.trim()) return []
    const items = [
      ...locks.map(l => ({ title: l.publicCode, description: 'Fictional student · directory planned' })),
      ...employees.map(e => ({ title: e.name, description: `Fictional employee · ${e.team}` })),
      ...['Dashboard', 'Students', 'Universities', 'Applications', 'Tasks', 'Documents', 'Reports', 'Employees', 'Attendance', 'Activity Log', 'Settings'].map(title => ({ title, description: title === 'Dashboard' ? 'Current admin overview' : 'Planned workspace section · preview only' })),
    ]
    return items.filter(i => `${i.title} ${i.description}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
  },
}
