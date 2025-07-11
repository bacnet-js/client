import * as baAsn1 from '../asn1'
import { CovType, EventType, NotifyType, TimeStamp } from '../enum'
import {
	EncodeBuffer,
	EventNotifyDataParams,
	EventNotifyDataResult,
} from '../types'
import { BacnetService } from './AbstractServices'

export default class EventNotifyData extends BacnetService {
	/**
	 * EventNotifyData encode parameters as per BACnet standard
	 */

	public static encode(
		buffer: EncodeBuffer,
		data: EventNotifyDataParams,
	): void {
		baAsn1.encodeContextUnsigned(buffer, 0, data.processId)
		baAsn1.encodeContextObjectId(
			buffer,
			1,
			data.initiatingObjectId.type,
			data.initiatingObjectId.instance,
		)
		baAsn1.encodeContextObjectId(
			buffer,
			2,
			data.eventObjectId.type,
			data.eventObjectId.instance,
		)
		baAsn1.bacappEncodeContextTimestamp(buffer, 3, data.timeStamp)
		baAsn1.encodeContextUnsigned(buffer, 4, data.notificationClass)
		baAsn1.encodeContextUnsigned(buffer, 5, data.priority)
		baAsn1.encodeContextEnumerated(buffer, 6, data.eventType)

		if (data.messageText && data.messageText !== '') {
			baAsn1.encodeContextCharacterString(buffer, 7, data.messageText)
		}

		baAsn1.encodeContextEnumerated(buffer, 8, data.notifyType)

		switch (data.notifyType) {
			case NotifyType.ALARM:
			case NotifyType.EVENT:
				baAsn1.encodeContextBoolean(buffer, 9, data.ackRequired)
				baAsn1.encodeContextEnumerated(buffer, 10, data.fromState)
				break
			default:
				break
		}

		baAsn1.encodeContextEnumerated(buffer, 11, data.toState)

		switch (data.notifyType) {
			case NotifyType.ALARM:
			case NotifyType.EVENT:
				baAsn1.encodeOpeningTag(buffer, 12)

				switch (data.eventType) {
					case EventType.CHANGE_OF_BITSTRING:
						baAsn1.encodeOpeningTag(buffer, 0)
						baAsn1.encodeContextBitstring(
							buffer,
							0,
							data.changeOfBitstringReferencedBitString,
						)
						baAsn1.encodeContextBitstring(
							buffer,
							1,
							data.changeOfBitstringStatusFlags,
						)
						baAsn1.encodeClosingTag(buffer, 0)
						break

					case EventType.CHANGE_OF_STATE:
						baAsn1.encodeOpeningTag(buffer, 1)
						baAsn1.encodeOpeningTag(buffer, 0)
						baAsn1.bacappEncodePropertyState(
							buffer,
							data.changeOfStateNewState,
						)
						baAsn1.encodeClosingTag(buffer, 0)
						baAsn1.encodeContextBitstring(
							buffer,
							1,
							data.changeOfStateStatusFlags,
						)
						baAsn1.encodeClosingTag(buffer, 1)
						break

					case EventType.CHANGE_OF_VALUE:
						baAsn1.encodeOpeningTag(buffer, 2)
						baAsn1.encodeOpeningTag(buffer, 0)

						switch (data.changeOfValueTag) {
							case CovType.REAL:
								baAsn1.encodeContextReal(
									buffer,
									1,
									data.changeOfValueChangeValue,
								)
								break
							case CovType.BIT_STRING:
								baAsn1.encodeContextBitstring(
									buffer,
									0,
									data.changeOfValueChangedBits,
								)
								break
							default:
								throw new Error('NotImplemented')
						}

						baAsn1.encodeClosingTag(buffer, 0)
						baAsn1.encodeContextBitstring(
							buffer,
							1,
							data.changeOfValueStatusFlags,
						)
						baAsn1.encodeClosingTag(buffer, 2)
						break

					case EventType.FLOATING_LIMIT:
						baAsn1.encodeOpeningTag(buffer, 4)
						baAsn1.encodeContextReal(
							buffer,
							0,
							data.floatingLimitReferenceValue,
						)
						baAsn1.encodeContextBitstring(
							buffer,
							1,
							data.floatingLimitStatusFlags,
						)
						baAsn1.encodeContextReal(
							buffer,
							2,
							data.floatingLimitSetPointValue,
						)
						baAsn1.encodeContextReal(
							buffer,
							3,
							data.floatingLimitErrorLimit,
						)
						baAsn1.encodeClosingTag(buffer, 4)
						break

					case EventType.OUT_OF_RANGE:
						baAsn1.encodeOpeningTag(buffer, 5)
						baAsn1.encodeContextReal(
							buffer,
							0,
							data.outOfRangeExceedingValue,
						)
						baAsn1.encodeContextBitstring(
							buffer,
							1,
							data.outOfRangeStatusFlags,
						)
						baAsn1.encodeContextReal(
							buffer,
							2,
							data.outOfRangeDeadband,
						)
						baAsn1.encodeContextReal(
							buffer,
							3,
							data.outOfRangeExceededLimit,
						)
						baAsn1.encodeClosingTag(buffer, 5)
						break

					case EventType.CHANGE_OF_LIFE_SAFETY:
						baAsn1.encodeOpeningTag(buffer, 8)
						baAsn1.encodeContextEnumerated(
							buffer,
							0,
							data.changeOfLifeSafetyNewState,
						)
						baAsn1.encodeContextEnumerated(
							buffer,
							1,
							data.changeOfLifeSafetyNewMode,
						)
						baAsn1.encodeContextBitstring(
							buffer,
							2,
							data.changeOfLifeSafetyStatusFlags,
						)
						baAsn1.encodeContextEnumerated(
							buffer,
							3,
							data.changeOfLifeSafetyOperationExpected,
						)
						baAsn1.encodeClosingTag(buffer, 8)
						break

					case EventType.BUFFER_READY:
						baAsn1.encodeOpeningTag(buffer, 10)
						baAsn1.bacappEncodeContextDeviceObjPropertyRef(
							buffer,
							0,
							data.bufferReadyBufferProperty,
						)
						baAsn1.encodeContextUnsigned(
							buffer,
							1,
							data.bufferReadyPreviousNotification,
						)
						baAsn1.encodeContextUnsigned(
							buffer,
							2,
							data.bufferReadyCurrentNotification,
						)
						baAsn1.encodeClosingTag(buffer, 10)
						break

					case EventType.UNSIGNED_RANGE:
						baAsn1.encodeOpeningTag(buffer, 11)
						baAsn1.encodeContextUnsigned(
							buffer,
							0,
							data.unsignedRangeExceedingValue,
						)
						baAsn1.encodeContextBitstring(
							buffer,
							1,
							data.unsignedRangeStatusFlags,
						)
						baAsn1.encodeContextUnsigned(
							buffer,
							2,
							data.unsignedRangeExceededLimit,
						)
						baAsn1.encodeClosingTag(buffer, 11)
						break

					case EventType.EXTENDED:
					case EventType.COMMAND_FAILURE:
						throw new Error('NotImplemented')

					default:
						throw new Error('NotImplemented')
				}

				baAsn1.encodeClosingTag(buffer, 12)
				break

			case NotifyType.ACK_NOTIFICATION:
				throw new Error('NotImplemented')

			default:
				break
		}
	}

	public static decode(
		buffer: Buffer,
		offset: number,
	): EventNotifyDataResult | undefined {
		let len = 0
		let result: any
		let decodedValue: any
		const eventData = {} as EventNotifyDataResult

		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 0))
			return undefined
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeUnsigned(buffer, offset + len, result.value)
		len += decodedValue.len
		eventData.processId = decodedValue.value

		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 1))
			return undefined
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeObjectId(buffer, offset + len)
		len += decodedValue.len
		eventData.initiatingObjectId = {
			type: decodedValue.objectType,
			instance: decodedValue.instance,
		}

		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 2))
			return undefined
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeObjectId(buffer, offset + len)
		len += decodedValue.len
		eventData.eventObjectId = {
			type: decodedValue.objectType,
			instance: decodedValue.instance,
		}

		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 3))
			return undefined
		len += 2
		decodedValue = baAsn1.decodeApplicationDate(buffer, offset + len)
		len += decodedValue.len
		const date = decodedValue.value
		decodedValue = baAsn1.decodeApplicationTime(buffer, offset + len)
		len += decodedValue.len
		const time = decodedValue.value
		eventData.timeStamp = {
			type: TimeStamp.DATETIME,
			value: new Date(
				date.getFullYear(),
				date.getMonth(),
				date.getDate(),
				time.getHours(),
				time.getMinutes(),
				time.getSeconds(),
				time.getMilliseconds(),
			),
		}
		len += 2

		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 4))
			return undefined
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeUnsigned(buffer, offset + len, result.value)
		len += decodedValue.len
		eventData.notificationClass = decodedValue.value

		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 5))
			return undefined
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeUnsigned(buffer, offset + len, result.value)
		len += decodedValue.len
		eventData.priority = decodedValue.value
		if (eventData.priority > 0xff) return undefined

		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 6))
			return undefined
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeEnumerated(
			buffer,
			offset + len,
			result.value,
		)
		len += decodedValue.len
		eventData.eventType = decodedValue.value

		if (baAsn1.decodeIsContextTag(buffer, offset + len, 7)) {
			decodedValue = baAsn1.decodeContextCharacterString(
				buffer,
				offset + len,
				20000,
				7,
			)
			len += decodedValue.len
			eventData.messageText = decodedValue.value
		}

		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 8))
			return undefined
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeEnumerated(
			buffer,
			offset + len,
			result.value,
		)
		len += decodedValue.len
		eventData.notifyType = decodedValue.value

		switch (eventData.notifyType) {
			case NotifyType.ALARM:
			case NotifyType.EVENT:
				result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
				len += result.len
				decodedValue = baAsn1.decodeUnsigned(buffer, offset + len, 1)
				len += decodedValue.len
				eventData.ackRequired = decodedValue.value > 0

				if (!baAsn1.decodeIsContextTag(buffer, offset + len, 10))
					return undefined
				result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
				len += result.len
				decodedValue = baAsn1.decodeEnumerated(
					buffer,
					offset + len,
					result.value,
				)
				len += decodedValue.len
				eventData.fromState = decodedValue.value
				break

			default:
				break
		}

		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 11))
			return undefined
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeEnumerated(
			buffer,
			offset + len,
			result.value,
		)
		len += decodedValue.len
		eventData.toState = decodedValue.value

		eventData.len = len
		return eventData
	}
}
