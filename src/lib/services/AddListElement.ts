import * as baAsn1 from '../asn1'
import { ASN1_ARRAY_ALL } from '../enum'
import { EncodeBuffer, BACNetObjectID, BACNetAppData } from '../types'

export class AddListElement {
	public static encode(
		buffer: EncodeBuffer,
		objectId: BACNetObjectID,
		propertyId: number,
		arrayIndex: number,
		values: BACNetAppData[],
	): void {
		baAsn1.encodeContextObjectId(
			buffer,
			0,
			objectId.type,
			objectId.instance,
		)
		baAsn1.encodeContextEnumerated(buffer, 1, propertyId)
		if (arrayIndex !== ASN1_ARRAY_ALL) {
			baAsn1.encodeContextUnsigned(buffer, 2, arrayIndex)
		}
		baAsn1.encodeOpeningTag(buffer, 3)
		values.forEach((value: BACNetAppData) =>
			baAsn1.bacappEncodeApplicationData(buffer, value),
		)
		baAsn1.encodeClosingTag(buffer, 3)
	}

	public static decode(buffer: Buffer, offset: number, apduLen: number) {
		let len = 0
		let result: any
		let decodedValue: any

		const value: {
			len: number
			objectId: BACNetObjectID
			property: {
				id: number
				index: number
			}
			values: BACNetAppData[]
		} = {
			len: 0,
			objectId: { type: 0, instance: 0 },
			property: {
				id: 0,
				index: ASN1_ARRAY_ALL,
			},
			values: [],
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
		value.property.id = decodedValue.value

		if (
			len < apduLen &&
			baAsn1.decodeIsContextTag(buffer, offset + len, 2)
		) {
			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			len += result.len
			decodedValue = baAsn1.decodeUnsigned(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			value.property.index = decodedValue.value
		}

		if (!baAsn1.decodeIsOpeningTagNumber(buffer, offset + len, 3))
			return undefined
		len++

		const values: BACNetAppData[] = []
		while (apduLen - len > 1) {
			result = baAsn1.bacappDecodeApplicationData(
				buffer,
				offset + len,
				apduLen + offset,
				value.objectId.type,
				value.property.id,
			)
			if (!result) return undefined
			len += result.len
			delete result.len
			values.push(result)
		}

		value.values = values
		if (!baAsn1.decodeIsClosingTagNumber(buffer, offset + len, 3))
			return undefined
		len++
		value.len = len
		return value
	}

	public static encodeAcknowledge(...args: any[]): void {
		throw new Error(
			'AddListElement does not support acknowledge operations',
		)
	}

	public static decodeAcknowledge(
		buffer: Buffer,
		offset: number,
		apduLen: number,
	): any {
		throw new Error(
			'AddListElement does not support acknowledge operations',
		)
	}
}
