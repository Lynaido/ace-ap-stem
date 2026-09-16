// Notes Hub shows a problem and its saved solution as one learning item.
// The API still stores them as separate saved items (a PROBLEM saved when the
// problem is created, a SOLUTION saved from the solution view), so they are
// merged for display and every action applies to all of their saved items.

const time = (item) => {
  const value = new Date(item?.updatedAt || item?.createdAt).getTime();
  return Number.isFinite(value) ? value : 0;
};

export const groupSavedItems = (items = []) => {
  const groups = new Map();
  items.forEach((item) => {
    if (!item?.problemId || (item.type !== 'PROBLEM' && item.type !== 'SOLUTION')) return;
    const group = groups.get(item.problemId) || { problemItem: null, solutionItems: [] };
    if (item.type === 'PROBLEM' && !group.problemItem) group.problemItem = item;
    else if (item.type === 'SOLUTION') group.solutionItems.push(item);
    else group.duplicates = [...(group.duplicates || []), item];
    groups.set(item.problemId, group);
  });

  const emitted = new Set();
  const result = [];
  items.forEach((item) => {
    const group = item?.problemId && groups.get(item.problemId);
    if (!group || (item.type !== 'PROBLEM' && item.type !== 'SOLUTION')) {
      result.push({ ...item, memberIds: [item.id] });
      return;
    }
    if (emitted.has(item.problemId)) return;
    emitted.add(item.problemId);

    const members = [group.problemItem, ...group.solutionItems, ...(group.duplicates || [])].filter(Boolean);
    const latestSolution = [...group.solutionItems].sort((a, b) => time(b) - time(a))[0];
    const primary = group.problemItem || latestSolution;
    const newest = [...members].sort((a, b) => time(b) - time(a))[0];
    result.push({
      ...primary,
      type: 'PROBLEM',
      problem: primary.problem || latestSolution?.problem,
      solution: latestSolution?.solution || null,
      solutionId: latestSolution?.solutionId || null,
      hasSolution: Boolean(latestSolution?.solution),
      starred: members.some((member) => member.starred),
      folderId: group.problemItem?.folderId ?? latestSolution?.folderId ?? null,
      tags: [...new Set(members.flatMap((member) => member.tags || []))],
      updatedAt: newest.updatedAt || newest.createdAt,
      createdAt: primary.createdAt,
      memberIds: members.map((member) => member.id),
    });
  });
  return result;
};

const humanizeKey = (key) => key
  .replace(/_/g, ' ')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .toLowerCase()
  .replace(/^./, (letter) => letter.toUpperCase());

const describeValue = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(describeValue).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    // e.g. { magnitude: "28.7 m/s", direction: "64.3° below the horizontal" }
    const { magnitude, value: inner, direction, ...rest } = value;
    const lead = [magnitude ?? inner, direction].filter((part) => part !== undefined && part !== '').map(describeValue);
    const others = Object.entries(rest).map(([key, item]) => `${humanizeKey(key).toLowerCase()} ${describeValue(item)}`);
    return [...lead, ...others].filter(Boolean).join(', ');
  }
  return String(value).trim();
};

// A readable one-line answer for a card. Solutions store the final answer
// either as text or as JSON such as {"finalVelocity":{...},"timeToHitGround":"3.16 s"}.
export const formatFinalAnswer = (finalAnswer) => {
  if (finalAnswer === null || finalAnswer === undefined) return '';
  let value = finalAnswer;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^[[{]/.test(trimmed)) return trimmed;
    try {
      value = JSON.parse(trimmed);
    } catch (error) {
      return trimmed;
    }
  }
  if (Array.isArray(value)) return describeValue(value);
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, item]) => `${humanizeKey(key)}: ${describeValue(item)}`)
      .join(' · ');
  }
  return String(value);
};
