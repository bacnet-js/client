import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'
import * as baBvlc from '../../src/lib/bvlc'

test.describe('bacnet - BVLC layer', () => {
	test('should successfuly encode and decode a package', () => {
		const buffer = utils.getBuffer()
		baBvlc.encode(buffer.buffer, 10, 1482)
		const result = baBvlc.decode(buffer.buffer, 0)
		assert.deepStrictEqual(result, {
			len: 4,
			func: 10,
			msgLength: 1482,
			originatingIP: null,
		})
	})

	test('should successfuly encode and decode a forwarded package', () => {
		const buffer = utils.getBuffer()
		baBvlc.encode(buffer.buffer, 4, 1482, '1.2.255.0')
		const result = baBvlc.decode(buffer.buffer, 0)
		assert.deepStrictEqual(result, {
			len: 10,
			func: 4,
			msgLength: 1482,
			originatingIP: '1.2.255.0', // omit port if default
		})
	})

	test('should successfuly encode and decode a forwarded package on a different port', () => {
		const buffer = utils.getBuffer()
		baBvlc.encode(buffer.buffer, 4, 1482, '1.2.255.0:47810')
		const result = baBvlc.decode(buffer.buffer, 0)
		assert.deepStrictEqual(result, {
			len: 10,
			func: 4,
			msgLength: 1482,
			originatingIP: '1.2.255.0:47810', // include port if non-default
		})
	})

	test('should fail forwarding a non FORWARDED_NPU', () => {
		const buffer = utils.getBuffer()
		assert.throws(() => {
			baBvlc.encode(buffer.buffer, 3, 1482, '1.2.255.0')
		}, /Cannot specify originatingIP unless/)
	})

	test('should fail if invalid BVLC type', () => {
		const buffer = utils.getBuffer()
		baBvlc.encode(buffer.buffer, 10, 1482)
		buffer.buffer[0] = 8
		const result = baBvlc.decode(buffer.buffer, 0)
		assert.strictEqual(result, undefined)
	})

	test('should fail if invalid length', () => {
		const buffer = utils.getBuffer()
		baBvlc.encode(buffer.buffer, 10, 1481)
		buffer.buffer[0] = 8
		const result = baBvlc.decode(buffer.buffer, 0)
		assert.strictEqual(result, undefined)
	})

	test('should fail if invalid function', () => {
		const buffer = utils.getBuffer()
		baBvlc.encode(buffer.buffer, 100, 1482)
		const result = baBvlc.decode(buffer.buffer, 0)
		assert.strictEqual(result, undefined)
	})

	test('should fail when UDP payload contains trailing bytes', () => {
		const packet = Buffer.alloc(6)
		packet[0] = 0x81
		packet[1] = 0x0a
		packet[2] = 0x00
		packet[3] = 0x04
		packet[4] = 0xaa
		packet[5] = 0xbb
		const result = baBvlc.decode(packet, 0)
		assert.strictEqual(result, undefined)
	})

	test('should fail if unsuported function', () => {
		const buffer = utils.getBuffer()
		baBvlc.encode(buffer.buffer, 99, 1482)
		const result = baBvlc.decode(buffer.buffer, 0)
		assert.strictEqual(result, undefined)
	})
})
