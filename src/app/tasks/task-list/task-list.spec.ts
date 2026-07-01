import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Task } from '../task.model';
import { aTask } from '../task.builder';
import { TaskList } from './task-list';

function renderList(tasks: Task[], onSelected?: (task: Task) => void) {
  return render(TaskList, {
    inputs: { tasks },
    ...(onSelected ? { on: { selected: onSelected } } : {}),
  });
}

const taskButtons = (): HTMLElement[] => screen.queryAllByRole('button');
const searchBox = (): HTMLElement => screen.getByPlaceholderText('Search tasks...');

describe('TaskList', () => {
  describe('rendering the list', () => {
    it('renders a clickable button per task', async () => {
      await renderList([
        aTask({ title: 'Alpha' }),
        aTask({ title: 'Beta' }),
        aTask({ title: 'Gamma' }),
      ]);

      const rendered = taskButtons();
      expect(rendered).toHaveLength(3);
      expect(rendered.map((b) => b.textContent)).toEqual([
        expect.stringContaining('Alpha'),
        expect.stringContaining('Beta'),
        expect.stringContaining('Gamma'),
      ]);
    });

    it('renders title, status and assignee for each task', async () => {
      await renderList([
        aTask({ title: 'Write docs', status: 'in-progress', assignee: 'Bob' }),
      ]);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Write docs');
      expect(button).toHaveTextContent('in-progress');
      expect(button).toHaveTextContent('Bob');
    });

    it('renders no task when the list is empty', async () => {
      await renderList([]);

      expect(taskButtons()).toHaveLength(0);
    });
  });

  describe('filtering by search term', () => {
    const tasks = [
      aTask({ title: 'Design the UI', assignee: 'Alice' }),
      aTask({ title: 'Wire the backend', assignee: 'Bob' }),
      aTask({ title: 'Review RxJS flow', assignee: 'Carol' }),
    ];

    it('filters by title (case-insensitive)', async () => {
      await renderList(tasks);

      await userEvent.type(searchBox(), 'DESIGN');

      const rendered = taskButtons();
      expect(rendered).toHaveLength(1);
      expect(rendered[0]).toHaveTextContent('Design the UI');
    });

    it('filters by assignee (case-insensitive)', async () => {
      await renderList(tasks);

      await userEvent.type(searchBox(), 'bob');

      const rendered = taskButtons();
      expect(rendered).toHaveLength(1);
      expect(rendered[0]).toHaveTextContent('Wire the backend');
    });

    it('trims surrounding whitespace before filtering', async () => {
      await renderList(tasks);

      await userEvent.type(searchBox(), '   carol   ');

      const rendered = taskButtons();
      expect(rendered).toHaveLength(1);
      expect(rendered[0]).toHaveTextContent('Review RxJS flow');
    });

    it('restores the full list when the term is cleared', async () => {
      await renderList(tasks);

      await userEvent.type(searchBox(), 'design');
      expect(taskButtons()).toHaveLength(1);

      await userEvent.clear(searchBox());
      expect(taskButtons()).toHaveLength(3);
    });

    it('renders the empty message when nothing matches', async () => {
      await renderList(tasks);

      await userEvent.type(searchBox(), 'nonexistent');

      expect(taskButtons()).toHaveLength(0);
      expect(screen.getByText('No tasks match.')).toBeInTheDocument();
    });
  });

  describe('selecting a task', () => {
    it('emits selected with the clicked task on click', async () => {
      const tasks = [aTask({ title: 'First' }), aTask({ title: 'Second' })];
      const selected = vi.fn();
      await renderList(tasks, selected);

      await userEvent.click(taskButtons()[1]);

      expect(selected).toHaveBeenCalledTimes(1);
      expect(selected).toHaveBeenCalledWith(tasks[1]);
    });

    it('emits the matching task after filtering', async () => {
      const tasks = [
        aTask({ title: 'Design the UI', assignee: 'Alice' }),
        aTask({ title: 'Wire the backend', assignee: 'Bob' }),
      ];
      const selected = vi.fn();
      await renderList(tasks, selected);

      await userEvent.type(searchBox(), 'bob');
      await userEvent.click(taskButtons()[0]);

      expect(selected).toHaveBeenCalledWith(tasks[1]);
    });
  });

  describe('keyboard accessibility', () => {
    it('activates a task with the keyboard (native button)', async () => {
      const tasks = [aTask({ title: 'Operable' })];
      const selected = vi.fn();
      await renderList(tasks, selected);

      taskButtons()[0].focus();
      await userEvent.keyboard('{Enter}');

      expect(selected).toHaveBeenCalledWith(tasks[0]);
    });
  });
});
