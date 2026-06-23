import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { AppComponent } from './app.component';
import { AppModule } from './app.module';

describe('bootstrap smoke', () => {
  it('creates AppComponent with the real AppModule wired', async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
