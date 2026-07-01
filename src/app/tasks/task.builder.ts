import { Task, TaskStatus } from './task.model';

let seq = 0;

export function aTask(overrides: Partial<Task> = {}): Task {
  seq += 1;
  return {
    id: seq,
    title: `Task ${seq}`,
    status: 'todo' satisfies TaskStatus,
    assignee: 'Alice',
    ...overrides,
  };
}
