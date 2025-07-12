import { test, mock, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'

import { RequestManager } from '../../src/lib/request-manager'
import { NetworkOpResult } from '../../src'
import { setTimeout } from 'node:timers'

test.describe('RequestManager', () => {
	const wait = (millis: number): Promise<void> => {
		return new Promise((resolve) => {
			setTimeout(resolve, millis)
		})
	}

	let manager: RequestManager

	const result: NetworkOpResult = {
		msg: null,
		buffer: Buffer.alloc(0),
		offset: 0,
		length: 0,
	}

	const error = new Error('some error')

	const delay = 100

	const mockSetTimeout = mock.fn(setTimeout)

	beforeEach(() => {
		mockSetTimeout.mock.resetCalls()
		manager = new RequestManager(delay, mockSetTimeout)
	})

	afterEach(() => {
		manager.clear(true)
	})

	test('add() should return a promise that resolves if resolve() is called before the timeout with no error', async () => {
		queueMicrotask(() => {
			manager.resolve(42, undefined, result)
		})
		assert.strictEqual(await manager.add(42), result)
	})

	test('add() should return a promise that rejects if resolve() is called before the timeout with an error', async () => {
		queueMicrotask(() => {
			manager.resolve(42, error)
		})
		try {
			await manager.add(42)
		} catch (err) {
			assert.strictEqual(err, error)
		}
	})

	test('add() should return a promise that rejects if resolve() is never called', async () => {
		try {
			await manager.add(42)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
		}
	})

	test('add() should return a promise that rejects if resolve() is called after the timeout without errors', async () => {
		wait(delay * 1.1).then(() => {
			manager.resolve(42, undefined, result)
		})
		try {
			await manager.add(42)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
		}
	})

	test('add() should return a promise that cannot be resolved twice', async () => {
		manager.add(42)
		assert.strictEqual(manager.resolve(42, undefined, result), true)
		assert.strictEqual(manager.resolve(42, undefined, result), false)
	})

	test('add() should return a promise that cannot be resolved after the request has timed out', async () => {
		manager.add(42)
		await wait(delay * 1.1)
		assert.strictEqual(manager.resolve(42, undefined, result), false)
	})

	test('one invocation of add() should result in one invocation of setTimeout()', async () => {
		manager.add(42).catch(() => {}) // ignore timeouts
		assert.strictEqual(mockSetTimeout.mock.callCount(), 1)
		await wait(delay * 1.1)
		assert.strictEqual(mockSetTimeout.mock.callCount(), 1)
	})

	test('multiple invocations of add() within the same tick of the event loop should result in one invocation of setTimeout()', async () => {
		manager.add(42).catch(() => {}) // ignore timeouts
		manager.add(43).catch(() => {}) // ignore timeouts
		assert.strictEqual(mockSetTimeout.mock.callCount(), 1)
		await wait(delay * 1.1)
		assert.strictEqual(mockSetTimeout.mock.callCount(), 1)
	})

	test('multiple invocations of add() within the timeout delay spread across multiple ticks of the event loop should result in only one invocation of setTimeout()', async (t) => {
		manager.add(42).catch(() => {}) // ignore timeouts
		assert.strictEqual(mockSetTimeout.mock.callCount(), 1)
		await wait(delay / 4)
		manager.add(43).catch(() => {}) // ignore timeouts
		assert.strictEqual(mockSetTimeout.mock.callCount(), 1)
	})

	test('multiple invocations of add() separated by more than the timeout delay should result in multiple invocations of setTimeout()', async (t) => {
		manager.add(42).catch(() => {}) // ignore timeouts
		assert.strictEqual(mockSetTimeout.mock.callCount(), 1)
		await wait(delay * 1.1)
		manager.add(43).catch(() => {}) // ignore timeouts
		assert.strictEqual(mockSetTimeout.mock.callCount(), 2)
		await wait(delay * 1.1)
		manager.add(44).catch(() => {}) // ignore timeouts
		assert.strictEqual(mockSetTimeout.mock.callCount(), 3)
	})
})
