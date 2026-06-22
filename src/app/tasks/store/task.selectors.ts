import { createFeatureSelector, createSelector } from '@ngrx/store';

import { TASK_FEATURE_KEY, TaskState } from './task.reducer';

// Classic memoized selectors (Angular v15 / NgRx 15 style).
// VIDÉO 3 target: replaced by signalStore withComputed.
export const selectTaskState = createFeatureSelector<TaskState>(TASK_FEATURE_KEY);

export const selectAllTasks = createSelector(selectTaskState, (state) => state.tasks);

export const selectFilter = createSelector(selectTaskState, (state) => state.filter);

export const selectLoading = createSelector(selectTaskState, (state) => state.loading);

export const selectSelectedId = createSelector(
  selectTaskState,
  (state) => state.selectedId,
);

export const selectFilteredTasks = createSelector(
  selectAllTasks,
  selectFilter,
  (tasks, filter) =>
    filter === 'all' ? tasks : tasks.filter((t) => t.status === filter),
);

export const selectSelectedTask = createSelector(
  selectAllTasks,
  selectSelectedId,
  (tasks, selectedId) =>
    selectedId == null ? undefined : tasks.find((t) => t.id === selectedId),
);
