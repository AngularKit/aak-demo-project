import { Component, Input } from '@angular/core';

import { Task } from '../task.model';

// Legacy presentational component (Angular v15 style):
// non-standalone, default change detection, declared in app.module.ts.
@Component({
  selector: 'app-task-detail',
  standalone: false,
  templateUrl: './task-detail.component.html',
})
export class TaskDetailComponent {
  @Input() task: Task | undefined | null;
}
