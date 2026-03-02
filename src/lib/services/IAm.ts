/**
 * The iAm event represents the response to a whoIs request to detect all
 * devices in a BACNET network.
 *
 * @event BACnetClient.iAm
 *
 * @example
 * import BACnetClient from "@bacnet-js/client";
 *
 * const client = new BACnetClient();
 *
 * client.on('iAm', (msg) => {
 *   console.log(
 *     'address: ', msg.header.address,
 *     ' - deviceId: ', msg.payload.deviceId,
 *     ' - maxApdu: ', msg.payload.maxApdu,
 *     ' - segmentation: ', msg.payload.segmentation,
 *     ' - vendorId: ', msg.payload.vendorId
 *   );
 * });
 */

import { EncodeBuffer } from '../types'
import * as baAsn1 from '../asn1'
import { ObjectType, ApplicationTag, Segmentation } from '../enum'
import { BacnetService } from './AbstractServices'

export default class IAm extends BacnetService {
	public static encode(
		buffer: EncodeBuffer,
		deviceId: number,
		maxApdu: number,
		segmentation: number,
		vendorId: number,
	) {
		baAsn1.encodeApplicationObjectId(buffer, ObjectType.DEVICE, deviceId)
		baAsn1.encodeApplicationUnsigned(buffer, maxApdu)
		baAsn1.encodeApplicationEnumerated(buffer, segmentation)
		baAsn1.encodeApplicationUnsigned(buffer, vendorId)
	}

	public static decode(buffer: Buffer, offset: number) {
		let result: any
		let apduLen = 0
		const orgOffset = offset
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + apduLen)
		apduLen += result.len
		if (result.tagNumber !== ApplicationTag.OBJECTIDENTIFIER)
			return undefined
		result = baAsn1.decodeObjectId(buffer, offset + apduLen)
		apduLen += result.len
		if (result.objectType !== ObjectType.DEVICE) return undefined
		const deviceId = result.instance
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + apduLen)
		apduLen += result.len
		if (result.tagNumber !== ApplicationTag.UNSIGNED_INTEGER)
			return undefined
		result = baAsn1.decodeUnsigned(buffer, offset + apduLen, result.value)
		apduLen += result.len
		const maxApdu = result.value
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + apduLen)
		apduLen += result.len
		if (result.tagNumber !== ApplicationTag.ENUMERATED) return undefined
		result = baAsn1.decodeEnumerated(buffer, offset + apduLen, result.value)
		apduLen += result.len
		if (result.value > Segmentation.NO_SEGMENTATION) return undefined
		const segmentation = result.value
		result = baAsn1.decodeTagNumberAndValue(buffer, offset + apduLen)
		apduLen += result.len
		if (result.tagNumber !== ApplicationTag.UNSIGNED_INTEGER)
			return undefined
		result = baAsn1.decodeUnsigned(buffer, offset + apduLen, result.value)
		apduLen += result.len
		if (result.value > 0xffff) return undefined
		const vendorId = result.value
		return {
			len: apduLen + (offset - orgOffset),
			deviceId,
			maxApdu,
			segmentation,
			vendorId,
		}
	}
}
