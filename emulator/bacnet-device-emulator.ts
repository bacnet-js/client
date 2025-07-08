import debugLib from 'debug'
import BACnetClient from '../src/lib/client'
import { BACnetClientEvents } from '../src/lib/EventTypes'
import {
	Segmentation,
	ConfirmedServiceChoice,
	ErrorClass,
	ErrorCode,
	ObjectType,
	PropertyIdentifier,
	BACNetAppData,
	BACnetMessageHeader,
	BACNetObjectID,
} from '../src'

const debug = debugLib('bacnet:device:debug')

type DataStoreEntry = {
	[propertyId in PropertyIdentifier]?: BACNetAppData[]
}

type DataStoreKey = `${ObjectType}:${number}` // <objectType>:<objectInstance>

type DataStore = Record<DataStoreKey, DataStoreEntry>

const settings = {
	deviceId: 1234,
	vendorId: 260,
	maxApdu: 1482,
}

const client = new BACnetClient()

const dataStore: DataStore = {
	'1:0': {
		75: [
			{
				value: { type: 1, instance: 0 },
				type: 12,
			},
		], // PROP_OBJECT_IDENTIFIER
		77: [{ value: 'Analog Output 0', type: 7 }], // PROP_OBJECT_NAME
		79: [{ value: 1, type: 9 }], // PROP_OBJECT_TYPE
		85: [{ value: 5, type: 4 }], // PROP_PRESENT_VALUE
	},
	'1:2': {
		75: [{ value: { type: 1, instance: 2 }, type: 12 }], // PROP_OBJECT_IDENTIFIER
		77: [{ value: 'ANALOG OUTPUT 2', type: 7 }], // PROP_OBJECT_NAME
		79: [{ value: 1, type: 9 }], // PROP_OBJECT_TYPE
		85: [{ value: 5, type: 4 }], // PROP_PRESENT_VALUE
	},
	'5:2': {
		75: [{ value: { type: 5, instance: 2 }, type: 12 }], // PROP_OBJECT_IDENTIFIER
		77: [{ value: 'Binary Value 2', type: 7 }], // PROP_OBJECT_NAME
		79: [{ value: 5, type: 9 }], // PROP_OBJECT_TYPE
		85: [{ value: 0, type: 1 }], // PROP_PRESENT_VALUE
	},
	'8:1234': {
		28: [{ value: 'Test Device #1234', type: 7 }], // PROP_DESCRIPTION
		75: [{ value: { type: 8, instance: 1234 }, type: 12 }], // PROP_OBJECT_IDENTIFIER
		76: [
			{ value: { type: 8, instance: 1234 }, type: 12 },
			{ value: { type: 1, instance: 0 }, type: 12 },
			{ value: { type: 1, instance: 2 }, type: 12 },
			{ value: { type: 5, instance: 2 }, type: 12 },
		], // PROP_OBJECT_LIST
		77: [{ value: 'my-device-1234', type: 7 }], // PROP_OBJECT_NAME
		79: [{ value: 8, type: 9 }], // PROP_OBJECT_TYPE
		121: [{ value: 'Test vendor', type: 7 }], // PROP_VENDOR_NAME
	},
}

function getKey(objectId: BACNetObjectID): DataStoreKey {
	return `${objectId.type}:${objectId.instance}` as DataStoreKey
}

function normalizeSender(sender?: BACnetMessageHeader['sender']) {
	if (!sender) {
		debug(`Received broadcast request, using default broadcast address`)
		return { address: '255.255.255.255', forwardedFrom: null }
	}

	if (typeof sender === 'string') {
		debug(`Preserving original string address: ${sender}`)
		return { address: sender, forwardedFrom: null }
	}

	return sender
}

client.on('whoIs', (data) => {
	debug('whoIs request', data)
	try {
		const payload = data.payload

		if (payload.lowLimit && payload.lowLimit > settings.deviceId) return
		if (payload.highLimit && payload.highLimit < settings.deviceId) return

		const sender = normalizeSender(data.header?.sender)
		debug(
			`Sending iAmResponse to ${sender.address || 'broadcast'} with maxApdu=${settings.maxApdu}`,
		)

		client.iAmResponse(
			sender,
			settings.deviceId,
			Segmentation.NO_SEGMENTATION,
			settings.vendorId,
		)
		debug(`iAmResponse sent successfully`)
	} catch (error) {
		debug('Error handling whoIs request', error)
	}
})

client.on('readProperty', (data) => {
	try {
		const request = {
			objectId: data.payload?.objectId,
			property: data.payload?.property,
		}
		const address =
			data.address ||
			(typeof data.header?.sender === 'string'
				? data.header.sender
				: data.header?.sender?.address)

		// Use incremental invokeId instead of the one from the request
		const invokeId = data.invokeId

		debug(
			`Processing readProperty for object ${request.objectId?.type}:${request.objectId?.instance}, property ${request.property?.id}, using invokeId ${invokeId}`,
		)

		const objectKey = getKey(request.objectId)
		const object = dataStore[objectKey]

		if (!object) {
			debug(`Object not found: ${objectKey}, sending error response`)
			return client.errorResponse(
				{ address },
				ConfirmedServiceChoice.READ_PROPERTY,
				invokeId,
				ErrorClass.OBJECT,
				ErrorCode.UNKNOWN_OBJECT,
			)
		}

		const propertyValue =
			object[request.property?.id as keyof DataStoreEntry]

		if (!propertyValue) {
			debug(
				`Property not found: ${request.property?.id}, sending error response`,
			)
			return client.errorResponse(
				{ address },
				ConfirmedServiceChoice.READ_PROPERTY,
				invokeId,
				ErrorClass.PROPERTY,
				ErrorCode.UNKNOWN_PROPERTY,
			)
		}

		if (request.property?.index === 0xffffffff) {
			debug(
				`Sending readPropertyResponse to ${address} for ${objectKey}:${request.property?.id} with invokeId ${invokeId}`,
			)
			client.readPropertyResponse(
				{ address },
				invokeId,
				request.objectId,
				request.property,
				propertyValue,
			)
		} else {
			const slot = propertyValue[request.property?.index]
			if (!slot) {
				debug(
					`Property index not found: ${request.property?.index}, sending error response`,
				)
				return client.errorResponse(
					{ address },
					ConfirmedServiceChoice.READ_PROPERTY,
					invokeId,
					ErrorClass.PROPERTY,
					ErrorCode.INVALID_ARRAY_INDEX,
				)
			}

			debug(
				`Sending readPropertyResponse (with index) to ${address} for ${objectKey}:${request.property?.id}[${request.property?.index}] with invokeId ${invokeId}`,
			)
			client.readPropertyResponse(
				{ address },
				invokeId,
				request.objectId,
				request.property,
				[slot],
			)
		}

		debug(`readPropertyResponse sent successfully`)
	} catch (error) {
		debug('Error handling readProperty request', error)
	}
})

client.on('writeProperty', (data) => {
	debug('writeProperty request', data)
	try {
		const payload = data.payload || {}
		const sender = data.header?.sender

		// Use incremental invokeId
		const invokeId = data.invokeId
		debug(`Using invokeId ${invokeId} for writeProperty response`)

		const objectId = data.payload.objectId
		const property = data.payload.property || data.payload.value?.property
		const value = data.payload.value

		if (!sender || !objectId || !property || value === undefined) {
			debug('Missing required properties', {
				sender,
				invokeId,
				objectId,
				property,
				value,
			})
			return
		}

		const objectKey = getKey(objectId)
		const object = dataStore[objectKey]

		if (!object) {
			debug(`Object not found ${objectKey}, sending error response`)
			client.errorResponse(
				sender,
				ConfirmedServiceChoice.WRITE_PROPERTY,
				invokeId,
				ErrorClass.OBJECT,
				ErrorCode.UNKNOWN_OBJECT,
			)
			debug(`Error response sent for unknown object`)
			return
		}

		const propertyId = property.id as keyof DataStoreEntry
		const propertyValue = object[propertyId]
		if (!propertyValue) {
			debug(`Property not found ${propertyId}, sending error response`)
			client.errorResponse(
				sender,
				ConfirmedServiceChoice.WRITE_PROPERTY,
				invokeId,
				ErrorClass.PROPERTY,
				ErrorCode.UNKNOWN_PROPERTY,
			)
			debug(`Error response sent for unknown property`)
			return
		}

		if (property.index === 0xffffffff) {
			object[propertyId] = Array.isArray(value.value)
				? value.value
				: [value.value]
			debug(
				`Sending simpleAckResponse to ${typeof sender === 'string' ? sender : sender.address} for ${objectKey}:${propertyId} with invokeId ${invokeId}`,
			)
			client.simpleAckResponse(
				sender,
				ConfirmedServiceChoice.WRITE_PROPERTY,
				invokeId,
			)
			debug(`simpleAckResponse sent successfully`)
		} else {
			if (!propertyValue[property.index]) {
				debug(
					`Property index not found ${property.index}, sending error response`,
				)
				client.errorResponse(
					sender,
					ConfirmedServiceChoice.WRITE_PROPERTY,
					invokeId,
					ErrorClass.PROPERTY,
					ErrorCode.INVALID_ARRAY_INDEX,
				)
				debug(`Error response sent for invalid index`)
				return
			}

			propertyValue[property.index] = Array.isArray(value)
				? value[0]
				: value
			debug(
				`Sending simpleAckResponse (with index) to ${typeof sender === 'string' ? sender : sender.address} for ${objectKey}:${propertyId}[${property.index}] with invokeId ${invokeId}`,
			)
			client.simpleAckResponse(
				sender,
				ConfirmedServiceChoice.WRITE_PROPERTY,
				invokeId,
			)
			debug(`simpleAckResponse (with index) sent successfully`)
		}
	} catch (error) {
		debug('Error handling writeProperty request', error)
	}
})

client.on('whoHas', (data) => {
	debug('whoHas request', data)
	try {
		const payload = data.payload || {}
		const sender = data.header?.sender

		if (payload.lowLimit && payload.lowLimit > settings.deviceId) return
		if (payload.highLimit && payload.highLimit < settings.deviceId) return

		if (payload.objectId) {
			const objectKey = getKey(payload.objectId)
			const object = dataStore[objectKey]

			if (!object) {
				debug('Object not found', objectKey)
				return
			}

			debug(`Sending iHaveResponse to ${sender?.address || 'broadcast'}`)
			client.iHaveResponse(
				sender || null,
				{ type: 8, instance: settings.deviceId },
				{
					type: payload.objectId.type,
					instance: payload.objectId.instance,
				},
				object[77][0].value,
			)
			debug(`iHaveResponse sent successfully`)
		}

		if (payload.objectName) {
			// TODO: Implement search by object name
			debug(
				`Sending iHaveResponse for object name to ${sender?.address || 'broadcast'}`,
			)
			client.iHaveResponse(
				sender || null,
				{ type: 8, instance: settings.deviceId },
				{ type: 1, instance: 1 },
				'test',
			)
			debug(`iHaveResponse for object name sent successfully`)
		}
	} catch (error) {
		debug('Error handling whoHas request', error)
	}
})

client.on('timeSync', (data) => {
	debug('timeSync request', data)
	// TODO: Implement time synchronization
})

client.on('timeSyncUTC', (data) => {
	debug('timeSyncUTC request', data)
	// TODO: Implement UTC time synchronization
})

client.on('readPropertyMultiple', (data) => {
	debug('readPropertyMultiple request', data)
	try {
		const payload = data.payload || {}
		const sender = data.header?.sender

		// Use incremental invokeId
		const invokeId = data.invokeId
		debug(`Using invokeId ${invokeId} for readPropertyMultiple response`)

		const properties = data.payload.properties

		if (!sender || !Array.isArray(properties)) {
			debug('Missing required properties', {
				sender,
				invokeId,
				propertiesIsArray: Array.isArray(properties),
			})
			return
		}

		const responseList = []

		for (const property of properties) {
			if (!property.objectId) {
				debug('Missing objectId in property', property)
				continue
			}

			if (
				property.objectId.type === ObjectType.DEVICE &&
				property.objectId.instance === 4194303
			) {
				property.objectId.instance = settings.deviceId
			}

			const objectKey = getKey(property.objectId)
			const object = dataStore[objectKey]

			if (!object) {
				debug('Object not found', objectKey)
				continue
			}

			if (!Array.isArray(property.properties)) {
				debug('Missing properties array in property', property)
				continue
			}

			const propList: Array<{
				property: { id: number; index: number }
				value: BACNetAppData[]
			}> = []

			for (const item of property.properties) {
				if (!item || item.id === undefined) {
					debug('Invalid property item', item)
					continue
				}

				if (item.id === PropertyIdentifier.ALL) {
					for (const key in object) {
						if (Object.prototype.hasOwnProperty.call(object, key)) {
							const propId = parseInt(key) as PropertyIdentifier
							propList.push({
								property: {
									id: propId,
									index: 0xffffffff,
								},
								value: object[propId],
							})
						}
					}
					continue
				}

				const prop = object[item.id as keyof DataStoreEntry]
				if (!prop) {
					debug('Property not found', item.id)
					continue
				}

				let content
				if (item.index === 0xffffffff) {
					content = prop
				} else {
					const slot = prop[item.index]
					if (!slot) {
						debug('Property index not found', item.index)
						continue
					}
					content = [slot]
				}

				propList.push({
					property: { id: item.id, index: item.index },
					value: content,
				})
			}

			if (propList.length > 0) {
				responseList.push({
					objectId: {
						type: property.objectId.type,
						instance: property.objectId.instance,
					},
					values: propList,
				})
			}
		}

		if (responseList.length === 0) {
			debug(
				`No objects found in readPropertyMultiple, sending error response`,
			)
			client.errorResponse(
				sender,
				ConfirmedServiceChoice.READ_PROPERTY_MULTIPLE,
				invokeId,
				ErrorClass.OBJECT,
				ErrorCode.UNKNOWN_OBJECT,
			)
			debug(`Error response sent for no objects found`)
			return
		}

		debug(
			`Sending readPropertyMultipleResponse to ${typeof sender === 'string' ? sender : sender.address} with invokeId ${invokeId} and ${responseList.length} objects`,
		)
		client.readPropertyMultipleResponse(sender, invokeId, responseList)
		debug(`readPropertyMultipleResponse sent successfully`)
	} catch (error) {
		debug('Error handling readPropertyMultiple request', error)
	}
})

client.on('writePropertyMultiple', (data) => {
	debug('writePropertyMultiple request', data)
	try {
		const payload = data.payload || {}
		const sender = data.header?.sender

		// Use incremental invokeId
		const invokeId = data.invokeId
		debug(`Using invokeId ${invokeId} for writePropertyMultiple response`)

		const objectId = payload.objectId
		const values = payload.values

		if (!sender || !objectId || !values) {
			debug('Missing required properties', {
				sender,
				invokeId,
				objectId,
				values,
			})
			return
		}

		const objectKey = getKey(objectId)
		const object = dataStore[objectKey]

		if (!object) {
			debug(`Object not found ${objectKey}, sending error response`)
			client.errorResponse(
				sender,
				ConfirmedServiceChoice.WRITE_PROPERTY_MULTIPLE,
				invokeId,
				ErrorClass.OBJECT,
				ErrorCode.UNKNOWN_OBJECT,
			)
			debug(`Error response sent for unknown object`)
			return
		}

		for (const item of values) {
			if (!item.property || item.property.id === undefined) {
				continue
			}

			const propertyId = item.property.id as keyof DataStoreEntry
			const propertyValue = object[propertyId]

			if (!propertyValue) {
				debug(
					`Property not found ${propertyId}, sending error response`,
				)
				client.errorResponse(
					sender,
					ConfirmedServiceChoice.WRITE_PROPERTY_MULTIPLE,
					invokeId,
					ErrorClass.PROPERTY,
					ErrorCode.UNKNOWN_PROPERTY,
				)
				debug(`Error response sent for unknown property`)
				return
			}

			if (item.property.index === 0xffffffff) {
				object[propertyId] = item.value
			} else {
				if (!propertyValue[item.property.index]) {
					debug(
						`Property index not found ${item.property.index}, sending error response`,
					)
					client.errorResponse(
						sender,
						ConfirmedServiceChoice.WRITE_PROPERTY_MULTIPLE,
						invokeId,
						ErrorClass.PROPERTY,
						ErrorCode.INVALID_ARRAY_INDEX,
					)
					debug(`Error response sent for invalid index`)
					return
				}

				propertyValue[item.property.index] = Array.isArray(item.value)
					? item.value[0]
					: item.value
			}
		}

		debug(
			`Sending simpleAckResponse to ${typeof sender === 'string' ? sender : sender.address} for writePropertyMultiple with invokeId ${invokeId}`,
		)
		client.simpleAckResponse(
			sender,
			ConfirmedServiceChoice.WRITE_PROPERTY_MULTIPLE,
			invokeId,
		)
		debug(`simpleAckResponse sent successfully`)
	} catch (error) {
		debug('Error handling writePropertyMultiple request', error)
	}
})

client.on('subscribeProperty', (data) => {
	debug('subscribeProperty request', data)
	try {
		const payload = data.payload || {}
		const sender = data.header?.sender

		// Use incremental invokeId
		const invokeId = data.invokeId
		debug(`Using invokeId ${invokeId} for subscribeProperty response`)

		if (sender) {
			client.errorResponse(
				sender,
				ConfirmedServiceChoice.SUBSCRIBE_COV_PROPERTY,
				invokeId,
				ErrorClass.SERVICES,
				ErrorCode.ABORT_BUFFER_OVERFLOW,
			)
		}
	} catch (error) {
		debug('Error handling subscribeProperty request', error)
	}
})

client.on('subscribeCov', (data) => {
	debug('subscribeCOV request', data)
	try {
		const payload = data.payload || {}
		const sender = data.header?.sender

		// Use incremental invokeId
		const invokeId = data.invokeId
		debug(`Using invokeId ${invokeId} for subscribeCov response`)

		if (sender) {
			debug(
				`Sending abort response to ${typeof sender === 'string' ? sender : sender.address} for invokeId ${invokeId}`,
			)
			client.errorResponse(
				sender,
				ConfirmedServiceChoice.SUBSCRIBE_COV,
				invokeId,
				ErrorClass.SERVICES,
				ErrorCode.REJECT_UNRECOGNIZED_SERVICE,
			)
			debug(
				`Sent abort response to ${typeof sender === 'string' ? sender : sender.address} for invokeId ${invokeId}`,
			)
		}
	} catch (error) {
		debug('Error handling subscribeCOV request', error)
	}
})

const otherServices: (keyof BACnetClientEvents)[] = [
	'atomicReadFile',
	'deviceCommunicationControl',
	'reinitializeDevice',
	'readRange',
	'createObject',
	'deleteObject',
]

// Register stub handlers for other services
otherServices.forEach((service) => {
	client.on(service as any, (data: any) => {
		debug(`${service} request`, data)
	})
})

console.log('Bacnet emulated device started')
