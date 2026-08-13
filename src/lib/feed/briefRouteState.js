import { BRIEF_CATEGORY_IDS } from './briefCategories';

const CATEGORY_IDS = new Set(BRIEF_CATEGORY_IDS);
const cloneParams = (searchParams) => new URLSearchParams(searchParams?.toString() || '');

export function readBriefRouteState(searchParams) {
  const isBriefOpen = searchParams?.get('brief') === '1';
  const requestedCategory = searchParams?.get('category');
  return {
    isBriefOpen,
    categoryId: isBriefOpen && CATEGORY_IDS.has(requestedCategory) ? requestedCategory : null,
  };
}

export function openBriefParams(searchParams) {
  const next = cloneParams(searchParams);
  next.set('brief', '1');
  next.delete('category');
  return next;
}

export function openBriefCategoryParams(searchParams, categoryId) {
  const next = openBriefParams(searchParams);
  if (CATEGORY_IDS.has(categoryId)) next.set('category', categoryId);
  return next;
}

export function closeBriefCategoryParams(searchParams) {
  const next = cloneParams(searchParams);
  next.set('brief', '1');
  next.delete('category');
  return next;
}

export function closeBriefParams(searchParams) {
  const next = cloneParams(searchParams);
  next.delete('brief');
  next.delete('category');
  return next;
}
