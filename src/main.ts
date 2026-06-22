import 'zone.js';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// Legacy bootstrap (Angular v15 style) — NgModule based, not bootstrapApplication.
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
