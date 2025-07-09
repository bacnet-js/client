import test from 'node:test'
import assert from 'node:assert'

import {
	ApplicationTag,
	BACNetAppData,
	CalendarWeekDay,
	CalendarDateRange,
} from '../../src'

test.describe('ApplicationData types', () => {
	test('should correctly type OCTET_STRING as number[]', () => {
		const octetStringData: BACNetAppData<ApplicationTag.OCTET_STRING> = {
			type: ApplicationTag.OCTET_STRING,
			value: [0x01, 0x02, 0x03, 0x04],
		}

		assert.strictEqual(octetStringData.type, ApplicationTag.OCTET_STRING)
		assert.ok(Array.isArray(octetStringData.value))
		assert.strictEqual(octetStringData.value[0], 0x01)
	})

	test('should correctly type BOOLEAN as boolean', () => {
		const booleanData: BACNetAppData<ApplicationTag.BOOLEAN> = {
			type: ApplicationTag.BOOLEAN,
			value: true,
		}

		assert.strictEqual(booleanData.type, ApplicationTag.BOOLEAN)
		assert.strictEqual(typeof booleanData.value, 'boolean')
		assert.strictEqual(booleanData.value, true)
	})

	test('should correctly type EMPTYLIST as unknown[]', () => {
		const emptyListData: BACNetAppData<ApplicationTag.EMPTYLIST> = {
			type: ApplicationTag.EMPTYLIST,
			value: [],
		}

		assert.strictEqual(emptyListData.type, ApplicationTag.EMPTYLIST)
		assert.ok(Array.isArray(emptyListData.value))
		assert.strictEqual(emptyListData.value.length, 0)
	})

	test('should correctly type WEEKNDAY as CalendarWeekDay', () => {
		const weekDayData: BACNetAppData<ApplicationTag.WEEKNDAY> = {
			type: ApplicationTag.WEEKNDAY,
			value: {
				len: 4,
				month: 1,
				week: 1,
				wday: 1,
			} as CalendarWeekDay,
		}

		assert.strictEqual(weekDayData.type, ApplicationTag.WEEKNDAY)
		assert.strictEqual(typeof weekDayData.value, 'object')
		assert.strictEqual(weekDayData.value.month, 1)
	})

	test('should correctly type DATERANGE as CalendarDateRange', () => {
		const dateRangeData: BACNetAppData<ApplicationTag.DATERANGE> = {
			type: ApplicationTag.DATERANGE,
			value: {
				len: 16,
				startDate: {
					len: 8,
					value: new Date('2024-01-01'),
				},
				endDate: {
					len: 8,
					value: new Date('2024-12-31'),
				},
			} as CalendarDateRange,
		}

		assert.strictEqual(dateRangeData.type, ApplicationTag.DATERANGE)
		assert.strictEqual(typeof dateRangeData.value, 'object')
		assert.strictEqual(dateRangeData.value.len, 16)
	})

	test('should correctly type DATETIME as Date', () => {
		const dateTimeData: BACNetAppData<ApplicationTag.DATETIME> = {
			type: ApplicationTag.DATETIME,
			value: new Date('2024-01-01T12:00:00Z'),
		}

		assert.strictEqual(dateTimeData.type, ApplicationTag.DATETIME)
		assert.ok(dateTimeData.value instanceof Date)
		assert.strictEqual(dateTimeData.value.getFullYear(), 2024)
	})

	test('should allow complex structures with unknown for untyped entries', () => {
		const complexData: BACNetAppData<ApplicationTag.WEEKLY_SCHEDULE> = {
			type: ApplicationTag.WEEKLY_SCHEDULE,
			value: {
				// This can be any complex structure for now
				scheduleId: 123,
				entries: [
					{ day: 'Monday', schedule: [] },
					{ day: 'Tuesday', schedule: [] },
				],
			} as unknown,
		}

		assert.strictEqual(complexData.type, ApplicationTag.WEEKLY_SCHEDULE)
		assert.strictEqual(typeof complexData.value, 'object')
	})
})
