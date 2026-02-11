import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'
import { WriteProperty } from '../../src/lib/services'
import { ZERO_DATE } from '../../src/lib/asn1'
import {
	ApplicationTag,
	ObjectType,
	PropertyIdentifier,
} from '../../src/lib/enum'

test.describe('bacnet - Services layer WriteProperty unit', () => {
	test('should successfully encode and decode', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date(ZERO_DATE)
		const time = new Date(ZERO_DATE)
		time.setMilliseconds(990)
		WriteProperty.encode(buffer, 31, 12, 80, 0xffffffff, 0, [
			{ type: 0, value: null },
			{ type: 1, value: null },
			{ type: 1, value: true },
			{ type: 1, value: false },
			{ type: 2, value: 1 },
			{ type: 2, value: 1000 },
			{ type: 2, value: 1000000 },
			{ type: 2, value: 1000000000 },
			{ type: 3, value: -1 },
			{ type: 3, value: -1000 },
			{ type: 3, value: -1000000 },
			{ type: 3, value: -1000000000 },
			{ type: 4, value: 0 },
			{ type: 5, value: 100.121212 },
			{ type: 7, value: 'Test1234$' },
			{ type: 9, value: 4 },
			{ type: 10, value: date },
			{ type: 11, value: time },
			{ type: 12, value: { type: 3, instance: 0 } },
		])
		const result = WriteProperty.decode(buffer.buffer, 0, buffer.offset)
		delete result.len
		assert.deepStrictEqual(result, {
			objectId: {
				instance: 12,
				type: 31,
			},
			value: {
				priority: 16,
				property: {
					index: 4294967295,
					id: 80,
				},
				value: [
					{ type: 0, value: null },
					{ type: 0, value: null },
					{ type: 1, value: true },
					{ type: 1, value: false },
					{ type: 2, value: 1 },
					{ type: 2, value: 1000 },
					{ type: 2, value: 1000000 },
					{ type: 2, value: 1000000000 },
					{ type: 3, value: -1 },
					{ type: 3, value: -1000 },
					{ type: 3, value: -1000000 },
					{ type: 3, value: -1000000000 },
					{ type: 4, value: 0 },
					{ type: 5, value: 100.121212 },
					{ type: 7, value: 'Test1234$', encoding: 0 },
					{ type: 9, value: 4 },
					{ type: 10, value: date },
					{ type: 11, value: time },
					{ type: 12, value: { type: 3, instance: 0 } },
				],
			},
		})
	})

	test('should successfully encode and decode with defined priority', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date(ZERO_DATE)
		const time = new Date(ZERO_DATE)
		time.setMilliseconds(990)
		WriteProperty.encode(buffer, 31, 12, 80, 0xffffffff, 8, [
			{ type: 0, value: null },
			{ type: 1, value: null },
			{ type: 1, value: true },
			{ type: 1, value: false },
			{ type: 2, value: 1 },
			{ type: 2, value: 1000 },
			{ type: 2, value: 1000000 },
			{ type: 2, value: 1000000000 },
			{ type: 3, value: -1 },
			{ type: 3, value: -1000 },
			{ type: 3, value: -1000000 },
			{ type: 3, value: -1000000000 },
			{ type: 4, value: 0 },
			{ type: 5, value: 100.121212 },
			{ type: 7, value: 'Test1234$' },
			{ type: 9, value: 4 },
			{ type: 10, value: date },
			{ type: 11, value: time },
			{ type: 12, value: { type: 3, instance: 0 } },
		])
		const result = WriteProperty.decode(buffer.buffer, 0, buffer.offset)
		delete result.len
		assert.deepStrictEqual(result, {
			objectId: {
				instance: 12,
				type: 31,
			},
			value: {
				priority: 8,
				property: {
					index: 4294967295,
					id: 80,
				},
				value: [
					{ type: 0, value: null },
					{ type: 0, value: null },
					{ type: 1, value: true },
					{ type: 1, value: false },
					{ type: 2, value: 1 },
					{ type: 2, value: 1000 },
					{ type: 2, value: 1000000 },
					{ type: 2, value: 1000000000 },
					{ type: 3, value: -1 },
					{ type: 3, value: -1000 },
					{ type: 3, value: -1000000 },
					{ type: 3, value: -1000000000 },
					{ type: 4, value: 0 },
					{ type: 5, value: 100.121212 },
					{ type: 7, value: 'Test1234$', encoding: 0 },
					{ type: 9, value: 4 },
					{ type: 10, value: date },
					{ type: 11, value: time },
					{ type: 12, value: { type: 3, instance: 0 } },
				],
			},
		})
	})

	test('should successfully encode and decode with defined array index', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date(ZERO_DATE)
		const time = new Date(ZERO_DATE)
		time.setMilliseconds(990)
		WriteProperty.encode(buffer, 31, 12, 80, 2, 0, [
			{ type: 0, value: null },
			{ type: 0, value: null },
			{ type: 1, value: true },
			{ type: 1, value: false },
			{ type: 2, value: 1 },
			{ type: 2, value: 1000 },
			{ type: 2, value: 1000000 },
			{ type: 2, value: 1000000000 },
			{ type: 3, value: -1 },
			{ type: 3, value: -1000 },
			{ type: 3, value: -1000000 },
			{ type: 3, value: -1000000000 },
			{ type: 4, value: 0 },
			{ type: 5, value: 100.121212 },
			{ type: 7, value: 'Test1234$', encoding: 0 },
			{ type: 9, value: 4 },
			{ type: 10, value: date },
			{ type: 11, value: time },
			{ type: 12, value: { type: 3, instance: 0 } },
		])
		const result = WriteProperty.decode(buffer.buffer, 0, buffer.offset)
		delete result.len
		assert.deepStrictEqual(result, {
			objectId: {
				instance: 12,
				type: 31,
			},
			value: {
				priority: 16,
				property: {
					index: 2,
					id: 80,
				},
				value: [
					{ type: 0, value: null },
					{ type: 0, value: null },
					{ type: 1, value: true },
					{ type: 1, value: false },
					{ type: 2, value: 1 },
					{ type: 2, value: 1000 },
					{ type: 2, value: 1000000 },
					{ type: 2, value: 1000000000 },
					{ type: 3, value: -1 },
					{ type: 3, value: -1000 },
					{ type: 3, value: -1000000 },
					{ type: 3, value: -1000000000 },
					{ type: 4, value: 0 },
					{ type: 5, value: 100.121212 },
					{ type: 7, value: 'Test1234$', encoding: 0 },
					{ type: 9, value: 4 },
					{ type: 10, value: date },
					{ type: 11, value: time },
					{ type: 12, value: { type: 3, instance: 0 } },
				],
			},
		})
	})
})

test.describe('WriteProperty schedule/calendar compatibility', () => {
	test('should encode weekly schedule payload', () => {
		const buffer = utils.getBuffer()
		const daily = [
			[
				{
					time: {
						type: ApplicationTag.TIME,
						value: new Date(2024, 0, 1, 4, 30),
					},
					value: { type: ApplicationTag.UNSIGNED_INTEGER, value: 2 },
				},
			],
			[],
			[],
			[],
			[],
			[],
			[
				{
					time: {
						type: ApplicationTag.TIME,
						value: new Date(2024, 0, 1, 13, 15),
					},
					value: { type: ApplicationTag.UNSIGNED_INTEGER, value: 1 },
				},
			],
		]

		WriteProperty.encode(
			buffer,
			ObjectType.SCHEDULE,
			0,
			PropertyIdentifier.WEEKLY_SCHEDULE,
			0xffffffff,
			0,
			daily as any,
		)

		const result = WriteProperty.decode(buffer.buffer, 0, buffer.offset)
		assert.ok(result)
		assert.equal(
			result.value.property.id,
			PropertyIdentifier.WEEKLY_SCHEDULE,
		)
		assert.ok(
			buffer.buffer
				.slice(0, buffer.offset)
				.toString('hex')
				.includes('0e'),
		)
	})

	test('should reject weekly schedule payload with more than seven days', () => {
		const buffer = utils.getBuffer()
		const invalidWeekly = [[], [], [], [], [], [], [], []]

		assert.throws(() => {
			WriteProperty.encode(
				buffer,
				ObjectType.SCHEDULE,
				0,
				PropertyIdentifier.WEEKLY_SCHEDULE,
				0xffffffff,
				0,
				invalidWeekly as any,
			)
		}, /exactly 7 days/)
	})

	test('should reject weekly schedule payload with non-array day', () => {
		const buffer = utils.getBuffer()
		const invalidWeekly = [[], [], [], {}, [], [], []]

		assert.throws(() => {
			WriteProperty.encode(
				buffer,
				ObjectType.SCHEDULE,
				0,
				PropertyIdentifier.WEEKLY_SCHEDULE,
				0xffffffff,
				0,
				invalidWeekly as any,
			)
		}, /should be an array/)
	})

	test('should encode exception schedule payload', () => {
		const buffer = utils.getBuffer()
		const payload = [
			{
				date: {
					type: ApplicationTag.DATE,
					value: new Date(2024, 11, 4),
				},
				events: [
					{
						time: {
							type: ApplicationTag.TIME,
							value: new Date(2024, 11, 4, 0, 0),
						},
						value: { type: ApplicationTag.REAL, value: 3 },
					},
				],
				priority: { type: ApplicationTag.UNSIGNED_INTEGER, value: 16 },
			},
			{
				date: {
					type: ApplicationTag.WEEKNDAY,
					value: { month: 0xff, week: 2, wday: 1 },
				},
				events: [
					{
						time: {
							type: ApplicationTag.TIME,
							value: new Date(2024, 11, 4, 0, 20),
						},
						value: { type: ApplicationTag.ENUMERATED, value: 4 },
					},
				],
				priority: { type: ApplicationTag.UNSIGNED_INTEGER, value: 8 },
			},
		]

		WriteProperty.encode(
			buffer,
			ObjectType.SCHEDULE,
			0,
			PropertyIdentifier.EXCEPTION_SCHEDULE,
			0xffffffff,
			0,
			payload as any,
		)

		const result = WriteProperty.decode(buffer.buffer, 0, buffer.offset)
		assert.ok(result)
		assert.equal(
			result.value.property.id,
			PropertyIdentifier.EXCEPTION_SCHEDULE,
		)
		assert.ok(
			buffer.buffer
				.slice(0, buffer.offset)
				.toString('hex')
				.includes('2b'),
		)
	})

	test('should reject exception schedule payload with invalid weeknday values', () => {
		const buffer = utils.getBuffer()
		const payload = [
			{
				date: {
					type: ApplicationTag.WEEKNDAY,
					value: { month: 42, week: 2, wday: 2 },
				},
				events: [],
				priority: { type: ApplicationTag.UNSIGNED_INTEGER, value: 16 },
			},
		]

		assert.throws(() => {
			WriteProperty.encode(
				buffer,
				ObjectType.SCHEDULE,
				0,
				PropertyIdentifier.EXCEPTION_SCHEDULE,
				0xffffffff,
				0,
				payload as any,
			)
		}, /invalid raw date month/)
	})

	test('should reject exception schedule payload with invalid date range length', () => {
		const buffer = utils.getBuffer()
		const payload = [
			{
				date: {
					type: ApplicationTag.DATERANGE,
					value: [
						{
							type: ApplicationTag.DATE,
							value: new Date(2024, 11, 4),
						},
					],
				},
				events: [],
				priority: { type: ApplicationTag.UNSIGNED_INTEGER, value: 16 },
			},
		]

		assert.throws(() => {
			WriteProperty.encode(
				buffer,
				ObjectType.SCHEDULE,
				0,
				PropertyIdentifier.EXCEPTION_SCHEDULE,
				0xffffffff,
				0,
				payload as any,
			)
		}, /must have exactly 2 dates/)
	})

	test('should reject exception schedule payload with missing priority', () => {
		const buffer = utils.getBuffer()
		const payload = [
			{
				date: {
					type: ApplicationTag.DATE,
					value: new Date(2024, 11, 4),
				},
				events: [],
			},
		]

		assert.throws(() => {
			WriteProperty.encode(
				buffer,
				ObjectType.SCHEDULE,
				0,
				PropertyIdentifier.EXCEPTION_SCHEDULE,
				0xffffffff,
				0,
				payload as any,
			)
		}, /priority must be between 1 and 16/)
	})

	test('should reject exception schedule payload with out-of-range priority', () => {
		const buffer = utils.getBuffer()
		const payload = [
			{
				date: {
					type: ApplicationTag.DATE,
					value: new Date(2024, 11, 4),
				},
				events: [],
				priority: { type: ApplicationTag.UNSIGNED_INTEGER, value: 0 },
			},
		]

		assert.throws(() => {
			WriteProperty.encode(
				buffer,
				ObjectType.SCHEDULE,
				0,
				PropertyIdentifier.EXCEPTION_SCHEDULE,
				0xffffffff,
				0,
				payload as any,
			)
		}, /priority must be between 1 and 16/)
	})

	test('should encode schedule effective period payload', () => {
		const buffer = utils.getBuffer()
		const payload = [
			{ type: ApplicationTag.DATE, value: new Date(2024, 0, 1) },
			{ type: ApplicationTag.DATE, value: ZERO_DATE },
		]

		WriteProperty.encode(
			buffer,
			ObjectType.SCHEDULE,
			0,
			PropertyIdentifier.EFFECTIVE_PERIOD,
			0xffffffff,
			0,
			payload as any,
		)

		const hex = buffer.buffer.slice(0, buffer.offset).toString('hex')
		assert.ok(hex.includes('a4'))
		assert.ok(hex.includes('ffffffff'))
	})

	test('should encode calendar date list payload', () => {
		const buffer = utils.getBuffer()
		const payload = [
			{ type: ApplicationTag.DATE, value: new Date(2025, 7, 22) },
			{
				type: ApplicationTag.DATERANGE,
				value: [
					{ type: ApplicationTag.DATE, value: new Date(2026, 1, 19) },
					{ type: ApplicationTag.DATE, value: new Date(2026, 3, 17) },
				],
			},
			{
				type: ApplicationTag.WEEKNDAY,
				value: { month: 2, week: 2, wday: 2 },
			},
		]

		WriteProperty.encode(
			buffer,
			ObjectType.CALENDAR,
			0,
			PropertyIdentifier.DATE_LIST,
			0xffffffff,
			0,
			payload as any,
		)

		const result = WriteProperty.decode(buffer.buffer, 0, buffer.offset)
		assert.ok(result)
		assert.equal(result.value.property.id, PropertyIdentifier.DATE_LIST)
		assert.ok(
			buffer.buffer
				.slice(0, buffer.offset)
				.toString('hex')
				.includes('1e'),
		)
		assert.ok(
			buffer.buffer
				.slice(0, buffer.offset)
				.toString('hex')
				.includes('2b'),
		)
	})

	test('should reject calendar date list payload with unsupported entry', () => {
		const buffer = utils.getBuffer()
		const invalidDateList = [
			{ type: ApplicationTag.DATE, value: new Date(2025, 7, 22) },
			{ type: 255, value: 1 },
		]

		assert.throws(() => {
			WriteProperty.encode(
				buffer,
				ObjectType.CALENDAR,
				0,
				PropertyIdentifier.DATE_LIST,
				0xffffffff,
				0,
				invalidDateList as any,
			)
		}, /unsupported calendar date list entry format/)
	})

	test('should reject calendar date list payload with invalid weeknday value', () => {
		const buffer = utils.getBuffer()
		const invalidDateList = [
			{
				type: ApplicationTag.WEEKNDAY,
				value: { month: 2, week: 0, wday: 2 },
			},
		]

		assert.throws(() => {
			WriteProperty.encode(
				buffer,
				ObjectType.CALENDAR,
				0,
				PropertyIdentifier.DATE_LIST,
				0xffffffff,
				0,
				invalidDateList as any,
			)
		}, /invalid raw date week/)
	})

	test('should reject calendar date list payload with invalid raw date bytes', () => {
		const buffer = utils.getBuffer()
		const invalidDateList = [
			{
				type: ApplicationTag.DATE,
				value: { year: 2025, month: 8, day: 22, wday: 5 },
			},
		]

		assert.throws(() => {
			WriteProperty.encode(
				buffer,
				ObjectType.CALENDAR,
				0,
				PropertyIdentifier.DATE_LIST,
				0xffffffff,
				0,
				invalidDateList as any,
			)
		}, /invalid raw date year/)
	})
})
