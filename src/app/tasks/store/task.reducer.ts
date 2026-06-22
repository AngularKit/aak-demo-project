import { createReducer, on } from '@ngrx/store';

import * as TaskActions from './task.actions';
import { StatusFilter } from '../task.service';
import { Task } from '../task.model';

export const TASK_FEATURE_KEY = 'tasks';

export interface TaskState {
  tasks: Task[];
  filter: StatusFilter;
  selectedId: number | null;
  loading: boolean;
  error: string | null;
}

export const initialTaskState: TaskState = {
  tasks: [],
  filter: 'all',
  selectedId: null,
  loading: false,
  error: null,
};

// Classic createReducer/on boilerplate (Angular v15 / NgRx 15 style).
// VIDÉO 3 target: replaced by signalStore withState + withMethods.
export const taskReducer = createReducer(
  initialTaskState,
  on(TaskActions.loadTasks, (state) => ({ ...state, loading: true, error: null })),
  on(TaskActions.loadTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks,
    loading: false,
  })),
  on(TaskActions.loadTasksFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(TaskActions.setFilter, (state, { filter }) => ({ ...state, filter })),
  on(TaskActions.selectTask, (state, { id }) => ({ ...state, selectedId: id })),
);
