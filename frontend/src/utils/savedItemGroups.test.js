import { formatFinalAnswer, groupSavedItems } from './savedItemGroups';

const problem = { id: 'p1', title: 'Ball from a building', description: 'A student throws a ball…' };
const solution = { id: 's1', finalAnswer: '{"timeToHitGround":"3.16 seconds"}' };

describe('groupSavedItems', () => {
  it('shows a problem and its saved solution as one item', () => {
    const items = [
      { id: 'sol', type: 'SOLUTION', problemId: 'p1', solutionId: 's1', problem, solution, starred: true, tags: ['physics'], updatedAt: '2026-08-25T10:00:00Z' },
      { id: 'note', type: 'CONCEPT_NOTE', problemId: 'p1', conceptNoteId: 'c1' },
      { id: 'prob', type: 'PROBLEM', problemId: 'p1', problem, folderId: 'f1', tags: ['medium'], createdAt: '2026-08-25T09:00:00Z' },
      { id: 'other', type: 'PROBLEM', problemId: 'p2', problem: { id: 'p2' } },
    ];

    const grouped = groupSavedItems(items);

    expect(grouped.map((item) => item.id)).toEqual(['prob', 'note', 'other']);
    expect(grouped[0]).toMatchObject({
      type: 'PROBLEM',
      hasSolution: true,
      solution,
      solutionId: 's1',
      starred: true,
      folderId: 'f1',
      memberIds: ['prob', 'sol'],
    });
    expect(grouped[0].tags.sort()).toEqual(['medium', 'physics']);
    expect(grouped[1].memberIds).toEqual(['note']);
    expect(grouped[2]).toMatchObject({ hasSolution: false, memberIds: ['other'] });
  });

  it('keeps a saved solution whose problem item was removed', () => {
    const [item] = groupSavedItems([
      { id: 'sol', type: 'SOLUTION', problemId: 'p1', solutionId: 's1', problem, solution },
    ]);
    expect(item).toMatchObject({ id: 'sol', type: 'PROBLEM', hasSolution: true, memberIds: ['sol'] });
  });
});

describe('formatFinalAnswer', () => {
  it('turns a JSON final answer into readable text', () => {
    expect(formatFinalAnswer(
      '{"finalVelocity":{"direction":"64.3° below the horizontal","magnitude":"28.7 m/s"},"timeToHitGround":"3.16 seconds","horizontalDistance":"41.1 m"}'
    )).toBe('Final velocity: 28.7 m/s, 64.3° below the horizontal · Time to hit ground: 3.16 seconds · Horizontal distance: 41.1 m');
  });

  it('keeps plain text answers', () => {
    expect(formatFinalAnswer('  v = 12 m/s ')).toBe('v = 12 m/s');
    expect(formatFinalAnswer(null)).toBe('');
  });
});
