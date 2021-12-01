import fs from "fs";
import test from "ava";
import url from "url";

// Use TEST_DAY=14 to run day 14 only
const TEST_DAY = "TEST_DAY";

let files: string[] = [];
const days = process.env[TEST_DAY];
if (days) {
  if (days === "-1") {
    test("Skipping Days", t => t.pass());
  } else {
    const m = days.match(/\d+/g);
    if (m) {
      files = m.map(d => `day${d}.tests`);
    }
  }
} else {
  files = fs
    .readdirSync(new URL("./", import.meta.url))
    .filter(f => f.match(/day\d+.tests/));
  const num = (n: string) => Number(n.match(/\d+/)?.[0]);
  files.sort((a, b) => num(a) - num(b));
}

for (const f of files) {
  // eslint-disable-next-line @typescript-eslint/no-loop-func
  await test(f, async t => {
    const data = fs.readFileSync(new URL(f, import.meta.url), "utf-8");
    const j = JSON.parse(data);
    t.truthy(j);
    const day = Number(f.match(/\d+/)?.[0]);
    const modname = new URL(`../day${day}.ts`, import.meta.url);
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const mod = await import(url.fileURLToPath(modname));
    if (typeof mod.default !== "function") {
      throw new Error(`Invalid module: "${modname}"`);
    }
    t.deepEqual(mod.default(), j);
  });
}
