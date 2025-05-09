import * as baAsn1 from '../asn1'
import { EncodeBuffer, BACNetObjectID } from '../types'
import { BacnetAckService } from './AbstractServices'

export default class LifeSafetyOperation extends BacnetAckService {
	public static encode(
		buffer: EncodeBuffer,
		processId: number,
		requestingSource: string,
		operation: number,
		targetObjectId: BACNetObjectID,
	) {
		baAsn1.encodeContextUnsigned(buffer, 0, processId)
		baAsn1.encodeContextCharacterString(buffer, 1, requestingSource)
		baAsn1.encodeContextEnumerated(buffer, 2, operation)
		baAsn1.encodeContextObjectId(
			buffer,
			3,
			targetObjectId.type,
			targetObjectId.instance,
		)
	}

	public static decode(buffer: Buffer, offset: number, apduLen: number) {
		let len = 0
		let result: any
		let decodedValue: any
		const value: any = {}
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeUnsigned(buffer, offset + len, result.value)
		len += decodedValue.len
		value.processId = decodedValue.value
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeCharacterString(
			buffer,
			offset + len,
			apduLen - (offset + len),
			result.value,
		)
		len += decodedValue.len
		value.requestingSource = decodedValue.value
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeEnumerated(
			buffer,
			offset + len,
			result.value,
		)
		len += decodedValue.len
		value.operation = decodedValue.value
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeObjectId(buffer, offset + len)
		len += decodedValue.len
		value.targetObjectId = {
			type: decodedValue.objectType,
			instance: decodedValue.instance,
		}
		value.len = len
		return value
	}

	public static encodeAcknowledge(...args: any[]): void {
		throw new Error(
			'LifeSafetyOperation does not support acknowledge operations',
		)
	}

	public static decodeAcknowledge(
		buffer: Buffer,
		offset: number,
		apduLen: number,
	): any {
		throw new Error(
			'LifeSafetyOperation does not support acknowledge operations',
		)
	}
}
