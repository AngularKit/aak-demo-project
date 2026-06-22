import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { Task, TaskStatus, TASK_STATUSES } from './tasks/task.model';
import { StatusFilter } from './tasks/task.service';
import * as TaskActions from './tasks/store/task.actions';
import {
  selectFilter,
  selectFilteredTasks,
  selectLoading,
  selectSelectedTask,
} from './tasks/store/task.selectors';

/**
 * Smart container wired to the classic NgRx store (Angular v15 style):
 *  - constructor injection of Store
 *  - store.select(...) streams consumed via the async pipe
 *  - store.dispatch(loadTasks()) on init, dispatch on every interaction
 *
 * VIDÉO 3 target: the store/ folder collapses into a single signalStore and
 * this container reads signals directly instead of selecting observables.
 */
@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  filteredTasks$: Observable<Task[]>;
  selectedTask$: Observable<Task | undefined>;
  filter$: Observable<StatusFilter>;
  loading$: Observable<boolean>;

  statuses: TaskStatus[] = TASK_STATUSES;

  constructor(private store: Store) {
    this.filteredTasks$ = this.store.select(selectFilteredTasks);
    this.selectedTask$ = this.store.select(selectSelectedTask);
    this.filter$ = this.store.select(selectFilter);
    this.loading$ = this.store.select(selectLoading);
  }

  ngOnInit(): void {
    this.store.dispatch(TaskActions.loadTasks());
  }

  setFilter(filter: StatusFilter): void {
    this.store.dispatch(TaskActions.setFilter({ filter }));
  }

  onSelect(task: Task): void {
    this.store.dispatch(TaskActions.selectTask({ id: task.id }));
  }
}
