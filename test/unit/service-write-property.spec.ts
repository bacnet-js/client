import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'
import { WriteProperty } from '../../src/lib/services'
import * as baAsn1 from '../../src/lib/asn1'
const { ZERO_DATE } = baAsn1
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

		let payloadOffset = -1
		for (let i = 0; i < buffer.offset; i++) {
			if (baAsn1.decodeIsOpeningTagNumber(buffer.buffer, i, 3)) {
				payloadOffset = i + 1
				break
			}
		}
		assert.notEqual(payloadOffset, -1)

		const weekly = baAsn1.decodeWeeklySchedule(
			buffer.buffer,
			payloadOffset,
			buffer.offset - payloadOffset,
		)
		assert.ok(weekly)
		assert.equal(weekly.value.length, 7)

		const monday = weekly.value[0]
		const sunday = weekly.value[6]
		assert.equal(monday.length, 1)
		assert.equal(sunday.length, 1)

		assert.equal(monday[0].time?.type, ApplicationTag.TIME)
		assert.equal(monday[0].time?.value.getHours(), 4)
		assert.equal(monday[0].time?.value.getMinutes(), 30)
		assert.equal(monday[0].value?.type, ApplicationTag.UNSIGNED_INTEGER)
		assert.equal(monday[0].value?.value, 2)

		assert.equal(sunday[0].time?.type, ApplicationTag.TIME)
		assert.equal(sunday[0].time?.value.getHours(), 13)
		assert.equal(sunday[0].time?.value.getMinutes(), 15)
		assert.equal(sunday[0].value?.type, ApplicationTag.UNSIGNED_INTEGER)
		assert.equal(sunday[0].value?.value, 1)
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

	test('should reject weekly schedule payload when payload is not an array', () => {
		const buffer = utils.getBuffer()

		assert.throws(() => {
			WriteProperty.encode(
				buffer,
				ObjectType.SCHEDULE,
				0,
				PropertyIdentifier.WEEKLY_SCHEDULE,
				0xffffffff,
				0,
				null as any,
			)
		}, /weekly schedule should be an array/)
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

		let payloadOffset = -1
		for (let i = 0; i < buffer.offset; i++) {
			if (baAsn1.decodeIsOpeningTagNumber(buffer.buffer, i, 3)) {
				payloadOffset = i + 1
				break
			}
		}
		assert.notEqual(payloadOffset, -1)

		const exceptionSchedule = baAsn1.decodeExceptionSchedule(
			buffer.buffer,
			payloadOffset,
			buffer.offset - payloadOffset,
		)
		assert.ok(exceptionSchedule)
		assert.equal(exceptionSchedule.value.length, 2)

		const first = exceptionSchedule.value[0]
		const second = exceptionSchedule.value[1]

		assert.equal(first.date?.type, ApplicationTag.DATE)
		assert.equal(first.events.length, 1)
		assert.equal(first.events[0].time?.type, ApplicationTag.TIME)
		assert.equal(first.events[0].value?.type, ApplicationTag.REAL)
		assert.equal(first.events[0].value?.value, 3)
		assert.equal(first.priority?.value, 16)

		assert.equal(second.date?.type, ApplicationTag.WEEKNDAY)
		assert.deepStrictEqual(second.date?.value, {
			month: 0xff,
			week: 2,
			wday: 1,
		})
		assert.equal(second.events.length, 1)
		assert.equal(second.events[0].time?.type, ApplicationTag.TIME)
		assert.equal(second.events[0].value?.type, ApplicationTag.ENUMERATED)
		assert.equal(second.events[0].value?.value, 4)
		assert.equal(second.priority?.value, 8)
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

	test('should allow exception schedule date with raw even-month marker', () => {
		const buffer = utils.getBuffer()
		const payload = [
			{
				date: {
					type: ApplicationTag.DATE,
					value: { year: 0xff, month: 14, day: 0xff, wday: 0xff },
				},
				events: [
					{
						time: {
							type: ApplicationTag.TIME,
							value: new Date(2025, 0, 1, 0, 0),
						},
						value: { type: ApplicationTag.NULL, value: null },
					},
				],
				priority: { type: ApplicationTag.UNSIGNED_INTEGER, value: 16 },
			},
		]

		assert.doesNotThrow(() => {
			WriteProperty.encode(
				buffer,
				ObjectType.SCHEDULE,
				0,
				PropertyIdentifier.EXCEPTION_SCHEDULE,
				0xffffffff,
				0,
				payload as any,
			)
		})
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

	test('should encode literal 1900-01-01 as a concrete date (not wildcard)', () => {
		const buffer = utils.getBuffer()
		const payload = [
			{ type: ApplicationTag.DATE, value: new Date(1900, 0, 1) },
			{ type: ApplicationTag.DATE, value: new Date(1900, 0, 2) },
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

		let payloadOffset = -1
		for (let i = 0; i < buffer.offset; i++) {
			if (baAsn1.decodeIsOpeningTagNumber(buffer.buffer, i, 3)) {
				payloadOffset = i + 1
				break
			}
		}
		assert.notEqual(payloadOffset, -1)

		const decoded = baAsn1.decodeScheduleEffectivePeriod(
			buffer.buffer,
			payloadOffset,
			buffer.offset - payloadOffset,
		)
		assert.ok(decoded)
		assert.equal(decoded.value.length, 2)
		assert.equal(decoded.value[0].type, ApplicationTag.DATE)
		assert.equal(decoded.value[1].type, ApplicationTag.DATE)

		// Concrete 1900-01-01 must not be treated as wildcard ZERO_DATE sentinel.
		assert.notStrictEqual(decoded.value[0].value, ZERO_DATE)
		assert.equal((decoded.value[0].value as Date).getFullYear(), 1900)
		assert.equal((decoded.value[0].value as Date).getMonth(), 0)
		assert.equal((decoded.value[0].value as Date).getDate(), 1)
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

		let payloadOffset = -1
		for (let i = 0; i < buffer.offset; i++) {
			if (baAsn1.decodeIsOpeningTagNumber(buffer.buffer, i, 3)) {
				payloadOffset = i + 1
				break
			}
		}
		assert.notEqual(payloadOffset, -1)

		const dateList = baAsn1.decodeCalendarDatelist(
			buffer.buffer,
			payloadOffset,
			buffer.offset - payloadOffset,
		)
		assert.ok(dateList)
		assert.equal(dateList.value.length, 3)

		const first = dateList.value[0]
		const second = dateList.value[1]
		const third = dateList.value[2]

		assert.equal(first.type, ApplicationTag.DATE)
		assert.equal(first.value.getFullYear(), 2025)
		assert.equal(first.value.getMonth(), 7)
		assert.equal(first.value.getDate(), 22)

		assert.equal(second.type, ApplicationTag.DATERANGE)
		assert.equal(second.value.length, 2)
		assert.equal(second.value[0].type, ApplicationTag.DATE)
		assert.equal(second.value[1].type, ApplicationTag.DATE)
		assert.equal(second.value[0].value.getFullYear(), 2026)
		assert.equal(second.value[0].value.getMonth(), 1)
		assert.equal(second.value[0].value.getDate(), 19)
		assert.equal(second.value[1].value.getFullYear(), 2026)
		assert.equal(second.value[1].value.getMonth(), 3)
		assert.equal(second.value[1].value.getDate(), 17)

		assert.equal(third.type, ApplicationTag.WEEKNDAY)
		assert.deepStrictEqual(third.value, { month: 2, week: 2, wday: 2 })
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

	test('should reject calendar date list payload with invalid date range length', () => {
		const buffer = utils.getBuffer()
		const invalidDateList = [
			{
				type: ApplicationTag.DATERANGE,
				value: [
					{ type: ApplicationTag.DATE, value: new Date(2026, 1, 19) },
				],
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
		}, /calendar date list date range must have exactly 2 dates/)
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
