import Sequence from "../sequence.js";
import test from "ava";

test("isIterable", t => {
  t.true(Sequence.isIterable([]));
  t.false(Sequence.isIterable({}));
});

test("some", t => {
  t.true(Sequence.range(3).some(i => (i % 2) !== 0));
  t.false(new Sequence([1, 3, 5]).some(i => (i % 2) === 0));
  const u = {};

  // Has to be a "function", otherwise "this" gets mangled.
  function smallThis(this: object, _: number, i: number): boolean {
    return (i < 3) && (this === u);
  }

  t.true(new Sequence([1, 3, 5]).some(smallThis, u));
});

test("range", t => {
  const seen = [];
  for (const x of Sequence.range(4)) {
    seen.push(x);
  }
  t.deepEqual(seen, [0, 1, 2, 3]);
  t.deepEqual([...Sequence.range(4, 0, -1)], [4, 3, 2, 1]);
});

test("equal", t => {
  t.true(Sequence.equal(new Sequence([1, 2]), new Sequence([1, 2])));
  t.false(Sequence.equal(new Sequence([1, 2]), new Sequence([1, 3])));
  t.false(Sequence.equal(new Sequence([1, 2]), new Sequence([1])));
  t.false(Sequence.equal(new Sequence([1]), new Sequence([1, 3])));
  const s = new Sequence([1, 2]);
  t.true(Sequence.equal(s, s));
});

test("pick", t => {
  t.true(Sequence.equal(Sequence.range(4).pick([1, 3]), new Sequence([1, 3])));
});

test("combinations", t => {
  t.deepEqual([...Sequence.range(3).combinations(5)], []);
  t.deepEqual(
    [...Sequence.range(3).combinations(2)],
    [[0, 1], [0, 2], [1, 2]]
  );
});

test("trunc", t => {
  t.deepEqual([...Sequence.range(3).trunc(0)], [0, 1, 2]);
  t.deepEqual([...Sequence.range(10).trunc(3)], [0, 1, 2, 3, 4, 5, 6]);
  t.deepEqual([...Sequence.range(3).trunc(-3)], [0, 1, 2]);
});

test("take", t => {
  t.deepEqual([...Sequence.range(3).take(0)], []);
  t.deepEqual([...Sequence.range(3).take(3)], [0, 1, 2]);
  t.deepEqual([...Sequence.range(3).take(4)], [0, 1, 2]);
  t.deepEqual([...Sequence.range(10).take(3)], [0, 1, 2]);
  t.deepEqual([...Sequence.range(10).take(-3)], [0, 1, 2, 3, 4, 5, 6]);
});

test("permutations", t => {
  t.deepEqual(
    new Sequence("ABCD").permutations(2).map(a => a.join("")).toArray(),
    ["AB", "AC", "AD", "BA", "BC", "BD", "CA", "CB", "CD", "DA", "DB", "DC"]
  );
  t.deepEqual(new Sequence([]).permutations(1).toArray(), []);
  t.deepEqual(Sequence.range(3).permutations(0).toArray(), []);
  t.deepEqual(Sequence.range(3).permutations(5).toArray(), []);
  t.deepEqual(Sequence.range(3).permutations(-5).toArray(), []);
});

test("powerset", t => {
  t.deepEqual(new Sequence("ABC").powerset().map(a => a.join("")).toArray(), [
    "", "A", "B", "C", "AB", "AC", "BC", "ABC"
  ]);
});

test("forEver", t => {
  t.deepEqual(Sequence.forEver("and ever").take(4).toArray(), [
    "and ever", "and ever", "and ever", "and ever"
  ]);
});

test("filter", t => {
  t.deepEqual(
    Sequence.range(0, 10000).take(10).filter(t => t % 2 !== 0).toArray(),
    [1, 3, 5, 7, 9]
  );
});

test("product", t => {
  t.deepEqual(
    Sequence.product([new Sequence("AB")], 2).map(a => a.join("")).toArray(),
    ["AA", "AB", "BA", "BB"]
  );
  t.deepEqual(
    Sequence.product([new Sequence("AB"), new Sequence("CD")]).map(a => a.join("")).toArray(),
    ["AC", "AD", "BC", "BD"]
  );
});

test("ncycle", t => {
  t.deepEqual([...new Sequence("AB").ncycle(0)], []);
  t.deepEqual([...new Sequence("AB").ncycle(1)], ["A", "B"]);
  t.deepEqual([...new Sequence("AB").ncycle(2)], ["A", "B", "A", "B"]);
  t.deepEqual([...new Sequence([]).ncycle(2)], []);
});

test("reduce", t => {
  t.is(Sequence.range(10).reduce<number>((t, x) => t + x), 45);
  t.is(Sequence.range(10).reduce<number>((t, x) => t + x, 1), 46);
  t.throws(() => new Sequence([]).reduce(() => 0), { message: "Empty iterable and no initializer" });
});

test("discard", t => {
  t.deepEqual(Sequence.range(5).discard(3).toArray(), [3, 4]);
});

test("count", t => {
  t.is(new Sequence([]).count(), 0);
  t.is(new Sequence([1]).count(), 1);
  t.is(new Sequence(new Set()).count(), 0);
  t.is(new Sequence(new Set([1])).count(), 1);
  t.is(new Sequence(new Map([])).count(), 0);
  t.is(new Sequence(new Map([[1, 2]])).count(), 1);
});

test("concat", t => {
  t.deepEqual(
    Sequence.range(5).concat(Sequence.range(2)).toArray(),
    [0, 1, 2, 3, 4, 0, 1]
  );
  t.deepEqual(
    Sequence.concat(Sequence.range(2), Sequence.range(3)).toArray(),
    [0, 1, 0, 1, 2]
  );
});

test("find", t => {
  t.is(Sequence.range(5).find(i => i % 2 === 1), 1);
});

test("dedup", t => {
  t.deepEqual(new Sequence([1, 2, 2, 3, 2]).dedup().toArray(), [1, 2, 3, 2]);
  t.deepEqual(new Sequence("ABbCb").dedup(
    (a, b) => a.toUpperCase() === ((typeof b === "symbol") ? b : b.toUpperCase())
  ).join(""), "ABCb");
});

test("slice", t => {
  const s = Sequence.range(10);
  t.deepEqual([...s.slice()], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  t.deepEqual([...s.slice(0, 0)], []);
  t.deepEqual([...s.slice(0, -1)], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  t.deepEqual([...s.slice(0, -12)], []);
  t.deepEqual([...s.slice(3, -1)], [3, 4, 5, 6, 7, 8]);
  t.deepEqual([...s.slice(12)], []);
  t.deepEqual([...s.slice(-12)], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  t.deepEqual([...s.slice(-2)], [8, 9]);
  t.deepEqual([...s.slice(-2, -3)], []);
  t.deepEqual([...s.slice(-2, -13)], []);
  t.deepEqual([...s.slice(-2, -1)], [8]);
  t.deepEqual([...s.slice(-4, -1)], [6, 7, 8]);
  t.deepEqual([...s.slice(-4, 9)], [6, 7, 8]);
  t.deepEqual([...s.slice(-4, 12)], [6, 7, 8, 9]);
});

test("chunks", t => {
  const s = Sequence.range(10);
  t.throws<RangeError>(() => s.chunks(0));
  t.throws<RangeError>(() => s.chunks(0.5));
  t.throws<RangeError>(() => s.chunks(-1));
  t.deepEqual([...s.chunks(5)], [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]]);
  t.deepEqual([...s.chunks(3)], [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]);
  t.deepEqual([...s.chunks(3.5)], [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]);
});

test("flat", t => {
  const s = new Sequence([1, [2, 3], [4, [5, 6]]]);
  t.deepEqual([...s.flat()], [1, 2, 3, 4, [5, 6]]);
  t.deepEqual([...s.flat(Infinity)], [1, 2, 3, 4, 5, 6]);
});

test("flatMap", t => {
  const s = new Sequence([1, [2, 3]]);
  t.deepEqual([...s.flatMap(x => Array.isArray(x) ? x : -x)], [-1, 2, 3]);
});

test("at", t => {
  t.is(Sequence.range(Infinity).at(4), 4);
  t.is(Sequence.range(4).at(5), undefined);
});
