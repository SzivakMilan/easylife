export type SectionKey =
  | 'home'
  | 'deadlines'
  | 'events'
  | 'budget'
  | 'bills'
  | 'family'
  | 'settings'

export interface Member {
  id: string
  name: string
  initials: string
  color: string
}

export type Priority = 'low' | 'medium' | 'high'
export type Recurrence = 'none' | 'weekly' | 'monthly' | 'yearly'

export interface Deadline {
  id: string
  title: string
  description?: string
  dueDate: string
  dueTime?: string
  assigneeIds: string[]
  priority: Priority
  recurrence: Recurrence
  done: boolean
  reminderOffsetMinutes?: number
}

export interface EventItem {
  id: string
  title: string
  startAt: string
  endAt?: string
  location?: string
  note?: string
  participantIds: string[]
  reminderOffsetMinutes?: number
}

export type BillStatus = 'pending' | 'paid'

export interface Bill {
  id: string
  issuer: string
  amount: number
  dueDate: string
  categoryId: string
  status: BillStatus
  paidAt?: string
  recurrence: Recurrence
  filePath?: string
  reminderOffsetMinutes?: number
}

export interface SavingsGoal {
  id: string
  name: string
  color: string
  icon: string
  targetAmount: number
}

export interface SavingsContribution {
  id: string
  goalId: string
  amount: number
  note?: string
  occurredOn: string
}

export interface BudgetCategory {
  id: string
  name: string
  color: string
  icon: string
  monthlyLimit: number
}

export interface BudgetItem {
  id: string
  categoryId: string
  type: 'expense' | 'income'
  amount: number
  note?: string
  occurredOn: string
}

export type AgendaItemType = 'deadline' | 'event' | 'bill'

export interface AgendaItem {
  id: string
  type: AgendaItemType
  date: string
  time?: string
  title: string
  label: string
  value: string
  assigneeIds: string[]
}
