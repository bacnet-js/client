import test from 'node:test'
import assert from 'node:assert'

import { RegisterForeignDevice } from '../../src/lib/services'

test.describe('bacnet - register foreign device integration', () => {
	test('should encode ttl as 2-byte unsigned integer', () => {
		const buffer = { buffer: Buffer.alloc(16), offset: 0 }
		RegisterForeignDevice.encode(buffer, 60)
		assert.strictEqual(buffer.offset, 2)
		assert.strictEqual(buffer.buffer[0], 0x00)
		assert.strictEqual(buffer.buffer[1], 0x3c)
	})

	test('should decode ttl from payload', () => {
		const buffer = Buffer.from([0x00, 0x3c])
		const decoded = RegisterForeignDevice.decode(buffer, 0)
		assert.strictEqual(decoded.len, 2)
		assert.strictEqual(decoded.ttl, 60)
	})
})
