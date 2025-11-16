/**
 * This script will discover all devices in the network and read out all
 * properties and deliver a JSON as device description.
 * 
 * CAUTION: propSubSet is a very large list of items that it grabs and over 
 * 	MSTP it may take too long to grab them all, causing a timeout, especially
 *  if the device does not support Read Prop Multiple.  If using MSTP then you 
 *  may want to shorten that list, or not grab OBJECT_LIST as grabbing this 
 *  will cause the demo to grab properties for all objects on the device (without
 *  OBJECT_LIST it will only grab the device object).
 *
 * If a deviceId is given as first parameter then only this device is discovered
 */

import Bacnet, {
	ApplicationTag,
	BACNetObjectID,
	BACNetPropertyID,
	BACNetReadAccessSpecification,
	BinaryLightingPV,
	BinaryPV,
	DeviceStatus,
	EngineeringUnits,
	ErrorClass,
	ErrorCode,
	EventState,
	EventTransitionBits,
	FileAccessMethod,
	getEnumName,
	LifeSafetyMode,
	LifeSafetyOperation,
	LifeSafetyState,
	LimitEnable,
	LoggingType,
	NodeType,
	NotifyType,
	ObjectType,
	ObjectTypesSupported,
	Polarity,
	PropertyIdentifier,
	Reliability,
	Segmentation,
	ServicesSupported,
	ShedState,
	StatusFlags,
	BACnetMessage,
	DeviceObjectResult,
	PropertyResult,
	getEnumValues,
	BACNetAddress,
} from '../src'
import * as process from 'process'

// Map the Property types to their enums/bitstrings
const PropertyIdentifierToEnumMap: Record<number, any> = {}
PropertyIdentifierToEnumMap[PropertyIdentifier.OBJECT_TYPE] = ObjectType
PropertyIdentifierToEnumMap[PropertyIdentifier.SEGMENTATION_SUPPORTED] =
	Segmentation
PropertyIdentifierToEnumMap[PropertyIdentifier.EVENT_STATE] = EventState
PropertyIdentifierToEnumMap[PropertyIdentifier.UNITS] = EngineeringUnits
PropertyIdentifierToEnumMap[PropertyIdentifier.RELIABILITY] = Reliability
PropertyIdentifierToEnumMap[PropertyIdentifier.NOTIFY_TYPE] = NotifyType
PropertyIdentifierToEnumMap[PropertyIdentifier.POLARITY] = Polarity
PropertyIdentifierToEnumMap[PropertyIdentifier.PROTOCOL_SERVICES_SUPPORTED] =
	ServicesSupported
PropertyIdentifierToEnumMap[
	PropertyIdentifier.PROTOCOL_OBJECT_TYPES_SUPPORTED
] = ObjectTypesSupported
PropertyIdentifierToEnumMap[PropertyIdentifier.STATUS_FLAGS] = StatusFlags
PropertyIdentifierToEnumMap[PropertyIdentifier.LIMIT_ENABLE] = LimitEnable
PropertyIdentifierToEnumMap[PropertyIdentifier.EVENT_ENABLE] =
	EventTransitionBits
PropertyIdentifierToEnumMap[PropertyIdentifier.ACKED_TRANSITIONS] =
	EventTransitionBits
PropertyIdentifierToEnumMap[PropertyIdentifier.SYSTEM_STATUS] = DeviceStatus
PropertyIdentifierToEnumMap[PropertyIdentifier.SYSTEM_STATUS] = DeviceStatus
PropertyIdentifierToEnumMap[PropertyIdentifier.ACK_REQUIRED] =
	EventTransitionBits
PropertyIdentifierToEnumMap[PropertyIdentifier.LOGGING_TYPE] = LoggingType
PropertyIdentifierToEnumMap[PropertyIdentifier.FILE_ACCESS_METHOD] =
	FileAccessMethod
PropertyIdentifierToEnumMap[PropertyIdentifier.NODE_TYPE] = NodeType

// Sometimes the Map needs to be more specific
const ObjectTypeSpecificPropertyIdentifierToEnumMap: Record<
	number,
	Record<number, any>
> = {}

ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.BINARY_INPUT] = {}
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.BINARY_INPUT][
	PropertyIdentifier.PRESENT_VALUE
] = BinaryPV
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.BINARY_INPUT][
	PropertyIdentifier.MODE
] = BinaryPV

ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.ANALOG_INPUT] = {}
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.ANALOG_INPUT][
	PropertyIdentifier.PRESENT_VALUE
] = BinaryPV //????

ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.ANALOG_OUTPUT] = {}
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.ANALOG_OUTPUT][
	PropertyIdentifier.PRESENT_VALUE
] = BinaryPV //????

ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.BINARY_OUTPUT] = {}
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.BINARY_OUTPUT][
	PropertyIdentifier.PRESENT_VALUE
] = BinaryPV
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.BINARY_OUTPUT][
	PropertyIdentifier.RELINQUISH_DEFAULT
] = BinaryPV

ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.BINARY_VALUE] = {}
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.BINARY_VALUE][
	PropertyIdentifier.PRESENT_VALUE
] = BinaryPV
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.BINARY_VALUE][
	PropertyIdentifier.RELINQUISH_DEFAULT
] = BinaryPV

ObjectTypeSpecificPropertyIdentifierToEnumMap[
	ObjectType.BINARY_LIGHTING_OUTPUT
] = {}
ObjectTypeSpecificPropertyIdentifierToEnumMap[
	ObjectType.BINARY_LIGHTING_OUTPUT
][PropertyIdentifier.PRESENT_VALUE] = BinaryLightingPV

ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.BITSTRING_VALUE] = {}
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.BITSTRING_VALUE][
	PropertyIdentifier.PRESENT_VALUE
] = BinaryPV // ???

ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LIFE_SAFETY_POINT] = {}
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LIFE_SAFETY_POINT][
	PropertyIdentifier.PRESENT_VALUE
] = LifeSafetyState
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LIFE_SAFETY_POINT][
	PropertyIdentifier.TRACKING_VALUE
] = LifeSafetyState
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LIFE_SAFETY_POINT][
	PropertyIdentifier.MODE
] = LifeSafetyMode
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LIFE_SAFETY_POINT][
	PropertyIdentifier.ACCEPTED_MODES
] = LifeSafetyMode
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LIFE_SAFETY_POINT][
	PropertyIdentifier.SILENCED
] = LifeSafetyState
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LIFE_SAFETY_POINT][
	PropertyIdentifier.OPERATION_EXPECTED
] = LifeSafetyOperation

ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LIFE_SAFETY_ZONE] = {}
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LIFE_SAFETY_ZONE][
	PropertyIdentifier.PRESENT_VALUE
] = LifeSafetyState
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LIFE_SAFETY_ZONE][
	PropertyIdentifier.MODE
] = LifeSafetyMode

ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LOAD_CONTROL] = {}
ObjectTypeSpecificPropertyIdentifierToEnumMap[ObjectType.LOAD_CONTROL][
	PropertyIdentifier.PRESENT_VALUE
] = ShedState

// For Objects we read out All properties if cli parameter --all is provided
const propSubSet: PropertyIdentifier[] = process.argv.includes('--all')
	? getEnumValues(PropertyIdentifier)
	: [
			/* normally supported from all devices */
			PropertyIdentifier.OBJECT_IDENTIFIER,
			PropertyIdentifier.OBJECT_NAME,
			PropertyIdentifier.OBJECT_TYPE,
			PropertyIdentifier.PRESENT_VALUE,
			PropertyIdentifier.STATUS_FLAGS,
			PropertyIdentifier.EVENT_STATE,
			PropertyIdentifier.RELIABILITY,
			PropertyIdentifier.OUT_OF_SERVICE,
			PropertyIdentifier.UNITS,
			/* other properties */
			PropertyIdentifier.DESCRIPTION,
			PropertyIdentifier.SYSTEM_STATUS,
			PropertyIdentifier.VENDOR_NAME,
			PropertyIdentifier.VENDOR_IDENTIFIER,
			PropertyIdentifier.MODEL_NAME,
			PropertyIdentifier.FIRMWARE_REVISION,
			PropertyIdentifier.APPLICATION_SOFTWARE_VERSION,
			PropertyIdentifier.LOCATION,
			PropertyIdentifier.LOCAL_DATE,
			PropertyIdentifier.LOCAL_TIME,
			PropertyIdentifier.UTC_OFFSET,
			PropertyIdentifier.DAYLIGHT_SAVINGS_STATUS,
			PropertyIdentifier.PROTOCOL_VERSION,
			PropertyIdentifier.PROTOCOL_REVISION,
			PropertyIdentifier.PROTOCOL_SERVICES_SUPPORTED,
			PropertyIdentifier.PROTOCOL_OBJECT_TYPES_SUPPORTED,
			PropertyIdentifier.OBJECT_LIST,
			PropertyIdentifier.MAX_APDU_LENGTH_ACCEPTED,
			PropertyIdentifier.SEGMENTATION_SUPPORTED,
			PropertyIdentifier.APDU_TIMEOUT,
			PropertyIdentifier.NUMBER_OF_APDU_RETRIES,
			PropertyIdentifier.DEVICE_ADDRESS_BINDING,
			PropertyIdentifier.DATABASE_REVISION,
			PropertyIdentifier.MAX_INFO_FRAMES,
			PropertyIdentifier.MAX_MASTER,
			PropertyIdentifier.ACTIVE_COV_SUBSCRIPTIONS,
			PropertyIdentifier.ACTIVE_COV_MULTIPLE_SUBSCRIPTIONS,
		]

const debug = process.argv.includes('--debug')

/**
 * Retrieve all properties manually because ReadPropertyMultiple is not available
 */
function getAllPropertiesManually(
	address: BACNetAddress,
	objectId: BACNetObjectID,
	callback: (result: DeviceObjectResult) => void,
	propList?: number[],
	result?: PropertyResult[],
): void {
	if (!propList) {
		propList = propSubSet.map((x) => x) // Clone the array
	}
	if (!result) {
		result = []
	}
	if (!propList.length) {
		return callback({
			values: [
				{
					objectId,
					values: result,
				},
			],
		})
	}

	const prop = propList.shift()
	if (prop === undefined) {
		return getAllPropertiesManually(
			address,
			objectId,
			callback,
			propList,
			result,
		)
	}

	if (debug)console.log("Read single prop " + prop);

	// Read only object-list property
	bacnetClient.readProperty(
		address,
		objectId,
		prop,
		{}
	).then
	(
		function(value) 
		{
			if (value) {	// Options object
				if (debug) console.log(`Handle value ${prop}: `, JSON.stringify(value))

				const objRes: PropertyResult = {
					id: value.property.id,
					index: value.property.index,
					value: value.values,
				}
				result.push(objRes)
			} else {
				if (debug) console.log(`NULL device ${JSON.stringify(objectId)} ${JSON.stringify(address)} do not contain object ${getEnumName(PropertyIdentifier, prop)}`);
			}
			getAllPropertiesManually(
				address,
				objectId,
				callback,
				propList,
				result,
			)
		},
		function(err) 
		{
			if (debug) console.log(`ERR ${err} device ${JSON.stringify(objectId)} ${JSON.stringify(address)} do not contain object ${getEnumName(PropertyIdentifier, prop)}`);
			getAllPropertiesManually(
				address,
				objectId,
				callback,
				propList,
				result,
			)
		}
	)
}

/**
 * Reads ou one bit out of an buffer
 * @returns {number}
 */
function readBit(buffer: Buffer | number[], i: number, bit: number): number {
	return (buffer[i] >> bit) % 2
}

/**
 * sets a bit in a buffer
 */
function setBit(
	buffer: Buffer | number[],
	i: number,
	bit: number,
	value: number,
): void {
	if (value === 0) {
		buffer[i] &= ~(1 << bit)
	} else {
		buffer[i] |= 1 << bit
	}
}

/**
 * Parses a Bitstring and returns array with all true values
 * @returns {[]}
 */
function handleBitString(
	buffer: Buffer | number[],
	bitsUsed: number,
	usedEnum: any,
): string[] {
	const res: string[] = []
	for (let i = 0; i < bitsUsed; i++) {
		const bufferIndex = Math.floor(i / 8)
		if (readBit(buffer, bufferIndex, i % 8)) {
			if (usedEnum) {
				try {
					const enumName = getEnumName(usedEnum, i)
					if (enumName) {
						res.push(enumName)
					} else {
						res.push(i.toString())
					}
				} catch (error) {
					res.push(i.toString())
				}
			} else {
				res.push(i.toString())
			}
		}
	}
	return res
}

/**
 * Parses a property value
 */
function parseValue(
	address: BACNetAddress,
	objId: number,
	parentType: number,
	value: any,
	supportsMultiple: boolean,
	callback: (result: any) => void,
): void {
	let resValue: any = null
	if (
		value &&
		value.type &&
		value.value !== null &&
		value.value !== undefined
	) {
		switch (value.type) {
			case ApplicationTag.NULL:
				// should be null already, but set again
				resValue = null
				break
			case ApplicationTag.BOOLEAN:
				// convert number to a real boolean
				resValue = !!value.value
				break
			case ApplicationTag.UNSIGNED_INTEGER:
			case ApplicationTag.SIGNED_INTEGER:
			case ApplicationTag.REAL:
			case ApplicationTag.DOUBLE:
			case ApplicationTag.CHARACTER_STRING:
				// datatype should be correct already
				resValue = value.value
				break
			case ApplicationTag.DATE:
			case ApplicationTag.TIME:
			case ApplicationTag.TIMESTAMP:
				// datatype should be Date too
				// Javascript do not have date/timestamp only
				resValue = value.value
				break
			case ApplicationTag.BIT_STRING:
				// handle bitstrings specific and more generic
				if (
					ObjectTypeSpecificPropertyIdentifierToEnumMap[parentType] &&
					ObjectTypeSpecificPropertyIdentifierToEnumMap[parentType][
						objId
					]
				) {
					resValue = handleBitString(
						value.value.value,
						value.value.bitsUsed,
						ObjectTypeSpecificPropertyIdentifierToEnumMap[
							parentType
						][objId],
					)
				} else if (PropertyIdentifierToEnumMap[objId]) {
					resValue = handleBitString(
						value.value.value,
						value.value.bitsUsed,
						PropertyIdentifierToEnumMap[objId],
					)
				} else {
					if (parentType !== ObjectType.BITSTRING_VALUE) {
						console.log(
							`Unknown value for BIT_STRING type for objId ${getEnumName(PropertyIdentifier, objId)} and parent type ${getEnumName(ObjectType, parentType)}`,
						)
					}
					resValue = value.value
				}
				break
			case ApplicationTag.ENUMERATED:
				// handle enumerations specific and more generic
				if (
					ObjectTypeSpecificPropertyIdentifierToEnumMap[parentType] &&
					ObjectTypeSpecificPropertyIdentifierToEnumMap[parentType][
						objId
					]
				) {
					resValue = getEnumName(
						ObjectTypeSpecificPropertyIdentifierToEnumMap[
							parentType
						][objId],
						value.value,
					)
				} else if (PropertyIdentifierToEnumMap[objId]) {
					resValue = getEnumName(
						PropertyIdentifierToEnumMap[objId],
						value.value,
					)
				} else {
					console.log(
						`Unknown value for ENUMERATED type for objId ${getEnumName(PropertyIdentifier, objId)} and parent type ${getEnumName(ObjectType, parentType)}`,
					)
					resValue = value.value
				}
				break
			case ApplicationTag.OBJECTIDENTIFIER:
				// Look up object identifiers
				// Some object identifiers should not be looked up because we end in loops else
				if (
					objId === PropertyIdentifier.OBJECT_IDENTIFIER ||
					objId === PropertyIdentifier.STRUCTURED_OBJECT_LIST ||
					objId === PropertyIdentifier.SUBORDINATE_LIST
				) {
					resValue = value.value
				} else if (supportsMultiple) {
					const requestArray = [
						{
							objectId: value.value,
							properties: [{ id: 8, index: 0 }],
						},
					]
					bacnetClient.readPropertyMultiple(
						address,
						requestArray
					).then
					(
						function(resValue) {
							//console.log(JSON.stringify(value.value) + ': ' + JSON.stringify(resValue));
							parseDeviceObject(
								address,
								resValue,
								value.value,
								true,
								callback,
							)
						},
						function(err) {
						}
					);
					return
				} else {
					getAllPropertiesManually(address, value.value, (result) => {
						parseDeviceObject(
							address,
							result,
							value.value,
							false,
							callback,
						)
					})
					return
				}
				break
			case ApplicationTag.OCTET_STRING:
				// It is kind of binary data??
				resValue = value.value
				break
			case ApplicationTag.ERROR:
				// lookup error class and code
				resValue = {
					errorClass: getEnumName(ErrorClass, value.value.errorClass),
					errorCode: getEnumName(ErrorCode, value.value.errorCode),
				}
				break
			case ApplicationTag.OBJECT_PROPERTY_REFERENCE:
			case ApplicationTag.DEVICE_OBJECT_PROPERTY_REFERENCE:
			case ApplicationTag.DEVICE_OBJECT_REFERENCE:
			case ApplicationTag.READ_ACCESS_SPECIFICATION: //???
				resValue = value.value
				break
			case ApplicationTag.CONTEXT_SPECIFIC_DECODED:
				parseValue(
					address,
					objId,
					parentType,
					value.value,
					supportsMultiple,
					callback,
				)
				return
			case ApplicationTag.READ_ACCESS_RESULT: // ????
				resValue = value.value
				break
			default:
				console.log(
					`unknown type ${value.type}: ${JSON.stringify(value)}`,
				)
				resValue = value
		}
	}

	setImmediate(() => callback(resValue))
}

/**
 * Parse an object structure
 */
function parseDeviceObject(
	address: BACNetAddress,
	obj: DeviceObjectResult | any,
	parent: BACNetObjectID,
	supportsMultiple: boolean,
	callback: (result: Record<string, any>) => void,
): void {
	if (debug) {
		console.log(
			`START parseDeviceObject: ${JSON.stringify(parent)} : ${JSON.stringify(obj)}`,
		)
	}

	if (!obj) {
		console.log('object not valid on parse device object')
		return
	}

	if (!obj.values || !Array.isArray(obj.values)) {
		console.log('No device or invalid response')
		callback({ ERROR: 'No device or invalid response' })
		return
	}

	let cbCount = 0
	const objDefMap = new Map<string, Map<string, any[]>>()

	const finalize = () => {
		const resultObj: Record<string, Record<string, any>> = {}

		objDefMap.forEach((propMap, devIdKey) => {
			const deviceObj: Record<string, any> = {}
			resultObj[devIdKey] = deviceObj

			propMap.forEach((valueArray, propIdKey) => {
				deviceObj[propIdKey] =
					valueArray.length === 1 ? valueArray[0] : valueArray
			})
		})

		if (
			obj.values.length === 1 &&
			obj.values[0]?.objectId?.instance !== undefined
		) {
			const firstDeviceId = String(obj.values[0].objectId.instance)
			if (resultObj[firstDeviceId]) {
				if (debug) {
					console.log(
						`END parseDeviceObject (single device): ${JSON.stringify(parent)} : ${JSON.stringify(resultObj[firstDeviceId])}`,
					)
				}
				callback(resultObj[firstDeviceId])
				return
			}
		}

		if (debug) {
			console.log(
				`END parseDeviceObject (multiple devices): ${JSON.stringify(parent)} : ${JSON.stringify(resultObj)}`,
			)
		}
		callback(resultObj)
	}

	obj.values.forEach((devBaseObj: any) => {
		if (!devBaseObj.objectId) {
			console.log('No device Id found in object data')
			return
		}

		if (
			devBaseObj.objectId.type === undefined ||
			devBaseObj.objectId.instance === undefined
		) {
			console.log('No device type or instance found in object data')
			return
		}

		if (!devBaseObj.values || !Array.isArray(devBaseObj.values)) {
			console.log('No device values response')
			return
		}

		const deviceId = String(devBaseObj.objectId.instance)

		let deviceMap = objDefMap.get(deviceId)
		if (!deviceMap) {
			deviceMap = new Map<string, any[]>()
			objDefMap.set(deviceId, deviceMap)
		}

		devBaseObj.values.forEach((devObj: any) => {
			if (devObj.id === undefined) {
				return
			}

			let objId = getEnumName(PropertyIdentifier, devObj.id)
			if (objId && devObj.index !== 4294967295) {
				objId += `-${devObj.index}`
			}

			if (!objId) {
				console.log('Invalid property identifier:', devObj.id)
				return
			}

			if (debug) {
				console.log(
					'Handle Object property:',
					deviceId,
					objId,
					devObj.value,
				)
			}

			if (!Array.isArray(devObj.value)) {
				console.log('Device object value is not an array:', devObj)
				return
			}

			devObj.value.forEach((val: any) => {
				let propArray = deviceMap.get(objId)
				if (!propArray) {
					propArray = []
					deviceMap.set(objId, propArray)
				}

				if (JSON.stringify(val.value) === JSON.stringify(parent)) {
					propArray.push(val.value)
					return
				}

				cbCount++
				parseValue(
					address,
					devObj.id,
					parent.type,
					val,
					supportsMultiple,
					(parsedValue) => {
						if (debug) {
							console.log(
								'RETURN parsedValue',
								deviceId,
								objId,
								devObj.value,
								parsedValue,
							)
						}

						let deviceMapInCallback = objDefMap.get(deviceId)
						if (!deviceMapInCallback) {
							deviceMapInCallback = new Map<string, any[]>()
							objDefMap.set(deviceId, deviceMapInCallback)
						}

						let propArrayInCallback = deviceMapInCallback.get(objId)
						if (!propArrayInCallback) {
							propArrayInCallback = []
							deviceMapInCallback.set(objId, propArrayInCallback)
						}

						propArrayInCallback.push(parsedValue)
						if (!--cbCount) {
							finalize()
						}
					},
				)
			})
		})
	})

	if (cbCount === 0) {
		finalize()
	}
}

let objectsDone = 0
/**
 * Print result info object
 */
function printResultObject(deviceId: number, obj: Record<string, any>): void {
	objectsDone++
	console.log(
		`Device ${deviceId} (${objectsDone}/${Object.keys(knownDevices).length}) read successfully ...`,
	)
	console.log(JSON.stringify(obj))
	console.log()
	console.log()
}

let limitToDevice: number | null = null
if (process.argv.length === 3) {
	limitToDevice = parseInt(process.argv[2])
	if (isNaN(limitToDevice)) {
		limitToDevice = null
	}
}

// create instance of Bacnet
const bacnetClient = new Bacnet({ apduTimeout: 4000, interface: '0.0.0.0' })

// emitted for each new message
bacnetClient.on('message', (msg: BACnetMessage, rinfo: string) => {
	console.log(msg)
	if (rinfo) console.log(rinfo)
})

// emitted on errors
bacnetClient.on('error', (err: Error) => {
	console.error(err)
	bacnetClient.close()
})

// emmitted when Bacnet server listens for incoming UDP packages
bacnetClient.on('listening', () => {
	console.log(`sent whoIs ${Date.now()}`)
	// discover devices once we are listening
	bacnetClient.whoIs({net: 0xffff})

	setTimeout(() => {
		bacnetClient.close()
		console.log(`closed transport ${Date.now()}`)
	}, 30000)
})

const knownDevices: number[] = []

// emitted when a new device is discovered in the network
bacnetClient.on('iAm', (device) => {
	// Make sure device has the expected structure
	if (!device.header || !device.payload) {
		console.log('Received invalid device information')
		return
	}

	// address object of discovered device,
	// just use in subsequent calls that are directed to this device
	const address = device.header.sender

	//discovered device ID
	const deviceId = device.payload.deviceId
	if (knownDevices.includes(deviceId)) return
	if (limitToDevice !== null && limitToDevice !== deviceId) return

	console.log(`Found Device ${deviceId} on ${JSON.stringify(address)}`)
	knownDevices.push(deviceId)

	const propertyList: BACNetPropertyID[] = []
	propSubSet.forEach((item) => {
		propertyList.push({ id: item, index: 4294967295 })
	})

	const requestArray: BACNetReadAccessSpecification[] = [
		{
			objectId: { type: 8, instance: deviceId },
			properties: propertyList,
		},
	]

	bacnetClient.readPropertyMultiple(address, requestArray).then
	(
  		function(value)
		{
			console.log(deviceId, 'ReadPropertyMultiple supported ...')
			parseDeviceObject(
				address,
				value,
				{ type: 8, instance: deviceId },
				true,
				(res) => printResultObject(deviceId, res),
			)
		},
  		function(err)
		{
			console.log(
				deviceId,
				address,
				'No ReadPropertyMultiple supported:',
				err.message,
			)
			getAllPropertiesManually(
				address,
				{ type: 8, instance: deviceId },
				(result) => {
					parseDeviceObject(
						address,
						result,
						{ type: 8, instance: deviceId },
						false,
						(res) => printResultObject(deviceId, res),
					)
				},
			)
		}
	)
})
