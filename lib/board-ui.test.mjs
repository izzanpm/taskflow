import assert from "node:assert/strict";
import test from "node:test";

import {
  hasStructuredTaskFilters,
  hasUnsavedTaskDetailWork,
} from "./board-ui.mjs";

const emptyFilters = {
  search: "",
  assigneeId: "ALL",
  columnId: "ALL",
  dueDate: "ALL",
};

test("structured filters ignore search-only filtering", () => {
  assert.equal(
    hasStructuredTaskFilters({ ...emptyFilters, search: "launch" }),
    false,
  );
  assert.equal(
    hasStructuredTaskFilters({ ...emptyFilters, assigneeId: "member-1" }),
    true,
  );
  assert.equal(
    hasStructuredTaskFilters({ ...emptyFilters, columnId: "column-1" }),
    true,
  );
  assert.equal(
    hasStructuredTaskFilters({ ...emptyFilters, dueDate: "OVERDUE" }),
    true,
  );
});

test("task detail closes freely only without a comment draft or active edit", () => {
  assert.equal(hasUnsavedTaskDetailWork("   ", false), false);
  assert.equal(hasUnsavedTaskDetailWork("Status update", false), true);
  assert.equal(hasUnsavedTaskDetailWork("", true), true);
});
