import * as baAsn1 from '../asn1'
import { TimeStamp } from '../enum'
import { EncodeBuffer, BACNetObjectID } from '../types'

export class AlarmAcknowledgeService {
	public static encode(
		buffer: EncodeBuffer,
		ackProcessId: number,
		eventObjectId: BACNetObjectID,
		eventStateAcknowledged: number,
		ackSource: string,
		eventTimeStamp: any,
		ackTimeStamp: any,
	): void {
		baAsn1.encodeContextUnsigned(buffer, 0, ackProcessId)
		baAsn1.encodeContextObjectId(
			buffer,
			1,
			eventObjectId.type,
			eventObjectId.instance,
		)
		baAsn1.encodeContextEnumerated(buffer, 2, eventStateAcknowledged)
		baAsn1.bacappEncodeContextTimestamp(buffer, 3, eventTimeStamp)
		baAsn1.encodeContextCharacterString(buffer, 4, ackSource)
		baAsn1.bacappEncodeContextTimestamp(buffer, 5, ackTimeStamp)
	}

	public static decode(buffer: Buffer, offset: number, apduLen: number) {
		let len = 0
		const value: {
			len: number
			acknowledgedProcessId: number
			eventObjectId: BACNetObjectID
			eventStateAcknowledged: number
			eventTimeStamp: Date | number
			acknowledgeSource: string
			acknowledgeTimeStamp: Date | number
		} = {
			len: 0,
			acknowledgedProcessId: 0,
			eventObjectId: { type: 0, instance: 0 },
			eventStateAcknowledged: 0,
			eventTimeStamp: new Date(),
			acknowledgeSource: '',
			acknowledgeTimeStamp: new Date(),
		}

		let result: any
		let decodedValue: any

		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeUnsigned(buffer, offset + len, result.value)
		len += decodedValue.len
		value.acknowledgedProcessId = decodedValue.value

		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeObjectId(buffer, offset + len)
		len += decodedValue.len
		value.eventObjectId = {
			type: decodedValue.objectType,
			instance: decodedValue.instance,
		}

		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeEnumerated(
			buffer,
			offset + len,
			result.value,
		)
		len += decodedValue.len
		value.eventStateAcknowledged = decodedValue.value

		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len

		if (result.tagNumber === TimeStamp.TIME) {
			decodedValue = baAsn1.decodeBacnetTime(buffer, offset + len)
			len += decodedValue.len
			value.eventTimeStamp = decodedValue.value
		} else if (result.tagNumber === TimeStamp.SEQUENCE_NUMBER) {
			decodedValue = baAsn1.decodeUnsigned(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			value.eventTimeStamp = decodedValue.value
		} else if (result.tagNumber === TimeStamp.DATETIME) {
			const dateRaw = baAsn1.decodeApplicationDate(buffer, offset + len)
			len += dateRaw.len
			const date = dateRaw.value
			const timeRaw = baAsn1.decodeApplicationTime(buffer, offset + len)
			len += timeRaw.len
			const time = timeRaw.value
			value.eventTimeStamp = new Date(
				date.getFullYear(),
				date.getMonth(),
				date.getDate(),
				time.getHours(),
				time.getMinutes(),
				time.getSeconds(),
				time.getMilliseconds(),
			)
			len++
		}

		len++
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeCharacterString(
			buffer,
			offset + len,
			apduLen - (offset + len),
			result.value,
		)
		value.acknowledgeSource = decodedValue.value
		len += decodedValue.len

		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len

		if (result.tagNumber === TimeStamp.TIME) {
			decodedValue = baAsn1.decodeBacnetTime(buffer, offset + len)
			len += decodedValue.len
			value.acknowledgeTimeStamp = decodedValue.value
		} else if (result.tagNumber === TimeStamp.SEQUENCE_NUMBER) {
			decodedValue = baAsn1.decodeUnsigned(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			value.acknowledgeTimeStamp = decodedValue.value
		} else if (result.tagNumber === TimeStamp.DATETIME) {
			const dateRaw = baAsn1.decodeApplicationDate(buffer, offset + len)
			len += dateRaw.len
			const date = dateRaw.value
			const timeRaw = baAsn1.decodeApplicationTime(buffer, offset + len)
			len += timeRaw.len
			const time = timeRaw.value
			value.acknowledgeTimeStamp = new Date(
				date.getFullYear(),
				date.getMonth(),
				date.getDate(),
				time.getHours(),
				time.getMinutes(),
				time.getSeconds(),
				time.getMilliseconds(),
			)
			len++
		}
		len++
		value.len = len
		return value
	}

	public static encodeAcknowledge(...args: any[]): void {
		throw new Error(
			'AlarmAcknowledge does not support acknowledge operations',
		)
	}

	public static decodeAcknowledge(
		buffer: Buffer,
		offset: number,
		apduLen: number,
	): any {
		throw new Error(
			'AlarmAcknowledge does not support acknowledge operations',
		)
	}
}
