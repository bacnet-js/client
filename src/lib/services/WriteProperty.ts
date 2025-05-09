import * as baAsn1 from '../asn1'
import {
	ASN1_ARRAY_ALL,
	ASN1_NO_PRIORITY,
	ASN1_MAX_PRIORITY,
	ASN1_MIN_PRIORITY,
} from '../enum'
import {
	EncodeBuffer,
	BACNetAppData,
	BACNetObjectID,
	BACNetPropertyID,
	WritePropertyRequest,
	ApplicationData,
} from '../types'
import { BacnetAckService } from './AbstractServices'

export default class WriteProperty extends BacnetAckService {
	public static encode(
		buffer: EncodeBuffer,
		objectType: number,
		objectInstance: number,
		propertyId: number,
		arrayIndex: number,
		priority: number,
		values: BACNetAppData[],
	) {
		baAsn1.encodeContextObjectId(buffer, 0, objectType, objectInstance)
		baAsn1.encodeContextEnumerated(buffer, 1, propertyId)
		if (arrayIndex !== ASN1_ARRAY_ALL) {
			baAsn1.encodeContextUnsigned(buffer, 2, arrayIndex)
		}
		baAsn1.encodeOpeningTag(buffer, 3)
		values.forEach((value) =>
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

	public static encodeAcknowledge(...args: any[]): void {
		throw new Error('WriteProperty does not support acknowledge operations')
	}

	public static decodeAcknowledge(
		buffer: Buffer,
		offset: number,
		apduLen: number,
	): any {
		throw new Error('WriteProperty does not support acknowledge operations')
	}
}
