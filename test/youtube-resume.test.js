import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createYouTubeResume, isActiveYouTubeAsset } from '../src/services/youtubeResume.js'

const item = { id: 10378, title: 'Big Buck Bunny', media_type: 'movie' }
const record = { item, source: 'verified-asset', position: 42, duration: 600, completed: false, lastPlayed: 1 }

test('waits for duration, requests a single seek, then waits for confirmation', () => {
  let duration = 0
  let position = 0
  const calls = []
  const player = {
    getVideoUrl: () => 'https://www.youtube.com/watch?v=' + record.source,
    getDuration: () => duration,
    getCurrentTime: () => position,
    seekTo: (...args) => calls.push(args),
  }
  const resume = createYouTubeResume(record, record.source, () => assert.fail('Valid seek'))
  resume.update(player)
  assert.equal(resume.settled, false)
  assert.deepEqual(calls, [])
  duration = 600
  resume.update(player)
  resume.update(player)
  assert.deepEqual(calls, [[42, true]])
  assert.equal(resume.settled, false)
  position = 42
  resume.update(player)
  assert.equal(resume.settled, true)
})

test('declines an incompatible asset or duration and reports an unconfirmed seek once', () => {
  let now = 0
  let failures = 0
  const player = { getDuration: () => 600, getCurrentTime: () => 0, seekTo: () => {},
    getVideoUrl: () => 'https://www.youtube.com/watch?v=' + record.source }
  const unavailable = () => { failures++ }
  createYouTubeResume(record, 'different-edit', unavailable).update({
    ...player, getVideoUrl: () => 'https://www.youtube.com/watch?v=different-edit',
    seekTo: () => assert.fail('Incompatible asset'),
  })
  createYouTubeResume(record, record.source, unavailable).update({
    ...player, getDuration: () => 1000, seekTo: () => assert.fail('Incompatible duration'),
  })
  const resume = createYouTubeResume(record, record.source, unavailable, () => now)
  resume.update(player)
  now = 8001
  resume.update(player)
  resume.update(player)
  assert.equal(resume.settled, true)
  assert.equal(failures, 3)
})

test('provider progress must belong to the approved title, never a subsequent video', () => {
  assert.ok(isActiveYouTubeAsset({ getVideoUrl: () => 'https://www.youtube.com/watch?v=YE7VzlLtp-4' }, 'YE7VzlLtp-4'))
  assert.equal(isActiveYouTubeAsset({ getVideoUrl: () => 'https://www.youtube.com/watch?v=different' }, 'YE7VzlLtp-4'), false)
  assert.equal(isActiveYouTubeAsset({ getVideoUrl: () => 'https://example.com/watch?v=YE7VzlLtp-4' }, 'YE7VzlLtp-4'), false)
})
