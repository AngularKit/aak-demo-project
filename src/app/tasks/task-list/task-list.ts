import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { Task } from '../task.model';

@Component({
  selector: 'app-task-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-list.html',
})
export class TaskList {
  readonly tasks = input<Task[]>([]);

  readonly selected = output<Task>();

  protected readonly searchInput =
    viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly searchTerm = signal('');

  protected readonly filteredTasks = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const tasks = this.tasks();
    if (!term) {
      return tasks;
    }
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.assignee.toLowerCase().includes(term),
    );
  });

  protected onSearch(): void {
    this.searchTerm.set(this.searchInput()?.nativeElement.value ?? '');
  }

  protected onSelect(task: Task): void {
    this.selected.emit(task);
  }
}
