import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, delay, map, mergeMap } from 'rxjs/operators';

import * as TaskActions from './task.actions';
import { MOCK_TASKS } from '../task.model';

// Classic @Injectable() effects class (Angular v15 / NgRx 15 style).
// VIDÉO 3 target: replaced by rxMethod (or resource) inside the signalStore.
@Injectable()
export class TaskEffects {
  // Constructor injection of the Actions stream — the v15 reflex.
  constructor(private actions$: Actions) {}

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.loadTasks),
      // Mocked HTTP round-trip — no backend.
      mergeMap(() =>
        of(MOCK_TASKS).pipe(
          delay(300),
          map((tasks) => TaskActions.loadTasksSuccess({ tasks })),
          catchError((err) =>
            of(TaskActions.loadTasksFailure({ error: String(err) })),
          ),
        ),
      ),
    ),
  );
}
