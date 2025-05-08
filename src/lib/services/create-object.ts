import * as baAsn1 from '../asn1'
import { ASN1_ARRAY_ALL, ASN1_NO_PRIORITY } from '../enum'

import { EncodeBuffer, BACNetObjectID } from '../types'

export const encode = (
	buffer: EncodeBuffer,
	objectId: BACNetObjectID,
	values: any[],
): void => {
	baAsn1.encodeOpeningTag(buffer, 0)
	baAsn1.encodeContextObjectId(buffer, 1, objectId.type, objectId.instance)
	baAsn1.encodeClosingTag(buffer, 0)
	baAsn1.encodeOpeningTag(buffer, 1)
	values.forEach((propertyValue) => {
		baAsn1.encodeContextEnumerated(buffer, 0, propertyValue.property.id)
		if (propertyValue.property.index !== ASN1_ARRAY_ALL) {
			baAsn1.encodeContextUnsigned(
				buffer,
				1,
				propertyValue.property.index,
			)
		}
		baAsn1.encodeOpeningTag(buffer, 2)
		propertyValue.value.forEach((value: any) => {
			baAsn1.bacappEncodeApplicationData(buffer, value)
		})
		baAsn1.encodeClosingTag(buffer, 2)
		if (propertyValue.priority !== ASN1_NO_PRIORITY) {
			baAsn1.encodeContextUnsigned(buffer, 3, propertyValue.priority)
		}
	})
	baAsn1.encodeClosingTag(buffer, 1)
}

export const decode = (buffer: Buffer, offset: number, apduLen: number) => {
	let len = 0
	let result: any
	let decodedValue: any
	let objectId: BACNetObjectID
	const valueList = []

	result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
	len += result.len

	if (result.tagNumber === 0 && apduLen > len) {
		apduLen -= len
		if (apduLen < 4) return undefined
		decodedValue = baAsn1.decodeContextObjectId(buffer, offset + len, 1)
		len += decodedValue.len
		objectId = {
			type: decodedValue.objectType,
			instance: decodedValue.instance,
		}
	} else {
		return undefined
	}

	if (baAsn1.decodeIsClosingTag(buffer, offset + len)) {
		len++
	}

	if (!baAsn1.decodeIsOpeningTagNumber(buffer, offset + len, 1))
		return undefined
	len++

	while (apduLen - len > 1) {
		const newEntry: any = {}
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len

		if (result.tagNumber !== 0) return undefined
		decodedValue = baAsn1.decodeEnumerated(
			buffer,
			offset + len,
			result.value,
		)
		len += decodedValue.len
		const propertyId = decodedValue.value

		let arraIndex = ASN1_ARRAY_ALL
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len

		if (result.tagNumber === 1) {
			decodedValue = baAsn1.decodeUnsigned(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			arraIndex += decodedValue.value
			result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
			len += result.len
		}

		newEntry.property = { id: propertyId, index: arraIndex }

		if (
			result.tagNumber === 2 &&
			baAsn1.decodeIsOpeningTag(buffer, offset + len - 1)
		) {
			const values = []

			while (!baAsn1.decodeIsClosingTag(buffer, offset + len)) {
				decodedValue = baAsn1.bacappDecodeApplicationData(
					buffer,
					offset + len,
					apduLen + offset,
					objectId.type,
					propertyId,
				)
				if (!decodedValue) return undefined
				len += decodedValue.len
				delete decodedValue.len
				values.push(decodedValue)
			}

			len++
			newEntry.value = values
		} else {
			return undefined
		}

		valueList.push(newEntry)
	}

	if (!baAsn1.decodeIsClosingTagNumber(buffer, offset + len, 1))
		return undefined
	len++

	return {
		len,
		objectId,
		values: valueList,
	}
}

export const encodeAcknowledge = (
	buffer: EncodeBuffer,
	objectId: BACNetObjectID,
): void => {
	baAsn1.encodeApplicationObjectId(buffer, objectId.type, objectId.instance)
}
