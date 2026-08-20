// @ts-check

/**
 * @param {{ assigneeId: string, columnId: string, dueDate: string }} filters
 */
export function hasStructuredTaskFilters(filters) {
  return (
    filters.assigneeId !== "ALL" ||
    filters.columnId !== "ALL" ||
    filters.dueDate !== "ALL"
  );
}

/**
 * @param {string} body
 * @param {boolean} isEditing
 */
export function hasUnsavedTaskDetailWork(body, isEditing) {
  return Boolean(body.trim()) || isEditing;
}
