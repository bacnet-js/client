import * as baAsn1 from '../asn1'
import { ApplicationTag } from '../enum'
import {
	EncodeBuffer,
	EnrollmentFilter,
	EnrollmentSummary,
	EnrollmentSummaryAcknowledge,
	PriorityFilter,
} from '../types'
import { BacnetAckService } from './AbstractServices'

export default class GetEnrollmentSummary extends BacnetAckService {
	public static encode(
		buffer: EncodeBuffer,
		acknowledgmentFilter: number,
		enrollmentFilter?: EnrollmentFilter,
		eventStateFilter?: number,
		eventTypeFilter?: number,
		priorityFilter?: PriorityFilter,
		notificationClassFilter?: number,
	): void {
		baAsn1.encodeContextEnumerated(buffer, 0, acknowledgmentFilter)

		if (enrollmentFilter) {
			baAsn1.encodeOpeningTag(buffer, 1)
			baAsn1.encodeOpeningTag(buffer, 0)
			baAsn1.encodeContextObjectId(
				buffer,
				0,
				enrollmentFilter.objectId.type,
				enrollmentFilter.objectId.instance,
			)
			baAsn1.encodeClosingTag(buffer, 0)
			baAsn1.encodeContextUnsigned(buffer, 1, enrollmentFilter.processId)
			baAsn1.encodeClosingTag(buffer, 1)
		}

		if (eventStateFilter) {
			baAsn1.encodeOpeningTag(buffer, 2)
			baAsn1.encodeContextEnumerated(buffer, 0, eventStateFilter)
			baAsn1.encodeClosingTag(buffer, 2)
		}

		if (eventTypeFilter) {
			baAsn1.encodeOpeningTag(buffer, 3)
			baAsn1.encodeContextEnumerated(buffer, 0, eventTypeFilter)
			baAsn1.encodeClosingTag(buffer, 3)
		}

		if (priorityFilter) {
			baAsn1.encodeOpeningTag(buffer, 4)
			baAsn1.encodeContextUnsigned(buffer, 0, priorityFilter.min)
			baAsn1.encodeContextUnsigned(buffer, 1, priorityFilter.max)
			baAsn1.encodeClosingTag(buffer, 4)
		}

		if (notificationClassFilter) {
			baAsn1.encodeOpeningTag(buffer, 5)
			baAsn1.encodeContextUnsigned(buffer, 0, notificationClassFilter)
			baAsn1.encodeClosingTag(buffer, 5)
		}
	}

	public static decode(buffer: Buffer, offset: number) {
		let len = 0
		let result: any
		let decodedValue: any
		const value: any = {}

		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeEnumerated(
			buffer,
			offset + len,
			result.value,
		)
		len += decodedValue.len
		value.acknowledgmentFilter = decodedValue.value

		if (baAsn1.decodeIsContextTag(buffer, offset + len, 1)) {
			len++
			value.enrollmentFilter = {}
			if (!baAsn1.decodeIsContextTag(buffer, offset + len, 0))
				return undefined
			len++
			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			len += result.len
			decodedValue = baAsn1.decodeObjectId(buffer, offset + len)
			len += decodedValue.len
			value.enrollmentFilter.objectId = {
				type: decodedValue.objectType,
				instance: decodedValue.instance,
			}
			len++
			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			len += result.len
			decodedValue = baAsn1.decodeUnsigned(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			value.enrollmentFilter.processId = decodedValue.value
			len++
		}

		if (baAsn1.decodeIsContextTag(buffer, offset + len, 2)) {
			len++
			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			len += result.len
			decodedValue = baAsn1.decodeEnumerated(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			value.eventStateFilter = decodedValue.value
			len++
		}

		if (baAsn1.decodeIsContextTag(buffer, offset + len, 3)) {
			len++
			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			len += result.len
			decodedValue = baAsn1.decodeEnumerated(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			value.eventTypeFilter = decodedValue.value
			len++
		}

		if (baAsn1.decodeIsContextTag(buffer, offset + len, 4)) {
			len++
			value.priorityFilter = {}
			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			len += result.len
			decodedValue = baAsn1.decodeUnsigned(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			value.priorityFilter.min = decodedValue.value
			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			len += result.len
			decodedValue = baAsn1.decodeUnsigned(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			value.priorityFilter.max = decodedValue.value
			len++
		}

		if (baAsn1.decodeIsContextTag(buffer, offset + len, 5)) {
			len++
			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			len += result.len
			decodedValue = baAsn1.decodeUnsigned(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			value.notificationClassFilter = decodedValue.value
			len++
		}

		value.len = len
		return value
	}

	public static encodeAcknowledge(
		buffer: EncodeBuffer,
		enrollmentSummaries: EnrollmentSummary[],
	): void {
		enrollmentSummaries.forEach((enrollmentSummary) => {
			baAsn1.encodeApplicationObjectId(
				buffer,
				enrollmentSummary.objectId.type,
				enrollmentSummary.objectId.instance,
			)
			baAsn1.encodeApplicationEnumerated(
				buffer,
				enrollmentSummary.eventType,
			)
			baAsn1.encodeApplicationEnumerated(
				buffer,
				enrollmentSummary.eventState,
			)
			baAsn1.encodeApplicationUnsigned(buffer, enrollmentSummary.priority)
			baAsn1.encodeApplicationUnsigned(
				buffer,
				enrollmentSummary.notificationClass,
			)
		})
	}

	public static decodeAcknowledge(
		buffer: Buffer,
		offset: number,
		apduLen: number,
	): EnrollmentSummaryAcknowledge | undefined {
		let len = 0
		const enrollmentSummaries: EnrollmentSummary[] = []

		while (apduLen - len > 0) {
			const enrollmentSummary = {} as EnrollmentSummary
			{
				const result = baAsn1.decodeTagNumberAndValue(
					buffer,
					offset + len,
				)
				len += result.len
				if (result.tagNumber !== ApplicationTag.OBJECTIDENTIFIER)
					return undefined
			}

			{
				const result = baAsn1.decodeObjectId(buffer, offset + len)
				len += result.len
				enrollmentSummary.objectId = {
					type: result.objectType,
					instance: result.instance,
				}
			}

			{
				const result = baAsn1.decodeTagNumberAndValue(
					buffer,
					offset + len,
				)
				len += result.len
				if (result.tagNumber !== ApplicationTag.ENUMERATED)
					return undefined

				const decoded = baAsn1.decodeEnumerated(
					buffer,
					offset + len,
					result.value,
				)
				len += decoded.len
				enrollmentSummary.eventType = decoded.value
			}

			{
				const result = baAsn1.decodeTagNumberAndValue(
					buffer,
					offset + len,
				)
				len += result.len
				if (result.tagNumber !== ApplicationTag.ENUMERATED)
					return undefined

				const decoded = baAsn1.decodeEnumerated(
					buffer,
					offset + len,
					result.value,
				)
				len += decoded.len
				enrollmentSummary.eventState = decoded.value
			}

			{
				const result = baAsn1.decodeTagNumberAndValue(
					buffer,
					offset + len,
				)
				len += result.len
				if (result.tagNumber !== ApplicationTag.UNSIGNED_INTEGER)
					return undefined

				const decoded = baAsn1.decodeUnsigned(
					buffer,
					offset + len,
					result.value,
				)
				len += decoded.len
				enrollmentSummary.priority = decoded.value
			}

			{
				const result = baAsn1.decodeTagNumberAndValue(
					buffer,
					offset + len,
				)
				len += result.len
				if (result.tagNumber !== ApplicationTag.UNSIGNED_INTEGER)
					return undefined

				const decoded = baAsn1.decodeUnsigned(
					buffer,
					offset + len,
					result.value,
				)
				len += decoded.len
				enrollmentSummary.notificationClass = decoded.value
			}

			enrollmentSummaries.push(enrollmentSummary)
		}

		return {
			enrollmentSummaries,
			len,
		}
	}
}
