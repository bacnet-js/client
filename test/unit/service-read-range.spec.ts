import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'
import * as baAsn1 from '../../src/lib/asn1'
import { ReadRange } from '../../src/lib/services'
import { ApplicationTag, ObjectType, ReadRangeType } from '../../src'

test.describe('bacnet - Services layer ReadRange unit', () => {
	test('should successfully encode and decode by position', (t) => {
		const buffer = utils.getBuffer()
		ReadRange.encode(
			buffer,
			{ type: ObjectType.DEVICE, instance: 35 },
			85,
			0xffffffff,
			ReadRangeType.BY_POSITION,
			10,
			null,
			0,
		)
		const result = ReadRange.decode(buffer.buffer, 0, buffer.offset)
		delete result.len
		assert.deepStrictEqual(result, {
			count: 0,
			objectId: { type: ObjectType.DEVICE, instance: 35 },
			position: 10,
			property: {
				index: 0xffffffff,
				id: 85,
			},
			requestType: ReadRangeType.BY_POSITION,
			time: undefined,
		})
	})

	test('should successfully encode and decode by position with array index', (t) => {
		const buffer = utils.getBuffer()
		ReadRange.encode(
			buffer,
			{ type: ObjectType.DEVICE, instance: 35 },
			12,
			2,
			ReadRangeType.BY_SEQUENCE_NUMBER,
			10,
			null,
			0,
		)
		const result = ReadRange.decode(buffer.buffer, 0, buffer.offset)
		delete result.len
		assert.deepStrictEqual(result, {
			count: 0,
			objectId: { type: ObjectType.DEVICE, instance: 35 },
			position: 10,
			property: {
				index: 2,
				id: 12,
			},
			requestType: ReadRangeType.BY_SEQUENCE_NUMBER,
			time: undefined,
		})
	})

	test('should successfully encode and decode by sequence', (t) => {
		const buffer = utils.getBuffer()
		ReadRange.encode(
			buffer,
			{ type: ObjectType.DEVICE, instance: 35 },
			85,
			0xffffffff,
			ReadRangeType.BY_SEQUENCE_NUMBER,
			11,
			null,
			1111,
		)
		const result = ReadRange.decode(buffer.buffer, 0, buffer.offset)
		delete result.len
		assert.deepStrictEqual(result, {
			count: 1111,
			objectId: { type: ObjectType.DEVICE, instance: 35 },
			position: 11,
			property: {
				index: 0xffffffff,
				id: 85,
			},
			requestType: ReadRangeType.BY_SEQUENCE_NUMBER,
			time: undefined,
		})
	})

	test('should successfully encode and decode by time', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date(1, 1, 1)
		date.setMilliseconds(990)
		ReadRange.encode(
			buffer,
			{ type: ObjectType.DEVICE, instance: 35 },
			85,
			0xffffffff,
			ReadRangeType.BY_TIME_REFERENCE_TIME_COUNT,
			null,
			date,
			-1111,
		)
		const result = ReadRange.decode(buffer.buffer, 0, buffer.offset)
		delete result.len
		assert.deepStrictEqual(result, {
			count: -1111,
			objectId: { type: ObjectType.DEVICE, instance: 35 },
			position: undefined,
			property: {
				index: 0xffffffff,
				id: 85,
			},
			requestType: ReadRangeType.BY_TIME_REFERENCE_TIME_COUNT,
			time: date,
		})
	})
})

test.describe('ReadRangeAcknowledge', () => {
	test('should successfully encode and decode', (t) => {
		const buffer = utils.getBuffer()
		ReadRange.encodeAcknowledge(
			buffer,
			{ type: 12, instance: 500 },
			5048,
			0xffffffff,
			{ bitsUsed: 24, value: [1, 2, 3] },
			12,
			Buffer.from([1, 2, 3]),
			2,
			2,
		)
		const result = ReadRange.decodeAcknowledge(
			buffer.buffer,
			0,
			buffer.offset,
		)
		delete result.len
		assert.deepStrictEqual(result, {
			objectId: { type: 12, instance: 500 },
			itemCount: 12,
			property: { id: 5048, index: 0xffffffff },
			resultFlag: { bitsUsed: 24, value: [1, 2, 3] },
			rangeBuffer: Buffer.from([1, 2, 3]),
		})
	})

	test('should decode trend range values from range buffer', () => {
		const applicationData = utils.getBuffer()
		baAsn1.encodeOpeningTag(applicationData, 0)
		baAsn1.bacappEncodeApplicationData(applicationData, {
			type: ApplicationTag.DATE,
			value: new Date(2024, 1, 3),
		})
		baAsn1.bacappEncodeApplicationData(applicationData, {
			type: ApplicationTag.TIME,
			value: new Date(2024, 1, 3, 12, 15, 30, 0),
		})
		baAsn1.encodeClosingTag(applicationData, 0)
		baAsn1.encodeOpeningTag(applicationData, 1)
		baAsn1.encodeTag(applicationData, 2, true, 4)
		applicationData.buffer.writeFloatBE(42.5, applicationData.offset)
		applicationData.offset += 4
		baAsn1.encodeClosingTag(applicationData, 1)
		baAsn1.encodeContextBitstring(applicationData, 2, {
			bitsUsed: 4,
			value: [0b0000],
		})

		const buffer = utils.getBuffer()
		ReadRange.encodeAcknowledge(
			buffer,
			{ type: 20, instance: 0 },
			131,
			0xffffffff,
			{ bitsUsed: 3, value: [0] },
			1,
			applicationData.buffer.slice(0, applicationData.offset),
			ReadRangeType.BY_POSITION,
			0,
		)

		const result = ReadRange.decodeAcknowledge(
			buffer.buffer,
			0,
			buffer.offset,
		)
		assert.ok(result)
		assert.ok(result.values)
		assert.equal(result.values?.length, 1)
		assert.equal(result.values?.[0].value, 42.5)
		assert.equal(
			result.values?.[0].timestamp,
			new Date(2024, 1, 3, 12, 15, 30, 0).getTime(),
		)
	})

	test('should slice fallback rangeBuffer correctly with non-zero offset', () => {
		const ackBuffer = utils.getBuffer()
		ReadRange.encodeAcknowledge(
			ackBuffer,
			{ type: 20, instance: 0 },
			131,
			0xffffffff,
			{ bitsUsed: 3, value: [0] },
			1,
			Buffer.from([1, 2, 3]),
			ReadRangeType.BY_POSITION,
			0,
		)

		const combined = Buffer.concat([
			Buffer.from([0xaa, 0xbb]),
			ackBuffer.buffer.slice(0, ackBuffer.offset),
		])
		const result = ReadRange.decodeAcknowledge(
			combined,
			2,
			ackBuffer.offset,
		)
		assert.ok(result)
		assert.deepStrictEqual(result.rangeBuffer, Buffer.from([1]))
		assert.equal(result.values, undefined)
	})
})
