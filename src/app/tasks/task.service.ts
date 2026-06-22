import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { MOCK_TASKS, Task, TaskStatus } from './task.model';

export type StatusFilter = 'all' | TaskStatus;

/**
 * Legacy RxJS-first service (Angular v15 style).
 *
 * VIDÉO 2 target: migrate this whole thing to signals.
 *  - internal state lives in BehaviorSubjects exposed via asObservable()
 *  - derived state is computed with combineLatest(...).pipe(map(...))
 *  - consumers must subscribe() by hand
 *
 * The HTTP call is mocked in memory (no backend): of(MOCK_TASKS).pipe(delay(300)).
 */
@Injectable()
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private filterSubject = new BehaviorSubject<StatusFilter>('all');
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Exposed as read-only streams — the v15 reflex.
  public tasks$ = this.tasksSubject.asObservable();
  public filter$ = this.filterSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Derived stream recomputed on every emission of either source.
  public filteredTasks$: Observable<Task[]> = combineLatest([
    this.tasksSubject,
    this.filterSubject,
  ]).pipe(
    map(([tasks, filter]) =>
      filter === 'all' ? tasks : tasks.filter((t) => t.status === filter),
    ),
  );

  // Simulates an HttpClient.get<Task[]>() round-trip against a backend.
  private fetchTasks(): Observable<Task[]> {
    return of(MOCK_TASKS).pipe(delay(300));
  }

  loadTasks(): void {
    this.loadingSubject.next(true);
    // Manual subscribe inside the service — classic leaky v15 pattern.
    this.fetchTasks().subscribe((tasks) => {
      this.tasksSubject.next(tasks);
      this.loadingSubject.next(false);
    });
  }

  setFilter(filter: StatusFilter): void {
    this.filterSubject.next(filter);
  }

  getById(id: number): Observable<Task | undefined> {
    return this.tasksSubject.pipe(map((tasks) => tasks.find((t) => t.id === id)));
  }
}
