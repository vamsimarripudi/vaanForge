const fs = require("fs");
const path = require("path");

const tracker = path.join(__dirname, "..", "docs", "PHASE-TRACKER.md");
const content = fs.readFileSync(tracker, "utf8");
const completed = (content.match(/\| Complete \|/g) || []).length;
const active = (content.match(/\| In progress \|/g) || []).length;
const pending = (content.match(/\| Pending \|/g) || []).length;
const phases = [...content.matchAll(/^\| (\d+) \|/gm)].map((match) => Number(match[1]));
const expectedPhaseCount = 48;

console.log(`KRAVIA phase status: ${completed} complete, ${active} in progress, ${pending} pending.`);

if (phases.length !== expectedPhaseCount) {
  console.error(`Expected ${expectedPhaseCount} phases, found ${phases.length}. Update phase gates and docs if the plan changes.`);
  process.exit(1);
}

if (active || pending || completed !== expectedPhaseCount) {
  console.error("Phase tracker is not fully complete.");
  process.exit(1);
}
