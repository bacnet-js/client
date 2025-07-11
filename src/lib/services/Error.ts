import * as baAsn1 from '../asn1'
import { ErrorClass, ErrorCode } from '../enum'
import { EncodeBuffer } from '../types'
import { BacnetService } from './AbstractServices'

export default class ErrorService extends BacnetService {
	public static encode(
		buffer: EncodeBuffer,
		errorClass: number,
		errorCode: number,
	): void {
		baAsn1.encodeApplicationEnumerated(buffer, errorClass)
		baAsn1.encodeApplicationEnumerated(buffer, errorCode)
	}

	public static decode(buffer: Buffer, offset: number) {
		const orgOffset = offset
		let result: any

		result = baAsn1.decodeTagNumberAndValue(buffer, offset)
		offset += result.len
		const errorClass = baAsn1.decodeEnumerated(buffer, offset, result.value)
		offset += errorClass.len

		result = baAsn1.decodeTagNumberAndValue(buffer, offset)
		offset += result.len
		const errorCode = baAsn1.decodeEnumerated(buffer, offset, result.value)
		offset += errorClass.len

		return {
			len: offset - orgOffset,
			class: errorClass.value,
			code: errorCode.value,
		}
	}

	public static buildMessage(result: {
		class: number
		code: number
	}): string {
		return (
			`BacnetError Class: ${ErrorClass[result.class]} ` +
			`(${result.class}) ` +
			`Code: ${ErrorCode[result.code]} (${result.code})`
		)
	}
}
