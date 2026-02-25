import * as baAsn1 from '../asn1'
import {
	ASN1_ARRAY_ALL,
	ASN1_NO_PRIORITY,
	ASN1_MAX_PRIORITY,
	ASN1_MIN_PRIORITY,
	ApplicationTag,
	ObjectType,
	PropertyIdentifier,
} from '../enum'
import {
	EncodeBuffer,
	BACNetAppData,
	BACNetCalendarDateListPayload,
	BACNetDateAppData,
	BACNetDateRangeAppData,
	BACNetDateValue,
	BACNetEffectivePeriodPayload,
	BACNetExceptionSchedulePayload,
	BACNetObjectID,
	BACNetPropertyID,
	BACNetRawDate,
	BACNetSpecialEventEntry,
	BACNetTimeAppData,
	BACNetWeekNDayAppData,
	BACNetWeekNDayValue,
	BACNetWeeklySchedulePayload,
	WritePropertyRequest,
	ApplicationData,
	BACNetWritePropertyValues,
} from '../types'
import { BacnetService } from './AbstractServices'

export default class WriteProperty extends BacnetService {
	private static validateRawDateByte(
		name: string,
		value: number,
		min: number,
		max: number,
	) {
		if (!Number.isInteger(value) || value < min || value > max) {
			throw new Error(`invalid raw date ${name}: ${value}`)
		}
	}

	private static validateWeekNDayByte(
		name: string,
		value: number,
		min: number,
		max: number,
	) {
		if (value === 0xff) return
		WriteProperty.validateRawDateByte(name, value, min, max)
	}

	private static isObjectRecord(
		value: unknown,
	): value is Record<string, unknown> {
		return value != null && typeof value === 'object'
	}

	private static hasTypeAndValue(
		value: unknown,
	): value is { type: unknown; value: unknown } {
		return (
			WriteProperty.isObjectRecord(value) &&
			'type' in value &&
			'value' in value
		)
	}

	private static isRawDate(value: unknown): value is BACNetRawDate {
		return (
			WriteProperty.isObjectRecord(value) &&
			'year' in value &&
			'month' in value &&
			'day' in value &&
			'wday' in value
		)
	}

	private static hasRawDate(
		value: unknown,
	): value is { raw: BACNetDateValue } {
		return WriteProperty.isObjectRecord(value) && 'raw' in value
	}

	private static isDateAppData(value: unknown): value is BACNetDateAppData {
		return (
			WriteProperty.hasTypeAndValue(value) &&
			value.type === ApplicationTag.DATE
		)
	}

	private static isTimeAppData(value: unknown): value is BACNetTimeAppData {
		return (
			WriteProperty.hasTypeAndValue(value) &&
			value.type === ApplicationTag.TIME
		)
	}

	private static isWeekNDayAppData(
		value: BACNetWeekNDayAppData | BACNetWeekNDayValue,
	): value is BACNetWeekNDayAppData {
		return (
			WriteProperty.hasTypeAndValue(value) &&
			value.type === ApplicationTag.WEEKNDAY
		)
	}

	private static writeDateBytes(buffer: EncodeBuffer, value: BACNetDateValue) {
		if (WriteProperty.isRawDate(value)) {
			WriteProperty.validateRawDateByte('year', value.year, 0, 255)
			if (value.month !== 0xff) {
				WriteProperty.validateRawDateByte('month', value.month, 1, 14)
			}
			if (value.day !== 0xff) {
				WriteProperty.validateRawDateByte('day', value.day, 1, 34)
			}
			if (value.wday !== 0xff) {
				WriteProperty.validateRawDateByte('wday', value.wday, 1, 7)
			}
			buffer.buffer[buffer.offset++] = value.year
			buffer.buffer[buffer.offset++] = value.month
			buffer.buffer[buffer.offset++] = value.day
			buffer.buffer[buffer.offset++] = value.wday
			return
		}

		const isWildcardDate = value === baAsn1.ZERO_DATE
		const date = value instanceof Date ? value : new Date(value)
		if (isWildcardDate) {
			buffer.buffer[buffer.offset++] = 0xff
			buffer.buffer[buffer.offset++] = 0xff
			buffer.buffer[buffer.offset++] = 0xff
			buffer.buffer[buffer.offset++] = 0xff
			return
		}

		if (date.getFullYear() >= baAsn1.START_YEAR) {
			buffer.buffer[buffer.offset++] =
				date.getFullYear() - baAsn1.START_YEAR
		} else if (date.getFullYear() < baAsn1.MAX_YEARS) {
			buffer.buffer[buffer.offset++] = date.getFullYear()
		} else {
			throw new Error(`invalid year: ${date.getFullYear()}`)
		}
		buffer.buffer[buffer.offset++] = date.getMonth() + 1
		buffer.buffer[buffer.offset++] = date.getDate()
		buffer.buffer[buffer.offset++] = date.getDay() === 0 ? 7 : date.getDay()
	}

	private static extractDateInput(
		entry: BACNetDateAppData | BACNetDateValue | { raw: BACNetDateValue },
	): BACNetDateValue {
		if (WriteProperty.hasRawDate(entry)) {
			return entry.raw
		}
		if (WriteProperty.isDateAppData(entry)) {
			return entry.value
		}
		return entry as BACNetDateValue
	}

	private static normalizeTimeInput(
		time: BACNetTimeAppData | Date | number | null | undefined,
		errorPrefix: string,
	): Date {
		const timeValue = WriteProperty.isTimeAppData(time) ? time.value : time
		if (timeValue == null) {
			throw new Error(`${errorPrefix} time is required`)
		}
		const normalized = timeValue instanceof Date ? timeValue : new Date(timeValue)
		if (Number.isNaN(normalized.getTime())) {
			throw new Error(`${errorPrefix} time is invalid`)
		}
		return normalized
	}

	private static encodeDate(
		buffer: EncodeBuffer,
		value: BACNetDateValue,
		contextTag?: number,
	) {
		if (contextTag !== undefined) {
			baAsn1.encodeTag(buffer, contextTag, true, 4)
		} else {
			baAsn1.encodeTag(buffer, ApplicationTag.DATE, false, 4)
		}
		WriteProperty.writeDateBytes(buffer, value)
	}

	private static encodeWeekNDayContext(
		buffer: EncodeBuffer,
		value: BACNetWeekNDayAppData | BACNetWeekNDayValue,
	) {
		const weekNDay = WriteProperty.isWeekNDayAppData(value)
			? value.value
			: value
		if (!WriteProperty.isObjectRecord(weekNDay)) {
			throw new Error('Could not encode: invalid WEEKNDAY value')
		}
		WriteProperty.validateWeekNDayByte('month', weekNDay.month, 1, 14)
		WriteProperty.validateWeekNDayByte('week', weekNDay.week, 1, 6)
		WriteProperty.validateWeekNDayByte('wday', weekNDay.wday, 1, 7)
		baAsn1.encodeTag(buffer, 2, true, 3)
		buffer.buffer[buffer.offset++] = weekNDay.month
		buffer.buffer[buffer.offset++] = weekNDay.week
		buffer.buffer[buffer.offset++] = weekNDay.wday
	}

	private static encodeDateRangeContext(
		buffer: EncodeBuffer,
		value: BACNetDateRangeAppData['value'],
		invalidMessage: string,
	) {
		if (!Array.isArray(value) || value.length !== 2) {
			throw new Error(invalidMessage)
		}
		baAsn1.encodeOpeningTag(buffer, 1)
		for (const row of value) {
			WriteProperty.encodeDate(
				buffer,
				WriteProperty.extractDateInput(row),
			)
		}
		baAsn1.encodeClosingTag(buffer, 1)
	}

	private static encodeWriteHeader(
		buffer: EncodeBuffer,
		objectType: number,
		objectInstance: number,
		propertyId: number,
		arrayIndex: number,
	) {
		baAsn1.encodeContextObjectId(buffer, 0, objectType, objectInstance)
		baAsn1.encodeContextEnumerated(buffer, 1, propertyId)
		if (arrayIndex !== ASN1_ARRAY_ALL) {
			baAsn1.encodeContextUnsigned(buffer, 2, arrayIndex)
		}
		baAsn1.encodeOpeningTag(buffer, 3)
	}

	private static encodeWritePriority(buffer: EncodeBuffer, priority: number) {
		if (priority !== ASN1_NO_PRIORITY) {
			baAsn1.encodeContextUnsigned(buffer, 4, priority)
		}
	}

	private static encodeWeeklySchedulePayload(
		buffer: EncodeBuffer,
		values: BACNetWeeklySchedulePayload,
	) {
		if (!Array.isArray(values)) {
			throw new Error(
				'Could not encode: weekly schedule should be an array',
			)
		}
		if (values.length !== 7) {
			throw new Error(
				'Could not encode: weekly schedule should have exactly 7 days',
			)
		}
		for (const [index, day] of values.entries()) {
			if (!Array.isArray(day)) {
				throw new Error(
					`Could not encode: weekly schedule day ${index} should be an array`,
				)
			}
			baAsn1.encodeOpeningTag(buffer, 0)
			for (const [slotIndex, slot] of day.entries()) {
				const timeValue = WriteProperty.normalizeTimeInput(
					slot?.time,
					`Could not encode: weekly schedule day ${index} slot ${slotIndex}`,
				)
				baAsn1.bacappEncodeApplicationData(buffer, {
					type: ApplicationTag.TIME,
					value: timeValue,
				})
				baAsn1.bacappEncodeApplicationData(buffer, slot.value)
			}
			baAsn1.encodeClosingTag(buffer, 0)
		}
	}

	private static encodeExceptionDate(
		buffer: EncodeBuffer,
		date: BACNetSpecialEventEntry['date'],
	) {
		if (date.type === ApplicationTag.DATE) {
			WriteProperty.encodeDate(
				buffer,
				WriteProperty.extractDateInput(date),
				0,
			)
			return
		}
		if (date.type === ApplicationTag.DATERANGE) {
			WriteProperty.encodeDateRangeContext(
				buffer,
				date.value,
				'Could not encode: exception schedule date range must have exactly 2 dates',
			)
			return
		}
		if (date.type === ApplicationTag.WEEKNDAY) {
			WriteProperty.encodeWeekNDayContext(buffer, date)
			return
		}
		throw new Error(
			'Could not encode: unsupported exception schedule date format',
		)
	}

	private static encodeExceptionSchedulePayload(
		buffer: EncodeBuffer,
		values: BACNetExceptionSchedulePayload,
	) {
		if (!Array.isArray(values)) {
			throw new Error(
				'Could not encode: exception schedule values must be an array',
			)
		}
		for (const [index, entry] of values.entries()) {
			baAsn1.encodeOpeningTag(buffer, 0)
			WriteProperty.encodeExceptionDate(buffer, entry.date)
			baAsn1.encodeClosingTag(buffer, 0)

			const events = entry?.events
			if (events != null && !Array.isArray(events)) {
				throw new Error(
					`Could not encode: exception schedule entry ${index} events must be an array`,
				)
			}
			baAsn1.encodeOpeningTag(buffer, 2)
			for (const [eventIndex, event] of (events || []).entries()) {
				const timeValue = WriteProperty.normalizeTimeInput(
					event?.time,
					`Could not encode: exception schedule entry ${index} event ${eventIndex}`,
				)
				baAsn1.bacappEncodeApplicationData(buffer, {
					type: ApplicationTag.TIME,
					value: timeValue,
				})
				baAsn1.bacappEncodeApplicationData(buffer, event.value)
			}
			baAsn1.encodeClosingTag(buffer, 2)

			const priority = entry?.priority as
				| BACNetAppData<ApplicationTag.UNSIGNED_INTEGER, number>
				| number
				| undefined
			const priorityValue =
				typeof priority === 'number' ? priority : priority?.value
			if (
				!Number.isInteger(priorityValue) ||
				priorityValue < ASN1_MIN_PRIORITY ||
				priorityValue > ASN1_MAX_PRIORITY
			) {
				throw new Error(
					`Could not encode: exception schedule priority must be between ${ASN1_MIN_PRIORITY} and ${ASN1_MAX_PRIORITY}`,
				)
			}
			baAsn1.encodeContextUnsigned(buffer, 3, priorityValue)
		}
	}

	private static encodeEffectivePeriodPayload(
		buffer: EncodeBuffer,
		values: BACNetEffectivePeriodPayload,
	) {
		if (!Array.isArray(values)) {
			throw new Error(
				'Could not encode: effective period should be an array',
			)
		}
		if (values.length !== 2) {
			throw new Error(
				'Could not encode: effective period should have a length of 2',
			)
		}
		for (const entry of values) {
			WriteProperty.encodeDate(
				buffer,
				WriteProperty.extractDateInput(entry),
			)
		}
	}

	private static encodeCalendarDateListPayload(
		buffer: EncodeBuffer,
		values: BACNetCalendarDateListPayload,
	) {
		if (!Array.isArray(values)) {
			throw new Error(
				'Could not encode: calendar date list should be an array',
			)
		}
		for (const entry of values) {
			if (entry?.type === ApplicationTag.DATE) {
				WriteProperty.encodeDate(
					buffer,
					WriteProperty.extractDateInput(entry),
					0,
				)
			} else if (entry?.type === ApplicationTag.DATERANGE) {
				WriteProperty.encodeDateRangeContext(
					buffer,
					entry.value,
					'Could not encode: calendar date list date range must have exactly 2 dates',
				)
			} else if (entry?.type === ApplicationTag.WEEKNDAY) {
				WriteProperty.encodeWeekNDayContext(buffer, entry)
			} else {
				throw new Error(
					'Could not encode: unsupported calendar date list entry format',
				)
			}
		}
	}

	public static encode(
		buffer: EncodeBuffer,
		objectType: number,
		objectInstance: number,
		propertyId: number,
		arrayIndex: number,
		priority: number,
		values: BACNetWritePropertyValues,
	) {
		if (
			objectType === ObjectType.SCHEDULE &&
			propertyId === PropertyIdentifier.WEEKLY_SCHEDULE
		) {
			WriteProperty.encodeWriteHeader(
				buffer,
				objectType,
				objectInstance,
				propertyId,
				arrayIndex,
			)
			WriteProperty.encodeWeeklySchedulePayload(
				buffer,
				values as BACNetWeeklySchedulePayload,
			)
			baAsn1.encodeClosingTag(buffer, 3)
			WriteProperty.encodeWritePriority(buffer, priority)
			return
		}
		if (
			objectType === ObjectType.SCHEDULE &&
			propertyId === PropertyIdentifier.EXCEPTION_SCHEDULE
		) {
			WriteProperty.encodeWriteHeader(
				buffer,
				objectType,
				objectInstance,
				propertyId,
				arrayIndex,
			)
			WriteProperty.encodeExceptionSchedulePayload(
				buffer,
				values as BACNetExceptionSchedulePayload,
			)
			baAsn1.encodeClosingTag(buffer, 3)
			WriteProperty.encodeWritePriority(buffer, priority)
			return
		}
		if (
			objectType === ObjectType.SCHEDULE &&
			propertyId === PropertyIdentifier.EFFECTIVE_PERIOD
		) {
			WriteProperty.encodeWriteHeader(
				buffer,
				objectType,
				objectInstance,
				propertyId,
				arrayIndex,
			)
			WriteProperty.encodeEffectivePeriodPayload(
				buffer,
				values as BACNetEffectivePeriodPayload,
			)
			baAsn1.encodeClosingTag(buffer, 3)
			WriteProperty.encodeWritePriority(buffer, priority)
			return
		}
		if (
			objectType === ObjectType.CALENDAR &&
			propertyId === PropertyIdentifier.DATE_LIST
		) {
			WriteProperty.encodeWriteHeader(
				buffer,
				objectType,
				objectInstance,
				propertyId,
				arrayIndex,
			)
			WriteProperty.encodeCalendarDateListPayload(
				buffer,
				values as BACNetCalendarDateListPayload,
			)
			baAsn1.encodeClosingTag(buffer, 3)
			WriteProperty.encodeWritePriority(buffer, priority)
			return
		}

		baAsn1.encodeContextObjectId(buffer, 0, objectType, objectInstance)
		baAsn1.encodeContextEnumerated(buffer, 1, propertyId)
		if (arrayIndex !== ASN1_ARRAY_ALL) {
			baAsn1.encodeContextUnsigned(buffer, 2, arrayIndex)
		}
		baAsn1.encodeOpeningTag(buffer, 3)
		;(values as BACNetAppData[]).forEach((value) =>
			baAsn1.bacappEncodeApplicationData(buffer, value),
		)
		baAsn1.encodeClosingTag(buffer, 3)
		if (priority !== ASN1_NO_PRIORITY) {
			baAsn1.encodeContextUnsigned(buffer, 4, priority)
		}
	}

	public static decode(
		buffer: Buffer,
		offset: number,
		apduLen: number,
	): WritePropertyRequest | undefined {
		let len = 0
		const value: {
			property: BACNetPropertyID
			value?: ApplicationData[]
			priority?: number
		} = {
			property: { id: 0, index: ASN1_ARRAY_ALL },
		}

		let decodedValue
		let result

		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 0))
			return undefined

		len++
		decodedValue = baAsn1.decodeObjectId(buffer, offset + len)

		const objectId: BACNetObjectID = {
			type: decodedValue.objectType,
			instance: decodedValue.instance,
		}

		len += decodedValue.len
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len

		if (result.tagNumber !== 1) return undefined

		decodedValue = baAsn1.decodeEnumerated(
			buffer,
			offset + len,
			result.value,
		)
		len += decodedValue.len
		value.property.id = decodedValue.value

		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		if (result.tagNumber === 2) {
			len += result.len
			decodedValue = baAsn1.decodeUnsigned(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			value.property.index = decodedValue.value
		} else {
			value.property.index = ASN1_ARRAY_ALL
		}

		if (!baAsn1.decodeIsOpeningTagNumber(buffer, offset + len, 3))
			return undefined
		len++

		const values: ApplicationData[] = []
		while (
			apduLen - len > 1 &&
			!baAsn1.decodeIsClosingTagNumber(buffer, offset + len, 3)
		) {
			decodedValue = baAsn1.bacappDecodeApplicationData(
				buffer,
				offset + len,
				apduLen + offset,
				objectId.type,
				value.property.id,
			)
			if (!decodedValue) return undefined
			len += decodedValue.len
			delete decodedValue.len
			values.push(decodedValue as ApplicationData)
		}
		value.value = values
		if (!baAsn1.decodeIsClosingTagNumber(buffer, offset + len, 3))
			return undefined
		len++

		value.priority = ASN1_MAX_PRIORITY

		if (len < apduLen) {
			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			if (result.tagNumber === 4) {
				len += result.len
				decodedValue = baAsn1.decodeUnsigned(
					buffer,
					offset + len,
					result.value,
				)
				len += decodedValue.len

				if (
					decodedValue.value >= ASN1_MIN_PRIORITY &&
					decodedValue.value <= ASN1_MAX_PRIORITY
				) {
					value.priority = decodedValue.value
				} else {
					return undefined
				}
			}
		}

		return {
			len,
			objectId,
			value: value as {
				property: BACNetPropertyID
				value: ApplicationData[]
				priority: number
			},
		}
	}
}
