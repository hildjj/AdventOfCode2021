import { NumberSequence, Sequence } from "../sequence.js";
//
// import crypto from "crypto";
import test from "ava";

test("isIterable", t => {
  t.true(Sequence.isIterable([]));
  t.false(Sequence.isIterable({}));
});

test("isSequence", t => {
  t.true(Sequence.isSequence(Sequence.range(Infinity)));
  t.false(Sequence.isSequence(null));
  t.false(Sequence.isSequence({}));
  t.false(Sequence.isSequence(1));
});

test("equal", t => {
  t.true(Sequence.equal(new Sequence([1, 2]), new Sequence([1, 2])));
  t.false(Sequence.equal(new Sequence([1, 2]), new Sequence([1, 3])));
  t.false(Sequence.equal(new Sequence([1, 2]), new Sequence([1])));
  t.false(Sequence.equal(new Sequence([1]), new Sequence([1, 3])));
  const s = new Sequence([1, 2]);
  t.true(Sequence.equal(s, s));
});

test("factorial", t => {
  t.deepEqual([...Sequence.factorial().take(5)], [1, 1, 2, 6, 24]);
});

test("forEver", t => {
  t.deepEqual(Sequence.forEver("and ever").take(4).toArray(), [
    "and ever", "and ever", "and ever", "and ever"
  ]);
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

test("range", t => {
  const seen = [];
  for (const x of Sequence.range(4)) {
    seen.push(x);
  }
  t.deepEqual(seen, [0, 1, 2, 3]);
  t.deepEqual([...Sequence.range(4, 0, -1)], [4, 3, 2, 1]);
  t.is(Sequence.range(0, 10, 2).count(), 5);
  t.is(Sequence.range(3, 10, 3).count(), 3);
  t.is(Sequence.range(10, 3, -3).count(), 3);
  t.is(Sequence.range(10, 3).count(), 0);
});

test("rangeI", t => {
  const seen = [];
  for (const x of Sequence.rangeI(4)) {
    seen.push(x);
  }
  t.deepEqual(seen, [0, 1, 2, 3, 4]);
  t.deepEqual([...Sequence.rangeI(4, 0, -1)], [4, 3, 2, 1, 0]);
});

test("zip", t => {
  t.deepEqual(
    [...Sequence.zip(Sequence.range(3), Sequence.range(4, 7))],
    [[0, 4], [1, 5], [2, 6]]
  );
  t.deepEqual(
    [...Sequence.zip(Sequence.range(3), new Sequence([]))],
    []
  );
});

test("at", t => {
  t.is(Sequence.range(Infinity).at(4), 4);
  t.is(Sequence.range(4).at(5), undefined);
});

test("chunks", t => {
  const s = Sequence.range(10);
  t.throws(() => s.chunks(0), { instanceOf: RangeError });
  t.throws(() => s.chunks(0.5), { instanceOf: RangeError });
  t.throws(() => s.chunks(-1), { instanceOf: RangeError });
  t.deepEqual([...s.chunks(5)], [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]]);
  t.deepEqual([...s.chunks(3)], [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]);
  t.deepEqual([...s.chunks(3.5)], [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]);
});

test("combinations", t => {
  t.deepEqual([...Sequence.range(3).combinations(5)], []);
  t.deepEqual(
    [...Sequence.range(3).combinations(2)],
    [[0, 1], [0, 2], [1, 2]]
  );
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

test("count", t => {
  t.is(new Sequence([]).count(), 0);
  t.is(new Sequence([1]).count(), 1);
  t.is(Sequence.range(100).count(), 100);
  t.is(new Sequence(new Set()).count(), 0);
  t.is(new Sequence(new Set([1])).count(), 1);
  t.is(new Sequence(new Map([])).count(), 0);
  t.is(new Sequence(new Map([[1, 2]])).count(), 1);
});

test("dedup", t => {
  t.deepEqual(new Sequence([1, 2, 2, 3, 2]).dedup().toArray(), [1, 2, 3, 2]);
  t.deepEqual(new Sequence("ABbCb").dedup(
    (a, b) => a.toUpperCase() === ((typeof b === "symbol") ? b : b.toUpperCase())
  ).join(""), "ABCb");
});

test("discard", t => {
  t.deepEqual(Sequence.range(5).discard(3).toArray(), [3, 4]);
});

test("entries", t => {
  const s = new Sequence("abc");
  t.deepEqual([...s.entries()], [[0, "a"], [1, "b"], [2, "c"]]);
});

test("every", t => {
  t.is(new Sequence("abc").every(i => i === i.toLowerCase()), true);
  t.is(new Sequence("aBc").every(i => i === i.toLowerCase()), false);
});

test("find", t => {
  t.is(Sequence.range(5).find(i => i % 2 === 1), 1);
  t.is(Sequence.range(5).find(i => i === 10), undefined);
});

test("findIndex", t => {
  t.is(new Sequence("aBc").findIndex(i => i.toUpperCase() === i), 1);
  t.is(Sequence.range(5).findIndex(i => i === 10), -1);
});

test("filter", t => {
  t.deepEqual(
    Sequence.range(0, 10000).take(10).filter(t => t % 2 !== 0).toArray(),
    [1, 3, 5, 7, 9]
  );
});

test("first", t => {
  t.is(Sequence.range(Infinity).first(), 0);
  t.is(new Sequence([]).first(), undefined);
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

test("groupBy", t => {
  t.deepEqual(
    [...new Sequence([1, 1, 1, 3, 3, 2, 2, 2]).groupBy((a, b) => a === b)],
    [[1, 1, 1], [3, 3], [2, 2, 2]]
  );
  t.deepEqual(
    [...new Sequence([1, 1, 2, 3, 2, 3, 2, 3, 4]).groupBy((a, b) => a <= b)],
    [[1, 1, 2, 3], [2, 3], [2, 3, 4]]
  );
});

test("isEmpty", t => {
  t.true(new Sequence([]).isEmpty());
  t.false(new Sequence([1]).isEmpty());
});

test("isSorted", t => {
  t.true(Sequence.range(4).isSorted());
  t.true(new Sequence([1, 1, 2, 3]).isSorted());
  t.false(new Sequence(["aaa", "a"]).isSorted((a, b) => a.length <= b.length));
});

test("last", t => {
  t.is(new Sequence([]).last(), undefined);
  t.is(new Sequence([1, 2, 3]).last(), 3);
});

test("ncycle", t => {
  t.deepEqual([...new Sequence("AB").ncycle(0)], []);
  t.deepEqual([...new Sequence("AB").ncycle(1)], ["A", "B"]);
  t.deepEqual([...new Sequence("AB").ncycle(2)], ["A", "B", "A", "B"]);
  t.deepEqual([...new Sequence([]).ncycle(2)], []);
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

test("pick", t => {
  t.true(Sequence.equal(Sequence.range(4).pick([1, 3]), new Sequence([1, 3])));
});

test("powerset", t => {
  t.deepEqual(new Sequence("ABC").powerset().map(a => a.join("")).toArray(), [
    "", "A", "B", "C", "AB", "AC", "BC", "ABC"
  ]);
});

test("reduce", t => {
  t.is(Sequence.range(10).reduce<number>((t, x) => t + x), 45);
  t.is(Sequence.range(10).reduce<number>((t, x) => t + x, 1), 46);
  t.throws(() => new Sequence([]).reduce(() => 0), { message: "Empty iterable and no initializer" });
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

test("take", t => {
  t.deepEqual([...Sequence.range(3).take(0)], []);
  t.deepEqual([...Sequence.range(3).take(3)], [0, 1, 2]);
  t.deepEqual([...Sequence.range(3).take(4)], [0, 1, 2]);
  t.deepEqual([...Sequence.range(10).take(3)], [0, 1, 2]);
  t.deepEqual([...Sequence.range(10).take(-3)], [0, 1, 2, 3, 4, 5, 6]);
});

test("trunc", t => {
  t.deepEqual([...Sequence.range(3).trunc(0)], [0, 1, 2]);
  t.deepEqual([...Sequence.range(10).trunc(3)], [0, 1, 2, 3, 4, 5, 6]);
  t.deepEqual([...Sequence.range(3).trunc(-3)], [0, 1, 2]);
});

test("windows", t => {
  t.deepEqual(
    [...new Sequence("ABCD").windows(2).map(i => i.join(""))],
    ["AB", "BC", "CD"]
  );
});

//#region NumberSequence
test("avg", t => {
  t.is(Sequence.range(5).avg(), 2);
});

test("cumulativeAvg", t => {
  t.deepEqual([...Sequence.range(5).cumulativeAvg()], [0, 0.5, 1, 1.5, 2]);
});

//
// test("random", t => {
//   t.throws(() => Sequence.random({ fn: 4 } as any), { instanceOf: TypeError });
//   t.throws(() => Sequence.random({
//     min: "A", integer: true, fn: (a: number, b: number) => a + b
//   } as any).first(), { instanceOf: TypeError });
//   t.throws(() => Sequence.random({
//     max: "A", integer: true, fn: (a: number, b: number) => a + b
//   } as any).first(), { instanceOf: TypeError });

//   t.throws(() => Sequence.random({
//     min: "A", integer: true, fn: () => 0
//   } as any).first(), { instanceOf: TypeError });
//   t.throws(() => Sequence.random({
//     max: "A", integer: true, fn: () => 0
//   } as any).first(), { instanceOf: TypeError });
//   t.throws(() => Sequence.random({
//     fn: (a: number) => a,
//     integer: true,
//   } as any).first(), { instanceOf: TypeError });

//   t.true(Sequence.random({
//     min: 3, max: 10, integer: true, fn: crypto.randomInt
//   }).take(1000).every(v => (v | 0) === v && v >= 3 && v < 10));
//   t.true(Sequence.random({
//     min: -1, max: 2, integer: true, fn: crypto.randomInt
//   }).take(1000).every(v => (v | 0) === v && v >= -1 && v < 2));
//   t.true(Sequence.random({
//     min: 3, max: 10, integer: true
//   }).take(1000).every(v => (v | 0) === v && v >= 3 && v < 10));
//   t.true(Sequence.random().take(1000).every(v => v >= 0 && v < 1));
// });

test("sum", t => {
  t.is(Sequence.range(10).sum(), 45);
});

test("nproduct", t => {
  t.is(new NumberSequence([3, 7, 9]).product(), 189);
});

test("stdev", t => {
  // Inputs from the output of random(), bucketized.
  const n = new NumberSequence([
    99753, 99844, 100312, 99825, 99816,
    100140, 100256, 99969, 100396, 99689,
  ]);
  // Yeah, yeah, I know.  Float===.
  // I calculated this in google sheets with stdevp().
  t.is(n.stdev(), 242.2403764858371);
});

//#endregion NumberSequence
