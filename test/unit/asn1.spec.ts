import test from 'node:test'
import assert from 'node:assert'

import * as baAsn1 from '../../src/lib/asn1'
import { ApplicationTag } from '../../src/lib/enum'

test.describe('bacnet - ASN1 layer', () => {
	test.describe('decodeUnsigned', () => {
		test('should successfully decode 8-bit unsigned integer', () => {
			const result = baAsn1.decodeUnsigned(
				Buffer.from([0x00, 0xff, 0xff, 0xff, 0xff]),
				1,
				1,
			)
			assert.deepStrictEqual(result, { len: 1, value: 255 })
		})

		test('should successfully decode 16-bit unsigned integer', () => {
			const result = baAsn1.decodeUnsigned(
				Buffer.from([0x00, 0xff, 0xff, 0xff, 0xff]),
				1,
				2,
			)
			assert.deepStrictEqual(result, { len: 2, value: 65535 })
		})

		test('should successfully decode 24-bit unsigned integer', () => {
			const result = baAsn1.decodeUnsigned(
				Buffer.from([0x00, 0xff, 0xff, 0xff, 0xff]),
				1,
				3,
			)
			assert.deepStrictEqual(result, { len: 3, value: 16777215 })
		})

		test('should successfully decode 32-bit unsigned integer', () => {
			const result = baAsn1.decodeUnsigned(
				Buffer.from([0x00, 0xff, 0xff, 0xff, 0xff]),
				1,
				4,
			)
			assert.deepStrictEqual(result, { len: 4, value: 4294967295 })
		})

		test('should successfully decode length 0', () => {
			const result = baAsn1.decodeUnsigned(Buffer.from([]), 0, 0)
			assert.deepStrictEqual(result, { len: 0, value: 0 })
		})
	})

	test.describe('encodeBacnetObjectId', () => {
		test('should successfully encode with object-type > 512', () => {
			const buffer = { buffer: Buffer.alloc(4), offset: 0 }
			baAsn1.encodeBacnetObjectId(buffer, 600, 600)
			assert.deepStrictEqual(buffer, {
				buffer: Buffer.from([150, 0, 2, 88]),
				offset: 4,
			})
		})
	})

	test.describe('encodeOpeningTag', () => {
		test('should successfully encode with opening-tag > 14 = 15', () => {
			const buffer = { buffer: Buffer.alloc(15, 10), offset: 0 }
			baAsn1.encodeOpeningTag(buffer, 15)
			assert.deepStrictEqual(buffer, {
				buffer: Buffer.from([
					254, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
				]),
				offset: 2,
			})
		})

		test('should successfully encode with opening-tag > 253 = 255', () => {
			const buffer = { buffer: Buffer.alloc(255, 12), offset: 0 }
			const testBuffer = Buffer.alloc(255, 12)
			const testBufferChange = Buffer.from([142, 12, 12, 12])
			testBuffer.fill(testBufferChange, 0, 4)
			const bufferToCompare = { buffer: testBuffer, offset: 1 }
			baAsn1.encodeOpeningTag(buffer, 8)
			assert.deepStrictEqual(buffer, bufferToCompare)
		})
	})

	test.describe('encodeClosingTag', () => {
		test('should successfully encode with closing-tag > 14 = 15', () => {
			const buffer = { buffer: Buffer.alloc(15, 10), offset: 0 }
			baAsn1.encodeClosingTag(buffer, 15)
			assert.deepStrictEqual(buffer, {
				buffer: Buffer.from([
					255, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
				]),
				offset: 2,
			})
		})

		test('should successfully encode with closing-tag > 253 = 255', () => {
			const buffer = { buffer: Buffer.alloc(255, 12), offset: 0 }
			const testBuffer = Buffer.alloc(255, 12)
			const testBufferChange = Buffer.from([143, 12, 12, 12])
			testBuffer.fill(testBufferChange, 0, 4)
			const bufferToCompare = { buffer: testBuffer, offset: 1 }
			baAsn1.encodeClosingTag(buffer, 8)
			assert.deepStrictEqual(buffer, bufferToCompare)
		})
	})

	test.describe('encodeBacnetDate', () => {
		test('should successfully encode with Date 1-1-1', () => {
			const buffer = { buffer: Buffer.alloc(15, 10), offset: 0 }
			const testBuffer = Buffer.alloc(15, 10)
			const testBufferChange = Buffer.from([1, 1, 1, 2])
			testBuffer.fill(testBufferChange, 0, 4)
			const bufferToCompare = { buffer: testBuffer, offset: 4 }
			baAsn1.encodeBacnetDate(buffer, new Date(1, 0, 1))
			assert.deepStrictEqual(buffer, bufferToCompare)
		})

		test('should throw error with Date 257-1-1', () => {
			const buffer = { buffer: Buffer.alloc(15, 10), offset: 0 }
			const bufferToCompare = { buffer: Buffer.alloc(15, 10), offset: 0 }

			assert.throws(
				() => baAsn1.encodeBacnetDate(buffer, new Date(257, 1, 1)),
				/invalid year: 257/,
			)

			assert.deepStrictEqual(buffer, bufferToCompare)
		})

		test('should successfully encode with Date 2020-6-1', () => {
			const buffer = { buffer: Buffer.alloc(15, 0), offset: 0 }
			const testBuffer = Buffer.alloc(15, 0)
			const testBufferChange = Buffer.from([120, 6, 1, 1])
			testBuffer.fill(testBufferChange, 0, 4)
			const bufferToCompare = { buffer: testBuffer, offset: 4 }
			baAsn1.encodeBacnetDate(buffer, new Date(2020, 5, 1))
			assert.deepStrictEqual(buffer, bufferToCompare)
		})
	})

	test.describe('decodeDate', () => {
		test('should decode full wildcard date to ZERO_DATE and preserve raw', () => {
			const result = baAsn1.decodeDate(
				Buffer.from([0xff, 0xff, 0xff, 0xff]),
				0,
			)
			assert.equal(result.len, 4)
			assert.equal(result.value.getTime(), baAsn1.ZERO_DATE.getTime())
			assert.deepStrictEqual(result.raw, {
				year: 0xff,
				month: 0xff,
				day: 0xff,
				wday: 0xff,
			})
		})

		test('should decode partial wildcard date to ZERO_DATE and preserve raw', () => {
			const result = baAsn1.decodeDate(
				Buffer.from([0xff, 0xff, 17, 0xff]),
				0,
			)
			assert.equal(result.len, 4)
			assert.equal(result.value.getTime(), baAsn1.ZERO_DATE.getTime())
			assert.deepStrictEqual(result.raw, {
				year: 0xff,
				month: 0xff,
				day: 17,
				wday: 0xff,
			})
		})

		test('should decode invalid concrete date to ZERO_DATE and preserve raw', () => {
			const result = baAsn1.decodeDate(Buffer.from([124, 0, 32, 2]), 0)
			assert.equal(result.len, 4)
			assert.equal(result.value.getTime(), baAsn1.ZERO_DATE.getTime())
			assert.deepStrictEqual(result.raw, {
				year: 124,
				month: 0,
				day: 32,
				wday: 2,
			})
		})

		test('should decode non-normalized concrete date to ZERO_DATE', () => {
			const result = baAsn1.decodeDate(Buffer.from([124, 2, 31, 5]), 0)
			assert.equal(result.len, 4)
			assert.equal(result.value.getTime(), baAsn1.ZERO_DATE.getTime())
			assert.deepStrictEqual(result.raw, {
				year: 124,
				month: 2,
				day: 31,
				wday: 5,
			})
		})

		test('should decode valid concrete date and preserve raw', () => {
			const result = baAsn1.decodeDate(Buffer.from([124, 12, 31, 2]), 0)
			assert.equal(result.len, 4)
			assert.equal(result.value.getFullYear(), 2024)
			assert.equal(result.value.getMonth(), 11)
			assert.equal(result.value.getDate(), 31)
			assert.deepStrictEqual(result.raw, {
				year: 124,
				month: 12,
				day: 31,
				wday: 2,
			})
		})
	})

	test.describe('decodeWeekNDay', () => {
		test('should decode valid WEEKNDAY payload', () => {
			const buffer = { buffer: Buffer.alloc(8), offset: 0 }
			baAsn1.encodeTag(buffer, 101, false, 3)
			buffer.buffer[buffer.offset++] = 2
			buffer.buffer[buffer.offset++] = 3
			buffer.buffer[buffer.offset++] = 4

			const result = baAsn1.bacappDecodeApplicationData(
				buffer.buffer,
				0,
				buffer.offset,
				0,
				0,
			)
			assert.ok(result)
			assert.strictEqual(result.type, 101)
			assert.deepStrictEqual(result.value, {
				month: 2,
				week: 3,
				wday: 4,
			})
		})

		test('should safely handle malformed WEEKNDAY payload length', () => {
			const buffer = { buffer: Buffer.alloc(8), offset: 0 }
			baAsn1.encodeTag(buffer, 101, false, 2)
			buffer.buffer[buffer.offset++] = 2
			buffer.buffer[buffer.offset++] = 3

			const result = baAsn1.bacappDecodeApplicationData(
				buffer.buffer,
				0,
				buffer.offset,
				0,
				0,
			)
			assert.ok(result)
			assert.strictEqual(result.type, 101)
			assert.strictEqual(result.len, 4)
			assert.deepStrictEqual(result.value, {
				month: 0xff,
				week: 0xff,
				wday: 0xff,
			})
		})
	})

	test.describe('encode DATE/TIME compatibility', () => {
		test('should encode DATE from unix timestamp in generic encoder', () => {
			const buffer = { buffer: Buffer.alloc(16), offset: 0 }
			const timestamp = new Date(2025, 0, 2).getTime()

			baAsn1.bacappEncodeApplicationData(buffer, {
				type: ApplicationTag.DATE,
				value: timestamp,
			} as any)

			const decoded = baAsn1.bacappDecodeApplicationData(
				buffer.buffer,
				0,
				buffer.offset,
				0,
				0,
			)

			assert.ok(decoded)
			assert.equal(decoded.type, ApplicationTag.DATE)
			assert.equal(decoded.value.getFullYear(), 2025)
			assert.equal(decoded.value.getMonth(), 0)
			assert.equal(decoded.value.getDate(), 2)
		})

		test('should encode DATE from raw BACnet bytes in generic encoder', () => {
			const buffer = { buffer: Buffer.alloc(16), offset: 0 }

			baAsn1.bacappEncodeApplicationData(buffer, {
				type: ApplicationTag.DATE,
				value: { year: 0xff, month: 14, day: 0xff, wday: 0xff },
			} as any)

			assert.deepStrictEqual(
				buffer.buffer.slice(0, buffer.offset),
				Buffer.from([0xa4, 0xff, 0x0e, 0xff, 0xff]),
			)
		})

		test('should encode DATE from raw BACnet day marker bytes in generic encoder', () => {
			for (const day of [32, 33, 34]) {
				const buffer = { buffer: Buffer.alloc(16), offset: 0 }
				baAsn1.bacappEncodeApplicationData(buffer, {
					type: ApplicationTag.DATE,
					value: { year: 0xff, month: 0xff, day, wday: 0xff },
				} as any)
				assert.deepStrictEqual(
					buffer.buffer.slice(0, buffer.offset),
					Buffer.from([0xa4, 0xff, 0xff, day, 0xff]),
				)
			}
		})

		test('should reject invalid raw DATE bytes in generic encoder', () => {
			const buffer = { buffer: Buffer.alloc(16), offset: 0 }

			assert.throws(
				() =>
					baAsn1.bacappEncodeApplicationData(buffer, {
						type: ApplicationTag.DATE,
						value: { year: 0xff, month: 42, day: 0xff, wday: 0xff },
					} as any),
				/invalid raw date month/,
			)
		})

		test('should encode TIME from unix timestamp in generic encoder', () => {
			const buffer = { buffer: Buffer.alloc(16), offset: 0 }
			const timestamp = new Date(2025, 0, 2, 14, 30, 5, 120).getTime()

			baAsn1.bacappEncodeApplicationData(buffer, {
				type: ApplicationTag.TIME,
				value: timestamp,
			} as any)

			const decoded = baAsn1.bacappDecodeApplicationData(
				buffer.buffer,
				0,
				buffer.offset,
				0,
				0,
			)

			assert.ok(decoded)
			assert.equal(decoded.type, ApplicationTag.TIME)
			assert.equal(decoded.value.getHours(), 14)
			assert.equal(decoded.value.getMinutes(), 30)
			assert.equal(decoded.value.getSeconds(), 5)
		})

		test('should reject invalid TIME timestamp in generic encoder', () => {
			const buffer = { buffer: Buffer.alloc(16), offset: 0 }

			assert.throws(
				() =>
					baAsn1.bacappEncodeApplicationData(buffer, {
						type: ApplicationTag.TIME,
						value: Number.POSITIVE_INFINITY,
					} as any),
				/invalid timestamp/,
			)
		})
	})
})
