import { createAction, props } from '@ngrx/store';

import { StatusFilter } from '../task.service';
import { Task } from '../task.model';

// Classic NgRx action creators (Angular v15 / NgRx 15 style).
// VIDÉO 3 target: delete this file, fold the intent into signalStore withMethods.
export const loadTasks = createAction('[Task] Load Tasks');

export const loadTasksSuccess = createAction(
  '[Task] Load Tasks Success',
  props<{ tasks: Task[] }>(),
);

export const loadTasksFailure = createAction(
  '[Task] Load Tasks Failure',
  props<{ error: string }>(),
);

export const setFilter = createAction(
  '[Task] Set Filter',
  props<{ filter: StatusFilter }>(),
);

export const selectTask = createAction(
  '[Task] Select Task',
  props<{ id: number | null }>(),
);
