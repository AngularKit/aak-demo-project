import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { AppComponent } from './app.component';
import { TaskService } from './tasks/task.service';
import { TaskDetailComponent } from './tasks/task-detail/task-detail.component';
import { TaskList } from './tasks/task-list/task-list';
import { TaskEffects } from './tasks/store/task.effects';
import { TASK_FEATURE_KEY, taskReducer } from './tasks/store/task.reducer';

// Legacy root NgModule (Angular v15 style):
//  - components are declared here (none are standalone)
//  - classic NgRx wired with StoreModule.forRoot + EffectsModule.forRoot
//  - TaskService provided at the module level
@NgModule({
  declarations: [AppComponent, TaskDetailComponent],
  imports: [
    BrowserModule,
    StoreModule.forRoot({ [TASK_FEATURE_KEY]: taskReducer }),
    EffectsModule.forRoot([TaskEffects]),
    TaskList,
  ],
  providers: [TaskService],
  bootstrap: [AppComponent],
})
export class AppModule {}
