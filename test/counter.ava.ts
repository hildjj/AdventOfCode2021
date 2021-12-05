import Counter from "../counter.js";
import test from "ava";

test("count", t => {
  const c = new Counter();
  c.add(1, 2);
  c.add(1, 2);
  c.add(3, 4);
  t.is(c.total(), 2);
  t.is(c.total(p => p > 1), 1);
  t.is(c.total(p => p), 3);
});
