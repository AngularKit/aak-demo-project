import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { Task } from '../task.model';
import { TaskService } from '../task.service';

/**
 * VIDÉO 1 — audit target. Deliberately legacy (Angular v15 reflexes):
 *  - @Component WITHOUT `standalone` (declared in app.module.ts)
 *  - default change detection (no OnPush)
 *  - constructor dependency injection
 *  - @Input() setter holding logic + @Output() EventEmitter
 *  - manual subscribe in ngOnInit + Subscription + ngOnDestroy/unsubscribe
 *  - @ViewChild('search', { static: false })
 *  - a get filteredTasks() recomputed on every change detection cycle
 *  - redundant `.component` filename suffix
 *
 * After target: standalone, OnPush/zoneless, inject(), @if/@for + track,
 * input()/output(), takeUntilDestroyed or signals, viewChild(), computed(),
 * file renamed to task-list.ts.
 */
@Component({
  selector: 'app-task-list',
  // standalone: false — declared in app.module.ts (Angular v15 reflex).
  // In v20+ standalone is the default, so the legacy behaviour is opt-in.
  standalone: false,
  templateUrl: './task-list.component.html',
})
export class TaskListComponent implements OnInit, OnDestroy {
  private _tasks: Task[] = [];

  // Logic inside the input setter — a classic smell.
  @Input()
  set tasks(value: Task[]) {
    // Defensive copy + side effect on every binding update.
    this._tasks = (value || []).slice();
    console.log('[TaskList] tasks input updated:', this._tasks.length);
  }
  get tasks(): Task[] {
    return this._tasks;
  }

  @Output() select = new EventEmitter<Task>();

  @ViewChild('search', { static: false }) searchInput!: ElementRef<HTMLInputElement>;

  loading = false;
  searchTerm = '';

  private subscription = new Subscription();

  // Constructor injection — the v15 reflex.
  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    // Manual subscribe, tracked in a Subscription, torn down in ngOnDestroy.
    this.subscription.add(
      this.taskService.loading$.subscribe((loading) => {
        this.loading = loading;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onSearch(): void {
    // Reads the value straight off the ViewChild DOM node.
    this.searchTerm = this.searchInput?.nativeElement.value ?? '';
  }

  // Recomputed on EVERY change detection pass — should be a computed().
  get filteredTasks(): Task[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this._tasks;
    }
    return this._tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.assignee.toLowerCase().includes(term),
    );
  }

  onSelect(task: Task): void {
    this.select.emit(task);
  }
}
