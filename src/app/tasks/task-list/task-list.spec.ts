import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Task } from '../task.model';
import { aTask } from '../task.builder';
import { TaskList } from './task-list';

function setTasks(fixture: ComponentFixture<TaskList>, tasks: Task[]): void {
  fixture.componentRef.setInput('tasks', tasks);
  fixture.detectChanges();
}

function items(fixture: ComponentFixture<TaskList>): HTMLButtonElement[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('.task-list li button'),
  );
}

function type(fixture: ComponentFixture<TaskList>, value: string): void {
  const input: HTMLInputElement = fixture.nativeElement.querySelector(
    '.task-list input',
  );
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

describe('TaskList', () => {
  let fixture: ComponentFixture<TaskList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskList],
    }).compileComponents();
    fixture = TestBed.createComponent(TaskList);
  });

  describe('rendering the list', () => {
    it('renders a clickable button per task', () => {
      const tasks = [
        aTask({ title: 'Alpha' }),
        aTask({ title: 'Beta' }),
        aTask({ title: 'Gamma' }),
      ];

      setTasks(fixture, tasks);

      const rendered = items(fixture);
      expect(rendered).toHaveLength(3);
      expect(rendered.map((b) => b.textContent)).toEqual([
        expect.stringContaining('Alpha'),
        expect.stringContaining('Beta'),
        expect.stringContaining('Gamma'),
      ]);
    });

    it('renders title, status and assignee for each task', () => {
      setTasks(fixture, [
        aTask({ title: 'Write docs', status: 'in-progress', assignee: 'Bob' }),
      ]);

      const [button] = items(fixture);
      expect(button.textContent).toContain('Write docs');
      expect(button.textContent).toContain('in-progress');
      expect(button.textContent).toContain('Bob');
    });

    it('renders an empty list when no tasks are provided', () => {
      setTasks(fixture, []);

      expect(items(fixture)).toHaveLength(0);
    });
  });

  describe('filtering by search term', () => {
    const tasks = [
      aTask({ title: 'Design the UI', assignee: 'Alice' }),
      aTask({ title: 'Wire the backend', assignee: 'Bob' }),
      aTask({ title: 'Review RxJS flow', assignee: 'Carol' }),
    ];

    beforeEach(() => setTasks(fixture, tasks));

    it('filters by title (case-insensitive)', () => {
      type(fixture, 'DESIGN');

      const rendered = items(fixture);
      expect(rendered).toHaveLength(1);
      expect(rendered[0].textContent).toContain('Design the UI');
    });

    it('filters by assignee (case-insensitive)', () => {
      type(fixture, 'bob');

      const rendered = items(fixture);
      expect(rendered).toHaveLength(1);
      expect(rendered[0].textContent).toContain('Wire the backend');
    });

    it('trims surrounding whitespace before filtering', () => {
      type(fixture, '   carol   ');

      const rendered = items(fixture);
      expect(rendered).toHaveLength(1);
      expect(rendered[0].textContent).toContain('Review RxJS flow');
    });

    it('restores the full list when the term is cleared', () => {
      type(fixture, 'design');
      expect(items(fixture)).toHaveLength(1);

      type(fixture, '');
      expect(items(fixture)).toHaveLength(3);
    });

    it('renders the empty message when nothing matches', () => {
      type(fixture, 'nonexistent');

      expect(items(fixture)).toHaveLength(0);
      expect(fixture.nativeElement.textContent).toContain('No tasks match.');
    });
  });

  describe('selecting a task', () => {
    it('emits selected with the clicked task on click', () => {
      const tasks = [aTask({ title: 'First' }), aTask({ title: 'Second' })];
      setTasks(fixture, tasks);

      const emitted: Task[] = [];
      fixture.componentInstance.selected.subscribe((task: Task) =>
        emitted.push(task),
      );

      items(fixture)[1].click();

      expect(emitted).toEqual([tasks[1]]);
    });

    it('emits the matching task after filtering', () => {
      const tasks = [
        aTask({ title: 'Design the UI', assignee: 'Alice' }),
        aTask({ title: 'Wire the backend', assignee: 'Bob' }),
      ];
      setTasks(fixture, tasks);

      const emitted: Task[] = [];
      fixture.componentInstance.selected.subscribe((task: Task) =>
        emitted.push(task),
      );

      type(fixture, 'bob');
      items(fixture)[0].click();

      expect(emitted).toEqual([tasks[1]]);
    });
  });

  describe('keyboard accessibility', () => {
    it('exposes each item as a native button operable by keyboard', () => {
      setTasks(fixture, [aTask({ title: 'Operable' })]);

      const [button] = items(fixture);
      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('button');
    });
  });
});
