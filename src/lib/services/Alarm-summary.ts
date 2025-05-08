import * as baAsn1 from '../asn1'
import { EncodeBuffer, BACNetAlarm } from '../types'

export class AlarmSummaryService {
	public static encode(buffer: EncodeBuffer, alarms: BACNetAlarm[]): void {
		alarms.forEach((alarm) => {
			baAsn1.encodeContextObjectId(
				buffer,
				12,
				alarm.objectId.type,
				alarm.objectId.instance,
			)
			baAsn1.encodeContextEnumerated(buffer, 9, alarm.alarmState)
			baAsn1.encodeContextBitstring(
				buffer,
				8,
				alarm.acknowledgedTransitions,
			)
		})
	}

	public static decode(buffer: Buffer, offset: number, apduLen: number) {
		let len = 0
		let result: any
		let decodedValue: any
		const alarms: BACNetAlarm[] = []

		while (apduLen - 3 - len > 0) {
			const value: BACNetAlarm = {
				objectId: { type: 0, instance: 0 },
				alarmState: 0,
				acknowledgedTransitions: { bitsUsed: 0, value: [] },
			}

			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			len += result.len
			decodedValue = baAsn1.decodeObjectId(buffer, offset + len)
			len += decodedValue.len
			value.objectId = {
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
			value.alarmState = decodedValue.value
			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			len += result.len
			decodedValue = baAsn1.decodeBitstring(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			value.acknowledgedTransitions = decodedValue.value
			alarms.push(value)
		}
		return {
			len,
			alarms,
		}
	}

	public static encodeAcknowledge(...args: any[]): void {
		throw new Error('AlarmSummary does not support acknowledge operations')
	}

	public static decodeAcknowledge(
		buffer: Buffer,
		offset: number,
		apduLen: number,
	): any {
		throw new Error('AlarmSummary does not support acknowledge operations')
	}
}
