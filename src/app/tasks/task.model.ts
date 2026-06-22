export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  assignee: string;
}

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];

// In-memory mock data — no backend. Served via `of(MOCK_TASKS).pipe(delay(300))`.
export const MOCK_TASKS: Task[] = [
  { id: 1, title: 'Set up the project repository', status: 'done', assignee: 'Alice' },
  { id: 2, title: 'Write the onboarding documentation', status: 'in-progress', assignee: 'Bob' },
  { id: 3, title: 'Design the task list UI', status: 'in-progress', assignee: 'Alice' },
  { id: 4, title: 'Implement the status filter', status: 'todo', assignee: 'Carol' },
  { id: 5, title: 'Wire up the detail panel', status: 'todo', assignee: 'Bob' },
  { id: 6, title: 'Review the RxJS data flow', status: 'todo', assignee: 'Carol' },
];
