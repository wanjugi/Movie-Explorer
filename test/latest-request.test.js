import assert from 'node:assert/strict'
import { test } from 'node:test'
import { effectScope } from 'vue'
import { useLatestRequest } from '../src/composables/useLatestRequest.js'
import { MovieApiError } from '../src/services/moviesApi.js'

function deferred() {
  let resolve, reject
  const promise = new Promise((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

function setup(t) {
  const scope = effectScope()
  t.after(() => scope.stop())
  return { ...scope.run(useLatestRequest), stop: () => scope.stop() }
}

test('request lifecycle distinguishes idle, pending, populated, empty and failed results', async t => {
  const request = setup(t)
  assert.equal(request.state.value.status, 'idle')
  const pending = request.run(async () => [1])
  assert.equal(request.state.value.status, 'loading')
  await pending
  assert.deepEqual(request.state.value, { status: 'success', data: [1], error: null })
  await request.run(async () => [])
  assert.deepEqual(request.state.value, { status: 'empty', data: [], error: null })
  const failure = new MovieApiError('network')
  await request.run(async () => { throw failure })
  assert.deepEqual(request.state.value, { status: 'error', data: null, error: failure })
})

test('obsolete responses, including a fetch that ignores abort, cannot finish the newer load', async t => {
  const request = setup(t)
  const older = deferred()
  const newer = deferred()
  let olderSignal
  const first = request.run(signal => {
    olderSignal = signal
    return older.promise
  })
  const second = request.run(() => newer.promise)
  assert.equal(olderSignal.aborted, true)
  older.resolve(['old'])
  await first
  assert.equal(request.state.value.status, 'loading')
  newer.resolve(['new'])
  await second
  assert.deepEqual(request.state.value.data, ['new'])

  const late = deferred()
  const third = request.run(() => late.promise)
  await request.run(async () => ['latest'])
  late.reject(new Error('obsolete failure'))
  await third
  assert.deepEqual(request.state.value.data, ['latest'])
  assert.equal(request.state.value.error, null)
})

test('cancellation and scope disposal abort current loads without displaying errors', async t => {
  const request = setup(t)
  const signals = []
  const abortable = signal => new Promise((resolve, reject) => {
    signals.push(signal)
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
  const first = request.run(abortable)
  request.cancel()
  await first
  assert.equal(signals[0].aborted, true)
  assert.equal(request.state.value.status, 'idle')
  const second = request.run(abortable)
  request.stop()
  await second
  assert.equal(signals[1].aborted, true)
  assert.equal(request.state.value.error, null)
})

test('retry respects Retry-After, uses the last operation, and refuses duplicates while loading', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 10_000 })
  const request = setup(t)
  const retried = deferred()
  let calls = 0
  await request.run(() => {
    calls++
    if (calls === 1) return Promise.reject(new MovieApiError('rate-limit', 429, 12_000))
    return retried.promise
  })
  assert.equal(request.retryBlocked.value, true)
  assert.equal(request.retry(), undefined)
  t.mock.timers.tick(1999)
  assert.equal(request.retry(), undefined)
  t.mock.timers.tick(1)
  assert.equal(request.retryBlocked.value, false)
  const pending = request.retry()
  assert.equal(request.state.value.status, 'loading')
  assert.equal(request.retry(), undefined)
  assert.equal(calls, 2)
  retried.resolve([1])
  await pending
  assert.equal(request.state.value.status, 'success')
  await request.run(async () => { throw new MovieApiError('invalid', 400) })
  assert.equal(request.retry(), undefined)
})
