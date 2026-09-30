'use strict';

// Validates server/seed/sample-track.json against the schemas (including the
// cross-field rules in the pre-validate hooks) and checks that secrets never
// appear in the public JSON shape. Needs no database connection.

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const mongoose = require('mongoose');
const { Track, Module, Topic, Lesson, Problem } = require('../src/models');

const seed = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'seed', 'sample-track.json'), 'utf8')
);
const oid = () => new mongoose.Types.ObjectId();

let checked = 0;
let failures = 0;

// Must validate. Uses async validate() so pre('validate') hooks run.
async function expectValid(label, doc) {
  checked += 1;
  try {
    await doc.validate();
  } catch (err) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    for (const [p, e] of Object.entries(err.errors || {})) console.error(`      ${p}: ${e.message}`);
    if (!err.errors) console.error(`      ${err.message}`);
  }
}

// Must be rejected, and the error must mention the expected path.
async function expectInvalid(label, doc, expectedPath) {
  checked += 1;
  try {
    await doc.validate();
    failures += 1;
    console.error(`FAIL  ${label}: invalid document was accepted`);
  } catch (err) {
    if (!err.errors || !err.errors[expectedPath]) {
      failures += 1;
      console.error(`FAIL  ${label}: expected an error on "${expectedPath}", got: ${Object.keys(err.errors || {})}`);
    }
  }
}

async function main() {
  const { modules, ...trackData } = seed;
  const trackId = oid();
  await expectValid(`track ${seed.slug}`, new Track({ _id: trackId, ...trackData }));

  for (const mod of modules) {
    const { topics, ...moduleData } = mod;
    const moduleId = oid();
    await expectValid(`module ${mod.slug}`, new Module({ _id: moduleId, track: trackId, ...moduleData }));

    for (const t of topics) {
      const { lesson, checks, problems, interviewQuestions, ...topicData } = t;
      const topicId = oid();
      await expectValid(`topic ${t.slug}`, new Topic({ _id: topicId, track: trackId, module: moduleId, ...topicData }));
      await expectValid(`lesson ${t.slug}`, new Lesson({ track: trackId, topic: topicId, ...lesson }));

      for (const item of [...checks, ...problems, ...interviewQuestions]) {
        const doc = new Problem({ track: trackId, module: moduleId, topic: topicId, ...item });
        await expectValid(`item ${item.slug}`, doc);

        // Public JSON must never contain secrets
        const json = doc.toJSON();
        for (const key of ['correctOptionIds', 'explanationMd', 'modelAnswerMd', 'hints']) {
          assert(!(key in json), `${item.slug}: "${key}" leaked in toJSON`);
        }
        assert((json.tests || []).every((x) => !x.hidden), `${item.slug}: hidden test leaked in toJSON`);
      }
    }
  }

  const base = {
    track: oid(), module: oid(), topic: oid(),
    difficulty: 'easy', order: 1, statementMd: 'x',
  };

  // Negative 1: an MCQ whose correct option does not exist
  await expectInvalid('bad MCQ (unknown correct id)', new Problem({
    ...base, slug: 'bad-mcq', title: 'Bad', type: 'mcq', stage: 'check', runner: 'none',
    options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
    correctOptionIds: ['zzz'],
  }), 'correctOptionIds');

  // Negative 2: a coding problem whose tests are all hidden (no sample)
  await expectInvalid('bad coding (no sample test)', new Problem({
    ...base, slug: 'bad-coding', title: 'Bad', type: 'coding', stage: 'practice',
    runner: 'iframe-js', points: 10,
    tests: [{ id: 't1', expression: '1+1', expected: 2, hidden: true }],
  }), 'tests');

  console.log(`${checked} checks, ${failures} failed`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});