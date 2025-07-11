import * as baAsn1 from '../asn1'
import { ASN1_ARRAY_ALL, ReadRangeType } from '../enum'
import {
	EncodeBuffer,
	BACNetObjectID,
	BACNetBitString,
	ReadRangeAcknowledge,
} from '../types'
import { BacnetAckService } from './AbstractServices'

export default class ReadRange extends BacnetAckService {
	public static encode(
		buffer: EncodeBuffer,
		objectId: BACNetObjectID,
		propertyId: number,
		arrayIndex: number,
		requestType: number,
		position: number,
		time: Date,
		count: number,
	) {
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
		switch (requestType) {
			case ReadRangeType.BY_POSITION:
				baAsn1.encodeOpeningTag(buffer, 3)
				baAsn1.encodeApplicationUnsigned(buffer, position)
				baAsn1.encodeApplicationSigned(buffer, count)
				baAsn1.encodeClosingTag(buffer, 3)
				break
			case ReadRangeType.BY_SEQUENCE_NUMBER:
				baAsn1.encodeOpeningTag(buffer, 6)
				baAsn1.encodeApplicationUnsigned(buffer, position)
				baAsn1.encodeApplicationSigned(buffer, count)
				baAsn1.encodeClosingTag(buffer, 6)
				break
			case ReadRangeType.BY_TIME_REFERENCE_TIME_COUNT:
				baAsn1.encodeOpeningTag(buffer, 7)
				baAsn1.encodeApplicationDate(buffer, time)
				baAsn1.encodeApplicationTime(buffer, time)
				baAsn1.encodeApplicationSigned(buffer, count)
				baAsn1.encodeClosingTag(buffer, 7)
				break
			default:
				break
		}
	}

	public static decode(buffer: Buffer, offset: number, apduLen: number) {
		let len = 0
		let result: any
		let decodedValue: any
		let requestType: number
		let position: number
		let time: Date
		let count: number
		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 0))
			return undefined
		len++
		decodedValue = baAsn1.decodeObjectId(buffer, offset + len)
		len += decodedValue.len
		const objectId = {
			type: decodedValue.objectType,
			instance: decodedValue.instance,
		}
		const property: any = {}
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		if (result.tagNumber !== 1) return undefined
		decodedValue = baAsn1.decodeEnumerated(
			buffer,
			offset + len,
			result.value,
		)
		len += decodedValue.len
		property.id = decodedValue.value
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
			property.index = decodedValue.value
		} else {
			property.index = ASN1_ARRAY_ALL
		}
		if (len < apduLen) {
			result = baAsn1.decodeTagNumber(buffer, offset + len)
			len += result.len
			switch (result.tagNumber) {
				case 3: {
					requestType = ReadRangeType.BY_POSITION
					result = baAsn1.decodeTagNumberAndValue(
						buffer,
						offset + len,
					)
					len += result.len
					decodedValue = baAsn1.decodeUnsigned(
						buffer,
						offset + len,
						result.value,
					)
					len += decodedValue.len
					position = decodedValue.value
					result = baAsn1.decodeTagNumberAndValue(
						buffer,
						offset + len,
					)
					len += result.len
					decodedValue = baAsn1.decodeSigned(
						buffer,
						offset + len,
						result.value,
					)
					len += decodedValue.len
					count = decodedValue.value
					break
				}
				case 6: {
					requestType = ReadRangeType.BY_SEQUENCE_NUMBER
					result = baAsn1.decodeTagNumberAndValue(
						buffer,
						offset + len,
					)
					len += result.len
					decodedValue = baAsn1.decodeUnsigned(
						buffer,
						offset + len,
						result.value,
					)
					len += decodedValue.len
					position = decodedValue.value
					result = baAsn1.decodeTagNumberAndValue(
						buffer,
						offset + len,
					)
					len += result.len
					decodedValue = baAsn1.decodeSigned(
						buffer,
						offset + len,
						result.value,
					)
					len += decodedValue.len
					count = decodedValue.value
					break
				}
				case 7: {
					requestType = ReadRangeType.BY_TIME_REFERENCE_TIME_COUNT
					decodedValue = baAsn1.decodeApplicationDate(
						buffer,
						offset + len,
					)
					len += decodedValue.len
					const tmpDate = decodedValue.value
					decodedValue = baAsn1.decodeApplicationTime(
						buffer,
						offset + len,
					)
					len += decodedValue.len
					const tmpTime = decodedValue.value
					time = new Date(
						tmpDate.getYear(),
						tmpDate.getMonth(),
						tmpDate.getDate(),
						tmpTime.getHours(),
						tmpTime.getMinutes(),
						tmpTime.getSeconds(),
						tmpTime.getMilliseconds(),
					)
					result = baAsn1.decodeTagNumberAndValue(
						buffer,
						offset + len,
					)
					len += result.len
					decodedValue = baAsn1.decodeSigned(
						buffer,
						offset + len,
						result.value,
					)
					len += decodedValue.len
					count = decodedValue.value
					break
				}
				default:
					return undefined
			}
			result = baAsn1.decodeTagNumber(buffer, offset + len)
			len += result.len
		}
		return {
			len,
			objectId,
			property,
			requestType,
			position,
			time,
			count,
		}
	}

	public static encodeAcknowledge(
		buffer: EncodeBuffer,
		objectId: BACNetObjectID,
		propertyId: number,
		arrayIndex: number,
		resultFlags: BACNetBitString,
		itemCount: number,
		applicationData: Buffer,
		requestType: number,
		firstSequence: number,
	) {
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
		baAsn1.encodeContextBitstring(buffer, 3, resultFlags)
		baAsn1.encodeContextUnsigned(buffer, 4, itemCount)
		baAsn1.encodeOpeningTag(buffer, 5)
		if (itemCount !== 0) {
			applicationData.copy(
				buffer.buffer,
				buffer.offset,
				0,
				applicationData.length,
			)
			buffer.offset += applicationData.length
		}
		baAsn1.encodeClosingTag(buffer, 5)
		if (
			itemCount !== 0 &&
			requestType &&
			requestType !== ReadRangeType.BY_POSITION
		) {
			baAsn1.encodeContextUnsigned(buffer, 6, firstSequence)
		}
	}

	public static decodeAcknowledge(
		buffer: Buffer,
		offset: number,
		apduLen: number,
	): ReadRangeAcknowledge {
		let len = 0
		let result: any
		let decodedValue: any
		if (!baAsn1.decodeIsContextTag(buffer, offset + len, 0))
			return undefined
		len++
		decodedValue = baAsn1.decodeObjectId(buffer, offset + len)
		len += decodedValue.len
		const objectId = {
			type: decodedValue.objectType,
			instance: decodedValue.instance,
		}
		const property: any = { index: ASN1_ARRAY_ALL }
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		if (result.tagNumber !== 1) return undefined
		decodedValue = baAsn1.decodeEnumerated(
			buffer,
			offset + len,
			result.value,
		)
		len += decodedValue.len
		property.id = decodedValue.value
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		if (result.tagNumber === 2 && len < apduLen) {
			len += result.len
			decodedValue = baAsn1.decodeUnsigned(
				buffer,
				offset + len,
				result.value,
			)
			len += decodedValue.len
			property.index = decodedValue.value
		}
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeBitstring(
			buffer,
			offset + len,
			result.value,
		)
		len += decodedValue.len
		const resultFlag = decodedValue.value
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + len)
		len += result.len
		decodedValue = baAsn1.decodeUnsigned(buffer, offset + len, result.value)
		len += decodedValue.len
		const itemCount = decodedValue.value
		if (!baAsn1.decodeIsOpeningTag(buffer, offset + len)) return undefined
		len++
		const rangeBuffer = buffer.slice(offset + len, apduLen - 3)
		return {
			objectId,
			property,
			resultFlag,
			itemCount,
			rangeBuffer,
			len,
		}
	}
}
