import {
	BACnetClientEvents,
	BACnetEventsMap,
	TypedEventEmitter,
} from './EventTypes'
import debugLib from 'debug'

import Transport from './transport'
import ServicesMap, {
	AddListElement,
	AlarmAcknowledge,
	AlarmSummary,
	AtomicReadFile,
	AtomicWriteFile,
	CovNotify,
	CreateObject,
	DeleteObject,
	DeviceCommunicationControl,
	EventInformation,
	EventNotifyData,
	GetEnrollmentSummary,
	IAm,
	IHave,
	PrivateTransfer,
	ReadProperty,
	ReadPropertyMultiple,
	ReadRange,
	RegisterForeignDevice,
	ReinitializeDevice,
	SubscribeCov,
	SubscribeProperty,
	TimeSync,
	WhoIs,
	WriteProperty,
	WritePropertyMultiple,
	ErrorService,
} from './services'
import * as baAsn1 from './asn1'
import * as baApdu from './apdu'
import * as baNpdu from './npdu'
import * as baBvlc from './bvlc'

import {
	BACNetAddress,
	BACNetObjectID,
	BACNetPropertyID,
	BACNetAppData,
	BACNetTimestamp,
	TransportSettings,
	ClientOptions,
	WhoIsOptions,
	ServiceOptions,
	ReadPropertyOptions,
	WritePropertyOptions,
	ErrorCallback,
	DataCallback,
	DecodeAcknowledgeSingleResult,
	DecodeAcknowledgeMultipleResult,
	BACNetReadAccessSpecification,
	DeviceCommunicationOptions,
	ReinitializeDeviceOptions,
	EncodeBuffer,
	BACnetMessage,
	BACnetMessageBase,
	BACnetMessageHeader,
	BACnetError,
	BACNetEventInformation,
	BACNetReadAccess,
	BACNetAlarm,
	BACNetBitString,
	Abort,
	SimpleAck,
	SegmentAck,
	UnconfirmedServiceRequest,
	ConfirmedServiceRequest,
	ServiceMessage,
	SegmentableMessage,
	ConfirmedServiceRequestMessage,
	ComplexAck,
	ComplexAckMessage,
	HasInvokeId,
	PropertyReference,
	TypedValue,
	BacnetService,
	WritePropertyMultipleObject,
	DecodeAtomicWriteFileResult,
	DecodeAtomicReadFileResult,
	ReadRangeAcknowledge,
	EnrollmentOptions,
	EnrollmentSummaryAcknowledge,
	EventNotifyDataParams,
} from './types'
import { format } from 'util'
import {
	UnconfirmedServiceChoice,
	ConfirmedServiceChoice,
	NpduControlPriority,
	NetworkLayerMessageType,
	PduType,
	PduSegAckBit,
	BvlcResultPurpose,
	PduConReqBit,
	PDU_TYPE_MASK,
	ErrorClass,
	ErrorCode,
	NpduControlBit,
	MaxSegmentsAccepted,
	MaxApduLengthAccepted,
	ASN1_ARRAY_ALL,
	ASN1_NO_PRIORITY,
	PropertyIdentifier,
	ReadRangeType,
} from './enum'
import {
	ASYNC_METHODS,
	AsyncMethods,
	AsyncVersion,
	promisify,
} from './async-types'
import { Buffer } from 'buffer'
import { buffer } from 'stream/consumers'
const debug = debugLib('bacnet:client:debug')
const trace = debugLib('bacnet:client:trace')

const ALL_INTERFACES = '0.0.0.0'
const LOCALHOST_INTERFACES_IPV4 = '127.0.0.1'
const BROADCAST_ADDRESS = '255.255.255.255'
const DEFAULT_HOP_COUNT = 0xff
const BVLC_HEADER_LENGTH = 4
const BVLC_FWD_HEADER_LENGTH = 10 // FORWARDED_NPDU

const beU = UnconfirmedServiceChoice
const unconfirmedServiceMap: BACnetEventsMap = {
	[beU.I_AM]: 'iAm',
	[beU.WHO_IS]: 'whoIs',
	[beU.WHO_HAS]: 'whoHas',
	[beU.UNCONFIRMED_COV_NOTIFICATION]: 'covNotifyUnconfirmed',
	[beU.TIME_SYNCHRONIZATION]: 'timeSync',
	[beU.UTC_TIME_SYNCHRONIZATION]: 'timeSyncUTC',
	[beU.UNCONFIRMED_EVENT_NOTIFICATION]: 'eventNotify',
	[beU.I_HAVE]: 'iHave',
	[beU.UNCONFIRMED_PRIVATE_TRANSFER]: 'privateTransfer',
}
const beC = ConfirmedServiceChoice
const confirmedServiceMap: BACnetEventsMap = {
	[beC.READ_PROPERTY]: 'readProperty',
	[beC.WRITE_PROPERTY]: 'writeProperty',
	[beC.READ_PROPERTY_MULTIPLE]: 'readPropertyMultiple',
	[beC.WRITE_PROPERTY_MULTIPLE]: 'writePropertyMultiple',
	[beC.CONFIRMED_COV_NOTIFICATION]: 'covNotify',
	[beC.ATOMIC_WRITE_FILE]: 'atomicWriteFile',
	[beC.ATOMIC_READ_FILE]: 'atomicReadFile',
	[beC.SUBSCRIBE_COV]: 'subscribeCov',
	[beC.SUBSCRIBE_COV_PROPERTY]: 'subscribeProperty',
	[beC.DEVICE_COMMUNICATION_CONTROL]: 'deviceCommunicationControl',
	[beC.REINITIALIZE_DEVICE]: 'reinitializeDevice',
	[beC.CONFIRMED_EVENT_NOTIFICATION]: 'eventNotify',
	[beC.READ_RANGE]: 'readRange',
	[beC.CREATE_OBJECT]: 'createObject',
	[beC.DELETE_OBJECT]: 'deleteObject',
	[beC.ACKNOWLEDGE_ALARM]: 'alarmAcknowledge',
	[beC.GET_ALARM_SUMMARY]: 'getAlarmSummary',
	[beC.GET_ENROLLMENT_SUMMARY]: 'getEnrollmentSummary',
	[beC.GET_EVENT_INFORMATION]: 'getEventInformation',
	[beC.LIFE_SAFETY_OPERATION]: 'lifeSafetyOperation',
	[beC.ADD_LIST_ELEMENT]: 'addListElement',
	[beC.REMOVE_LIST_ELEMENT]: 'removeListElement',
	[beC.CONFIRMED_PRIVATE_TRANSFER]: 'privateTransfer',
}

/**
 * To be able to communicate to BACNET devices, you have to initialize a new bacnet instance.
 * @class BACnetClient
 * @example
 * import BACnetClient from "@bacnet-js/client";
 *
 * const client = new BACnetClient({
 *   port: 47809,
 *   interface: '192.168.251.10',          // Listen on a specific interface
 *   broadcastAddress: '192.168.251.255',  // Use the subnet broadcast address
 *   apduTimeout: 6000                     // Wait twice as long for response
 * });
 */
export default class BACnetClient extends TypedEventEmitter<BACnetClientEvents> {
	private _settings: ClientOptions

	private _transport: Transport

	private _invokeCounter = 1

	private _invokeStore: {
		[key: number]: DataCallback
	} = {}

	private _lastSequenceNumber = 0

	private _segmentStore: Buffer[] = []

	// Async property that contains promisified versions
	public readonly async: AsyncMethods<this>

	constructor(options?: ClientOptions) {
		super()

		// Create the async property with promisified methods
		this.async = {} as AsyncMethods<this>

		// Automatically create async versions of specified methods
		ASYNC_METHODS.forEach((methodName) => {
			if (methodName in this && typeof this[methodName] === 'function') {
				;(this.async as any)[methodName] = promisify(
					this,
					this[methodName],
				)
			} else {
				throw new Error(`Method ${methodName} is not a function`)
			}
		})

		options = options || {}

		this._settings = {
			port: options.port || 47808,
			interface: options.interface || ALL_INTERFACES, // Usa la costante
			transport: options.transport,
			broadcastAddress: options.broadcastAddress || BROADCAST_ADDRESS, // Usa la costante
			apduTimeout: options.apduTimeout || 3000,
		}

		options.reuseAddr =
			options.reuseAddr === undefined ? true : !!options.reuseAddr

		this._transport =
			this._settings.transport ||
			new Transport({
				port: this._settings.port,
				interface: this._settings.interface,
				broadcastAddress: this._settings.broadcastAddress,
				reuseAddr: options.reuseAddr,
			} as TransportSettings)

		// Setup code
		this._transport.on('message', this._receiveData.bind(this))
		this._transport.on('error', this._receiveError.bind(this))
		this._transport.on('listening', () => this.emit('listening'))
		this._transport.open()
	}

	private _send(buffer: EncodeBuffer, receiver?: BACNetAddress) {
		this._transport.send(buffer.buffer, buffer.offset, receiver?.address)
	}

	private _getInvokeId() {
		const id = this._invokeCounter++
		if (id >= 256) this._invokeCounter = 1
		return id - 1
	}

	private _invokeCallback(id: number, err: Error | null, result?: any): void {
		const callback = this._invokeStore[id]
		if (callback) {
			trace(`InvokeId ${id} found -> call callback`)
			return void callback(err, result)
		}
		debug('InvokeId', id, 'not found -> drop package')
		trace(`Stored invokeId: ${Object.keys(this._invokeStore)}`)
	}

	private _addCallback(id: number, callback: DataCallback): void {
		const toCall: DataCallback = (err, data) => {
			delete this._invokeStore[id]
			clearTimeout(timeout)

			if (err) {
				debug(`InvokeId ${id} callback called with error:`, err)
			} else {
				trace(`InvokeId ${id} callback called with data:`, data)
			}

			callback(err, data)
		}

		const timeout = setTimeout(
			toCall.bind(this, new Error('ERR_TIMEOUT')),
			this._settings.apduTimeout,
		)

		this._invokeStore[id] = toCall

		trace(
			`InvokeId ${id} callback added -> timeout set to ${this._settings.apduTimeout}.`, // Stack: ${new Error().stack}`,
		)
	}

	private _getApduBuffer(address?: BACNetAddress): EncodeBuffer {
		const isForwarded: boolean = !!address?.forwardedFrom
		return {
			buffer: Buffer.alloc(this._transport.getMaxPayload()),
			offset: isForwarded ? BVLC_FWD_HEADER_LENGTH : BVLC_HEADER_LENGTH,
		}
	}

	private _processError(
		invokeId: number,
		buffer: Buffer,
		offset: number,
		length: number,
	) {
		const result = ErrorService.decode(buffer, offset)
		if (!result) return debug('Couldn`t decode Error')
		this._invokeCallback(
			invokeId,
			new Error(
				`BacnetError - Class:${result.class} - Code:${result.code}`,
			),
		)
	}

	private _processAbort(invokeId: number, reason: number) {
		this._invokeCallback(
			invokeId,
			new Error(`BacnetAbort - Reason:${reason}`),
		)
	}

	private _segmentAckResponse(
		receiver: BACNetAddress,
		negative: boolean,
		server: boolean,
		originalInvokeId: number,
		sequencenumber: number,
		actualWindowSize: number,
	) {
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE,
			receiver,
			null,
			DEFAULT_HOP_COUNT,
			NetworkLayerMessageType.WHO_IS_ROUTER_TO_NETWORK,
			0,
		)
		baApdu.encodeSegmentAck(
			buffer,
			PduType.SEGMENT_ACK |
				(negative ? PduSegAckBit.NEGATIVE_ACK : 0) |
				(server ? PduSegAckBit.SERVER : 0),
			originalInvokeId,
			sequencenumber,
			actualWindowSize,
		)
		baBvlc.encode(
			buffer.buffer,
			BvlcResultPurpose.ORIGINAL_UNICAST_NPDU,
			buffer.offset,
		)
		this._send(buffer, receiver)
	}

	private _performDefaultSegmentHandling(
		msg: BACnetMessage,
		first: boolean,
		moreFollows: boolean,
		buffer: Buffer,
		offset: number,
		length: number,
	): void {
		if (first) {
			this._segmentStore = []
			msg.type &= ~PduConReqBit.SEGMENTED_MESSAGE

			let apduHeaderLen = 3
			if ((msg.type & PDU_TYPE_MASK) === PduType.CONFIRMED_REQUEST) {
				apduHeaderLen = 4
			}

			const apdubuffer = this._getApduBuffer()
			apdubuffer.offset = 0
			buffer.copy(
				apdubuffer.buffer,
				apduHeaderLen,
				offset,
				offset + length,
			)

			if ((msg.type & PDU_TYPE_MASK) === PduType.CONFIRMED_REQUEST) {
				const confirmedMsg = msg as ConfirmedServiceRequest &
					BACnetMessageBase
				baApdu.encodeConfirmedServiceRequest(
					apdubuffer,
					msg.type,
					confirmedMsg.service,
					confirmedMsg.maxSegments,
					confirmedMsg.maxApdu,
					confirmedMsg.invokeId,
					0,
					0,
				)
			} else {
				const complexMsg = msg as ComplexAck & BACnetMessageBase
				baApdu.encodeComplexAck(
					apdubuffer,
					msg.type,
					complexMsg.service,
					complexMsg.invokeId,
					0,
					0,
				)
			}

			this._segmentStore.push(
				apdubuffer.buffer.slice(0, length + apduHeaderLen),
			)
		} else {
			this._segmentStore.push(buffer.slice(offset, offset + length))
		}

		if (!moreFollows) {
			const apduBuffer = Buffer.concat(this._segmentStore)
			this._segmentStore = []
			msg.type &= ~PduConReqBit.SEGMENTED_MESSAGE
			this._handlePdu(apduBuffer, 0, apduBuffer.length, msg.header)
		}
	}

	private _processSegment(
		msg: SegmentableMessage &
			(ConfirmedServiceRequestMessage | ComplexAckMessage),
		server: boolean,
		buffer: Buffer,
		offset: number,
		length: number,
	): void {
		let first = false

		if (msg.sequencenumber === 0 && this._lastSequenceNumber === 0) {
			first = true
		} else {
			if (msg.sequencenumber !== this._lastSequenceNumber + 1) {
				return this._segmentAckResponse(
					msg.header.sender,
					true,
					server,
					msg.invokeId,
					this._lastSequenceNumber,
					msg.proposedWindowNumber,
				)
			}
		}

		this._lastSequenceNumber = msg.sequencenumber
		const moreFollows = !!(msg.type & PduConReqBit.MORE_FOLLOWS)

		if (!moreFollows) {
			this._lastSequenceNumber = 0
		}

		if (
			msg.sequencenumber % msg.proposedWindowNumber === 0 ||
			!moreFollows
		) {
			this._segmentAckResponse(
				msg.header.sender,
				false,
				server,
				msg.invokeId,
				msg.sequencenumber,
				msg.proposedWindowNumber,
			)
		}

		this._performDefaultSegmentHandling(
			msg,
			first,
			moreFollows,
			buffer,
			offset,
			length,
		)
	}

	private _processServiceRequest(
		serviceMap: Record<number, keyof BACnetClientEvents>,
		content: ServiceMessage,
		buffer: Buffer,
		offset: number,
		length: number,
	): void {
		const sender = content.header?.sender
		if (sender?.address === LOCALHOST_INTERFACES_IPV4) {
			debug(
				'Received and skipped localhost service request:',
				content.service,
			)
			return
		}

		const name = serviceMap[content.service]
		if (!name) {
			debug('Received unsupported service request:', content.service)
			return
		}

		// Use type assertion to access potential invokeId property
		const confirmedMsg = content as Partial<ConfirmedServiceRequest> &
			BACnetMessageBase
		const id = confirmedMsg.invokeId
			? `with invokeId ${confirmedMsg.invokeId}`
			: ''
		trace(`Received service request${id}:`, name)

		// Find a function to decode the packet.
		const serviceHandler = ServicesMap[
			name as keyof typeof ServicesMap
		] as BacnetService

		if (serviceHandler) {
			try {
				content.payload = serviceHandler.decode(buffer, offset, length)
				trace(
					`Handled service request${id}:`,
					name,
					JSON.stringify(content),
				)
			} catch (e) {
				// Sometimes incomplete or corrupted messages will cause exceptions
				// during decoding, but we don't want these to terminate the program, so
				// we'll just log them and ignore them.
				debug('Exception thrown when processing message:', e)
				debug('Original message was', `${name}:`, content)
				return
			}
			if (!content.payload) {
				return debug('Received invalid', name, 'message')
			}
		} else {
			debug('No serviceHandler defined for:', name)
			// Call the callback anyway, just with no payload.
		}

		// Call the user code, if they've defined a callback.
		if (this.listenerCount(name)) {
			trace(
				`listener count by name emits ${name} with content. ${format('%o', content)}`,
			)
			this.emit(name, content)
		} else {
			if (this.listenerCount('unhandledEvent')) {
				trace('unhandled event emitting with content')
				this.emit(name, content)
			} else {
				// No 'unhandled event' handler, so respond with an error ourselves.
				// This is better than doing nothing, which can often make the other
				// device think we have gone offline.
				trace(
					`no unhandled event "${name}" handler with header: ${JSON.stringify(
						content.header,
					)}`,
				)
				if (content.header?.expectingReply) {
					debug('Replying with error for unhandled service:', name)
					// Make sure we don't reply pretending to be the caller, if we got a
					// forwarded message!  Really this should be overridden to be your
					// own IP, but only if it's not null/undefined to begin with.
					if (content.header.sender) {
						content.header.sender.forwardedFrom = null
					}
					this.errorResponse(
						content.header.sender,
						content.service,
						confirmedMsg.invokeId,
						ErrorClass.SERVICES,
						ErrorCode.REJECT_UNRECOGNIZED_SERVICE,
					)
				}
			}
		}
	}

	private _handlePdu(
		buffer: Buffer,
		offset: number,
		length: number,
		header: BACnetMessageHeader,
	): void {
		let msg: BACnetMessage
		trace('handlePdu Header: ', header)

		// Handle different PDU types
		switch (header.apduType & PDU_TYPE_MASK) {
			case PduType.UNCONFIRMED_REQUEST:
				msg = baApdu.decodeUnconfirmedServiceRequest(
					buffer,
					offset,
				) as UnconfirmedServiceRequest & BACnetMessageBase
				msg.header = header
				msg.header.confirmedService = false
				this._processServiceRequest(
					unconfirmedServiceMap,
					msg,
					buffer,
					offset + msg.len,
					length - msg.len,
				)
				break

			case PduType.SIMPLE_ACK:
				msg = baApdu.decodeSimpleAck(buffer, offset) as SimpleAck &
					BACnetMessageBase &
					HasInvokeId
				offset += msg.len
				length -= msg.len
				this._invokeCallback((msg as HasInvokeId).invokeId, null, {
					msg,
					buffer,
					offset: offset + msg.len,
					length: length - msg.len,
				})
				break

			case PduType.COMPLEX_ACK:
				msg = baApdu.decodeComplexAck(
					buffer,
					offset,
				) as ComplexAckMessage
				msg.header = header
				if ((header.apduType & PduConReqBit.SEGMENTED_MESSAGE) === 0) {
					this._invokeCallback((msg as HasInvokeId).invokeId, null, {
						msg,
						buffer,
						offset: offset + msg.len,
						length: length - msg.len,
					})
				} else {
					this._processSegment(
						msg as SegmentableMessage &
							(
								| ConfirmedServiceRequestMessage
								| ComplexAckMessage
							),
						true,
						buffer,
						offset + msg.len,
						length - msg.len,
					)
				}
				break

			case PduType.SEGMENT_ACK:
				msg = baApdu.decodeSegmentAck(buffer, offset) as SegmentAck &
					BACnetMessageBase
				msg.header = header
				this._processSegment(
					msg as unknown as (ConfirmedServiceRequest | ComplexAck) &
						BACnetMessageBase,
					true,
					buffer,
					offset + msg.len,
					length - msg.len,
				)
				break

			case PduType.ERROR:
				msg = baApdu.decodeError(buffer, offset) as BACnetError &
					BACnetMessageBase
				this._processError(
					(msg as HasInvokeId).invokeId,
					buffer,
					offset + msg.len,
					length - msg.len,
				)
				break

			case PduType.REJECT:
			case PduType.ABORT:
				msg = baApdu.decodeAbort(buffer, offset) as Abort &
					BACnetMessageBase
				this._processAbort(msg.invokeId, msg.reason)
				break

			case PduType.CONFIRMED_REQUEST:
				msg = baApdu.decodeConfirmedServiceRequest(
					buffer,
					offset,
				) as ConfirmedServiceRequest & BACnetMessageBase
				msg.header = header
				msg.header.confirmedService = true
				if ((header.apduType & PduConReqBit.SEGMENTED_MESSAGE) === 0) {
					this._processServiceRequest(
						confirmedServiceMap,
						msg,
						buffer,
						offset + msg.len,
						length - msg.len,
					)
				} else {
					this._processSegment(
						msg as SegmentableMessage &
							(
								| ConfirmedServiceRequestMessage
								| ComplexAckMessage
							),
						true,
						buffer,
						offset + msg.len,
						length - msg.len,
					)
				}
				break

			default:
				debug(
					`Received unknown PDU type ${header.apduType} -> Drop packet`,
				)
				break
		}
	}

	private _handleNpdu(
		buffer: Buffer,
		offset: number,
		msgLength: number,
		header: BACnetMessageHeader,
	): void {
		// Check data length
		if (msgLength <= 0) {
			return trace('No NPDU data -> Drop package')
		}

		// Parse baNpdu header
		const result = baNpdu.decode(buffer, offset)
		if (!result) {
			return trace('Received invalid NPDU header -> Drop package')
		}

		if (result.funct & NpduControlBit.NETWORK_LAYER_MESSAGE) {
			return trace('Received network layer message -> Drop package')
		}

		offset += result.len
		msgLength -= result.len

		if (msgLength <= 0) {
			return trace('No APDU data -> Drop package')
		}

		header.apduType = baApdu.getDecodedType(buffer, offset)
		header.expectingReply = !!(
			result.funct & NpduControlBit.EXPECTING_REPLY
		)

		if (result.source) {
			header.sender.net = result.source.net
			header.sender.adr = result.source.adr
		}

		this._handlePdu(buffer, offset, msgLength, header)
	}

	private _receiveData(buffer: Buffer, remoteAddress: string): void {
		// Check data length
		if (buffer.length < BVLC_HEADER_LENGTH) {
			return trace('Received invalid data -> Drop package')
		}

		// Parse BVLC header
		const result = baBvlc.decode(buffer, 0)
		if (!result) {
			return trace('Received invalid BVLC header -> Drop package')
		}

		const header: BACnetMessageHeader = {
			// Which function the packet came in on, so later code can distinguish
			// between ORIGINAL_BROADCAST_NPDU and DISTRIBUTE_BROADCAST_TO_NETWORK.
			func: result.func,
			sender: {
				// Address of the host we are directly connected to. String, IP:port.
				address: remoteAddress,
				// If the host is a BBMD passing messages along to another node, this
				// is the address of the distant BACnet node. String, IP:port.
				// Typically we won't have network connectivity to this address, but
				// we have to include it in replies so the host we are connect to knows
				// where to forward the messages.
				forwardedFrom: null,
			},
			apduType: 0,
			expectingReply: false,
		}
		// Check BVLC function
		switch (result.func) {
			case BvlcResultPurpose.ORIGINAL_UNICAST_NPDU:
			case BvlcResultPurpose.ORIGINAL_BROADCAST_NPDU:
				this._handleNpdu(
					buffer,
					result.len,
					buffer.length - result.len,
					header,
				)
				break

			case BvlcResultPurpose.FORWARDED_NPDU:
				// Preserve the IP of the node behind the BBMD so we know where to send
				// replies back to.
				header.sender.forwardedFrom = result.originatingIP
				this._handleNpdu(
					buffer,
					result.len,
					buffer.length - result.len,
					header,
				)
				break

			case BvlcResultPurpose.REGISTER_FOREIGN_DEVICE:
				const decodeResult = RegisterForeignDevice.decode(
					buffer,
					result.len,
					buffer.length - result.len,
				)
				if (!decodeResult) {
					return trace(
						'Received invalid registerForeignDevice message',
					)
				}
				this.emit('registerForeignDevice', {
					header,
					payload: decodeResult,
				})
				break

			case BvlcResultPurpose.DISTRIBUTE_BROADCAST_TO_NETWORK:
				this._handleNpdu(
					buffer,
					result.len,
					buffer.length - result.len,
					header,
				)
				break

			default:
				debug(
					`Received unknown BVLC function ${
						result.func
					} -> Drop package`,
				)
				break
		}
	}

	private _receiveError(err: Error) {
		/**
		 * @event BACnetClient.error
		 * @example
		 * import BACnetClient from "@bacnet-js/client";
		 *
		 * const client = new BACnetClient();
		 *
		 * client.on('error', (err) => {
		 *   console.log('Error occurred: ', err);
		 *   client.close();
		 * });
		 */
		this.emit('error', err)
	}

	/**
	 * The whoIs command discovers all BACNET devices in a network.
	 * @fires BACnetClient.iAm
	 */
	public whoIs(
		receiverOrOptions?: BACNetAddress | WhoIsOptions,
		options?: WhoIsOptions,
	): void {
		let receiver: BACNetAddress | undefined
		if (!options) {
			if (
				receiverOrOptions &&
				typeof receiverOrOptions === 'object' &&
				('lowLimit' in receiverOrOptions ||
					'highLimit' in receiverOrOptions)
			) {
				options = receiverOrOptions as WhoIsOptions
				receiverOrOptions = undefined
			} else {
				receiver = receiverOrOptions as BACNetAddress
			}
		}

		options = options || {}

		const buffer = this._getApduBuffer(receiver)

		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE,
			receiver,
			null,
			DEFAULT_HOP_COUNT,
			NetworkLayerMessageType.WHO_IS_ROUTER_TO_NETWORK,
			0,
		)

		baApdu.encodeUnconfirmedServiceRequest(
			buffer,
			PduType.UNCONFIRMED_REQUEST,
			UnconfirmedServiceChoice.WHO_IS,
		)

		WhoIs.encode(buffer, options.lowLimit, options.highLimit)
		this.sendBvlc(receiver, buffer)
	}

	/**
	 * The timeSync command sets the time of a target device.
	 */
	timeSync(receiver: BACNetAddress, dateTime: Date): void {
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(buffer, NpduControlPriority.NORMAL_MESSAGE, receiver)
		baApdu.encodeUnconfirmedServiceRequest(
			buffer,
			PduType.UNCONFIRMED_REQUEST,
			UnconfirmedServiceChoice.TIME_SYNCHRONIZATION,
		)
		TimeSync.encode(buffer, dateTime)
		this.sendBvlc(receiver, buffer)
	}

	/**
	 * The timeSyncUTC command sets the UTC time of a target device.
	 */
	timeSyncUTC(receiver: BACNetAddress, dateTime: Date): void {
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(buffer, NpduControlPriority.NORMAL_MESSAGE, receiver)
		baApdu.encodeUnconfirmedServiceRequest(
			buffer,
			PduType.UNCONFIRMED_REQUEST,
			UnconfirmedServiceChoice.UTC_TIME_SYNCHRONIZATION,
		)
		TimeSync.encode(buffer, dateTime)
		this.sendBvlc(receiver, buffer)
	}

	/**
	 * The readProperty command reads a single property of an object from a device.
	 */
	readProperty(
		address: BACNetAddress,
		objectId: BACNetObjectID,
		propertyId: number,
		callback: DataCallback<DecodeAcknowledgeSingleResult>,
	): void
	readProperty(
		address: BACNetAddress,
		objectId: BACNetObjectID,
		propertyId: number,
		options: ReadPropertyOptions,
		callback: DataCallback<DecodeAcknowledgeSingleResult>,
	): void
	readProperty(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		propertyId: number,
		options:
			| ReadPropertyOptions
			| DataCallback<DecodeAcknowledgeSingleResult>,
		next?: DataCallback<DecodeAcknowledgeSingleResult>,
	): void {
		next = next || (options as DataCallback<DecodeAcknowledgeSingleResult>)
		const settings: ReadPropertyOptions = {
			maxSegments:
				(options as ReadPropertyOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ReadPropertyOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ReadPropertyOptions).invokeId ||
				this._getInvokeId(),
			arrayIndex:
				(options as ReadPropertyOptions).arrayIndex !== undefined
					? (options as ReadPropertyOptions).arrayIndex
					: ASN1_ARRAY_ALL,
		}

		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
			null,
			DEFAULT_HOP_COUNT,
			NetworkLayerMessageType.WHO_IS_ROUTER_TO_NETWORK,
			0,
		)

		const type =
			PduType.CONFIRMED_REQUEST |
			(settings.maxSegments !== MaxSegmentsAccepted.SEGMENTS_0
				? PduConReqBit.SEGMENTED_RESPONSE_ACCEPTED
				: 0)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			type,
			ConfirmedServiceChoice.READ_PROPERTY,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)

		ReadProperty.encode(
			buffer,
			objectId.type,
			objectId.instance,
			propertyId,
			settings.arrayIndex,
		)
		this.sendBvlc(receiver, buffer)

		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return next(err)
			}

			const result = ReadProperty.decodeAcknowledge(
				data.buffer,
				data.offset,
				data.length,
			)
			if (!result) {
				return next(new Error('INVALID_DECODING'))
			}

			next(null, result)
		})
	}

	/**
	 * The writeProperty command writes a single property of an object to a device.
	 */
	writeProperty(
		address: BACNetAddress,
		objectId: BACNetObjectID,
		propertyId: number,
		values: BACNetAppData[],
		options: WritePropertyOptions,
		callback: ErrorCallback,
	): void
	writeProperty(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		propertyId: number,
		values: BACNetAppData[],
		options: WritePropertyOptions | ErrorCallback,
		next?: ErrorCallback,
	): void {
		next = next || (options as ErrorCallback)
		const settings: WritePropertyOptions = {
			maxSegments:
				(options as WritePropertyOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as WritePropertyOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as WritePropertyOptions).invokeId ||
				this._getInvokeId(),
			arrayIndex:
				(options as WritePropertyOptions).arrayIndex || ASN1_ARRAY_ALL,
			priority:
				(options as WritePropertyOptions).priority || ASN1_NO_PRIORITY,
		}

		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
			null,
			DEFAULT_HOP_COUNT,
			NetworkLayerMessageType.WHO_IS_ROUTER_TO_NETWORK,
			0,
		)

		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.WRITE_PROPERTY,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)

		WriteProperty.encode(
			buffer,
			objectId.type,
			objectId.instance,
			propertyId,
			settings.arrayIndex,
			settings.priority,
			values,
		)
		this.sendBvlc(receiver, buffer)

		this._addCallback(settings.invokeId, (err, data) => {
			;(next as ErrorCallback)(err)
		})
	}

	/**
	 * The readPropertyMultiple command reads multiple properties in multiple objects from a device.
	 */
	readPropertyMultiple(
		address: BACNetAddress,
		propertiesArray: BACNetReadAccessSpecification[],
		callback: DataCallback<DecodeAcknowledgeMultipleResult>,
	): void
	readPropertyMultiple(
		address: BACNetAddress,
		propertiesArray: BACNetReadAccessSpecification[],
		options: ServiceOptions,
		callback: DataCallback<DecodeAcknowledgeMultipleResult>,
	): void
	readPropertyMultiple(
		receiver: BACNetAddress,
		propertiesArray: BACNetReadAccessSpecification[],
		options: ServiceOptions | DataCallback<DecodeAcknowledgeMultipleResult>,
		next?: DataCallback<DecodeAcknowledgeMultipleResult>,
	): void {
		next =
			next || (options as DataCallback<DecodeAcknowledgeMultipleResult>)
		const settings = {
			maxSegments:
				(options as ServiceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ServiceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ServiceOptions).invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
			null,
			DEFAULT_HOP_COUNT,
			NetworkLayerMessageType.WHO_IS_ROUTER_TO_NETWORK,
			0,
		)
		const type =
			PduType.CONFIRMED_REQUEST |
			(settings.maxSegments !== MaxSegmentsAccepted.SEGMENTS_0
				? PduConReqBit.SEGMENTED_RESPONSE_ACCEPTED
				: 0)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			type,
			ConfirmedServiceChoice.READ_PROPERTY_MULTIPLE,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		ReadPropertyMultiple.encode(buffer, propertiesArray)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}

			const result = ReadPropertyMultiple.decodeAcknowledge(
				data.buffer,
				data.offset,
				data.length,
			)
			if (!result) {
				return void next(new Error('INVALID_DECODING'))
			}
			next(null, result)
		})
	}

	/**
	 * The writePropertyMultiple command writes multiple properties in multiple objects to a device.
	 */
	writePropertyMultiple(
		address: BACNetAddress,
		values: WritePropertyMultipleObject[],
		callback: ErrorCallback,
	): void
	writePropertyMultiple(
		address: BACNetAddress,
		values: WritePropertyMultipleObject[],
		options: ServiceOptions,
		callback: ErrorCallback,
	): void
	writePropertyMultiple(
		receiver: BACNetAddress,
		values: WritePropertyMultipleObject[],
		options: ServiceOptions | ErrorCallback,
		next?: ErrorCallback,
	): void {
		next = next || (options as ErrorCallback)
		const settings = {
			maxSegments:
				(options as ServiceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ServiceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ServiceOptions).invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.WRITE_PROPERTY_MULTIPLE,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
		)
		WritePropertyMultiple.encodeObject(buffer, values)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			next(err)
		})
	}

	/**
	 * The confirmedCOVNotification command is used to push notifications to other
	 * systems that have registered with us via a subscribeCov message.
	 */
	confirmedCOVNotification(
		receiver: BACNetAddress,
		monitoredObject: BACNetObjectID,
		subscribeId: number,
		initiatingDeviceId: number,
		lifetime: number,
		values: Array<{
			property: PropertyReference
			value: TypedValue[]
		}>,
		options: ServiceOptions | ErrorCallback,
		next?: ErrorCallback,
	): void {
		next = next || (options as ErrorCallback)
		const settings = {
			maxSegments:
				(options as ServiceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ServiceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ServiceOptions).invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer()
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.CONFIRMED_COV_NOTIFICATION,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		CovNotify.encode(
			buffer,
			subscribeId,
			initiatingDeviceId,
			monitoredObject,
			lifetime,
			values,
		)
		baBvlc.encode(
			buffer.buffer,
			BvlcResultPurpose.ORIGINAL_UNICAST_NPDU,
			buffer.offset,
		)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			next()
		})
	}

	/**
	 * The deviceCommunicationControl command enables or disables network communication of the target device.
	 */
	deviceCommunicationControl(
		receiver: BACNetAddress,
		timeDuration: number,
		enableDisable: number,
		options: DeviceCommunicationOptions | ErrorCallback,
		next?: ErrorCallback,
	): void {
		next = next || (options as ErrorCallback)
		const settings = {
			maxSegments:
				(options as DeviceCommunicationOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as DeviceCommunicationOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as DeviceCommunicationOptions).invokeId ||
				this._getInvokeId(),
			password: (options as DeviceCommunicationOptions).password,
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.DEVICE_COMMUNICATION_CONTROL,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		DeviceCommunicationControl.encode(
			buffer,
			timeDuration,
			enableDisable,
			settings.password,
		)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			next(err)
		})
	}

	/**
	 * The reinitializeDevice command initiates a restart of the target device.
	 */
	reinitializeDevice(
		receiver: BACNetAddress,
		state: number,
		options: ReinitializeDeviceOptions | ErrorCallback,
		next?: ErrorCallback,
	): void {
		next = next || (options as ErrorCallback)
		const settings = {
			maxSegments:
				(options as ReinitializeDeviceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ReinitializeDeviceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ReinitializeDeviceOptions).invokeId ||
				this._getInvokeId(),
			password: (options as ReinitializeDeviceOptions).password,
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.REINITIALIZE_DEVICE,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		ReinitializeDevice.encode(buffer, state, settings.password)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			next(err)
		})
	}

	/**
	 * Writes a file to a remote device.
	 */
	writeFile(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		position: number,
		fileBuffer: number[][],
		options: ServiceOptions | DataCallback<DecodeAtomicWriteFileResult>,
		next?: DataCallback<DecodeAtomicWriteFileResult>,
	): void {
		next = next || (options as DataCallback<DecodeAtomicWriteFileResult>)
		const settings = {
			maxSegments:
				(options as ServiceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ServiceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ServiceOptions).invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.ATOMIC_WRITE_FILE,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		const blocks: number[][] = fileBuffer
		AtomicWriteFile.encode(buffer, false, objectId, position, blocks)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			const result = AtomicWriteFile.decodeAcknowledge(
				data.buffer,
				data.offset,
			)
			if (!result) {
				return void next(new Error('INVALID_DECODING'))
			}
			next(null, result)
		})
	}

	/**
	 * Reads a file from a remote device.
	 */
	readFile(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		position: number,
		count: number,
		options: ServiceOptions | DataCallback<DecodeAtomicReadFileResult>,
		next?: DataCallback<DecodeAtomicReadFileResult>,
	): void {
		next = next || (options as DataCallback<DecodeAtomicReadFileResult>)
		const settings = {
			maxSegments:
				(options as ServiceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ServiceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ServiceOptions).invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.ATOMIC_READ_FILE,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		AtomicReadFile.encode(buffer, true, objectId, position, count)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			const result = AtomicReadFile.decodeAcknowledge(
				data.buffer,
				data.offset,
			)
			if (!result) {
				return void next(new Error('INVALID_DECODING'))
			}
			next(null, result)
		})
	}

	/**
	 * Reads a range of data from a remote device.
	 */
	readRange(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		idxBegin: number,
		quantity: number,
		options: ServiceOptions | DataCallback<ReadRangeAcknowledge>,
		next?: DataCallback<ReadRangeAcknowledge>,
	): void {
		next = next || (options as DataCallback<ReadRangeAcknowledge>)
		const settings = {
			maxSegments:
				(options as ServiceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ServiceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ServiceOptions).invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.READ_RANGE,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		ReadRange.encode(
			buffer,
			objectId,
			PropertyIdentifier.LOG_BUFFER,
			ASN1_ARRAY_ALL,
			ReadRangeType.BY_POSITION,
			idxBegin,
			new Date(),
			quantity,
		)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			const result = ReadRange.decodeAcknowledge(
				data.buffer,
				data.offset,
				data.length,
			)
			if (!result) {
				return void next(new Error('INVALID_DECODING'))
			}
			next(null, result)
		})
	}

	/**
	 * Subscribes to Change of Value (COV) notifications for an object
	 */
	public subscribeCov(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		subscribeId: number,
		cancel: boolean,
		issueConfirmedNotifications: boolean,
		lifetime: number,
		options: ServiceOptions,
		next?: ErrorCallback,
	): void {
		next = next || (options as unknown as ErrorCallback)
		const settings = {
			maxSegments: options.maxSegments || MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu: options.maxApdu || MaxApduLengthAccepted.OCTETS_1476,
			invokeId: options.invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.SUBSCRIBE_COV,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		SubscribeCov.encode(
			buffer,
			subscribeId,
			objectId,
			cancel,
			issueConfirmedNotifications,
			lifetime,
		)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			next()
		})
	}

	/**
	 * Subscribes to Change of Value (COV) notifications for a specific property
	 */
	public subscribeProperty(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		monitoredProperty: BACNetPropertyID,
		subscribeId: number,
		cancel: boolean,
		issueConfirmedNotifications: boolean,
		options: ServiceOptions,
		next?: ErrorCallback,
	): void {
		next = next || (options as unknown as ErrorCallback)
		const settings = {
			maxSegments: options.maxSegments || MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu: options.maxApdu || MaxApduLengthAccepted.OCTETS_1476,
			invokeId: options.invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.SUBSCRIBE_COV_PROPERTY,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		SubscribeProperty.encode(
			buffer,
			subscribeId,
			objectId,
			cancel,
			issueConfirmedNotifications,
			0,
			monitoredProperty,
			false,
			0x0f,
		)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			next()
		})
	}

	/**
	 * Sends an unconfirmed COV notification to a device
	 */
	public unconfirmedCOVNotification(
		receiver: BACNetAddress,
		subscriberProcessId: number,
		initiatingDeviceId: number,
		monitoredObjectId: BACNetObjectID,
		timeRemaining: number,
		values: Array<{
			property: {
				id: number
				index?: number
			}
			value: BACNetAppData[]
		}>,
	): void {
		const buffer = this._getApduBuffer()
		baNpdu.encode(buffer, NpduControlPriority.NORMAL_MESSAGE, receiver)
		baApdu.encodeUnconfirmedServiceRequest(
			buffer,
			PduType.UNCONFIRMED_REQUEST,
			UnconfirmedServiceChoice.UNCONFIRMED_COV_NOTIFICATION,
		)
		CovNotify.encode(
			buffer,
			subscriberProcessId,
			initiatingDeviceId,
			monitoredObjectId,
			timeRemaining,
			values,
		)
		baBvlc.encode(
			buffer.buffer,
			BvlcResultPurpose.ORIGINAL_UNICAST_NPDU,
			buffer.offset,
		)
		this._send(buffer, receiver)
	}

	/**
	 * Creates a new object in a device
	 */
	public createObject(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		values: Array<{
			property: {
				id: number
				index?: number
			}
			value: BACNetAppData[]
		}>,
		options: ServiceOptions,
		next?: ErrorCallback,
	): void {
		next = next || (options as unknown as ErrorCallback)
		const settings = {
			maxSegments: options.maxSegments || MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu: options.maxApdu || MaxApduLengthAccepted.OCTETS_1476,
			invokeId: options.invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.CREATE_OBJECT,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		CreateObject.encode(buffer, objectId, values)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			next()
		})
	}

	/**
	 * Deletes an object from a device
	 */
	public deleteObject(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		options: ServiceOptions,
		next?: ErrorCallback,
	): void {
		next = next || (options as unknown as ErrorCallback)
		const settings = {
			maxSegments: options.maxSegments || MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu: options.maxApdu || MaxApduLengthAccepted.OCTETS_1476,
			invokeId: options.invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.DELETE_OBJECT,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		DeleteObject.encode(buffer, objectId)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			next()
		})
	}

	/**
	 * Removes an element from a list property
	 */
	public removeListElement(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		reference: {
			id: number
			index: number
		},
		values: BACNetAppData[],
		options: ServiceOptions,
		next?: ErrorCallback,
	): void {
		next = next || (options as unknown as ErrorCallback)
		const settings = {
			maxSegments: options.maxSegments || MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu: options.maxApdu || MaxApduLengthAccepted.OCTETS_1476,
			invokeId: options.invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.REMOVE_LIST_ELEMENT,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		AddListElement.encode(
			buffer,
			objectId,
			reference.id,
			reference.index,
			values,
		)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			next()
		})
	}

	/**
	 * Adds an element to a list property
	 */
	public addListElement(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		reference: {
			id: number
			index: number
		},
		values: BACNetAppData[],
		options: ServiceOptions,
		next?: ErrorCallback,
	): void {
		next = next || (options as unknown as ErrorCallback)
		const settings = {
			maxSegments: options.maxSegments || MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu: options.maxApdu || MaxApduLengthAccepted.OCTETS_1476,
			invokeId: options.invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.ADD_LIST_ELEMENT,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		AddListElement.encode(
			buffer,
			objectId,
			reference.id,
			reference.index,
			values,
		)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			next()
		})
	}

	/**
	 * Gets the alarm summary from a device.
	 */
	getAlarmSummary(
		receiver: BACNetAddress,
		options: ServiceOptions | DataCallback<BACNetAlarm[]>,
		next?: DataCallback<BACNetAlarm[]>,
	): void {
		next = next || (options as DataCallback<BACNetAlarm[]>)
		const settings: ServiceOptions = {
			maxSegments:
				(options as ServiceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ServiceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ServiceOptions).invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.GET_ALARM_SUMMARY,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			const result = AlarmSummary.decode(
				data.buffer,
				data.offset,
				data.length,
			)
			if (!result) {
				return void next(new Error('INVALID_DECODING'))
			}
			next(null, result.alarms)
		})
	}

	/**
	 * Gets event information from a device.
	 */
	getEventInformation(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		options: ServiceOptions | DataCallback<BACNetEventInformation[]>,
		next?: DataCallback<BACNetEventInformation[]>,
	): void {
		next = next || (options as DataCallback<BACNetEventInformation[]>)
		const settings: ServiceOptions = {
			maxSegments:
				(options as ServiceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ServiceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ServiceOptions).invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.GET_EVENT_INFORMATION,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		baAsn1.encodeContextObjectId(
			buffer,
			0,
			objectId.type,
			objectId.instance,
		)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			const result = EventInformation.decode(
				data.buffer,
				data.offset,
				data.length,
			)
			if (!result) {
				return void next(new Error('INVALID_DECODING'))
			}
			next(null, result.alarms)
		})
	}

	/**
	 * Acknowledges an alarm.
	 */
	acknowledgeAlarm(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		eventState: number,
		ackText: string,
		evTimeStamp: BACNetTimestamp,
		ackTimeStamp: BACNetTimestamp,
		options: ServiceOptions | ErrorCallback,
		next?: ErrorCallback,
	): void {
		next = next || (options as ErrorCallback)
		const settings: ServiceOptions = {
			maxSegments:
				(options as ServiceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ServiceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ServiceOptions).invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.ACKNOWLEDGE_ALARM,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		AlarmAcknowledge.encode(
			buffer,
			57,
			objectId,
			eventState,
			ackText,
			evTimeStamp,
			ackTimeStamp,
		)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			next()
		})
	}

	/**
	 * Sends a confirmed private transfer.
	 */
	confirmedPrivateTransfer(
		receiver: BACNetAddress,
		vendorId: number,
		serviceNumber: number,
		data: number[],
		options: ServiceOptions | ErrorCallback,
		next?: ErrorCallback,
	): void {
		next = next || (options as ErrorCallback)
		const settings: ServiceOptions = {
			maxSegments:
				(options as ServiceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ServiceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ServiceOptions).invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.CONFIRMED_PRIVATE_TRANSFER,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		PrivateTransfer.encode(buffer, vendorId, serviceNumber, data)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			next()
		})
	}

	/**
	 * Sends an unconfirmed private transfer.
	 */
	unconfirmedPrivateTransfer(
		receiver: BACNetAddress,
		vendorId: number,
		serviceNumber: number,
		data: number[],
	): void {
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(buffer, NpduControlPriority.NORMAL_MESSAGE, receiver)
		baApdu.encodeUnconfirmedServiceRequest(
			buffer,
			PduType.UNCONFIRMED_REQUEST,
			UnconfirmedServiceChoice.UNCONFIRMED_PRIVATE_TRANSFER,
		)
		PrivateTransfer.encode(buffer, vendorId, serviceNumber, data)
		this.sendBvlc(receiver, buffer)
	}

	/**
	 * Gets enrollment summary from a device.
	 */
	getEnrollmentSummary(
		receiver: BACNetAddress,
		acknowledgmentFilter: number,
		opts: EnrollmentOptions | DataCallback<EnrollmentSummaryAcknowledge>,
		next?: DataCallback<EnrollmentSummaryAcknowledge>,
	): void {
		if (typeof opts === 'function') {
			next = opts as DataCallback<EnrollmentSummaryAcknowledge>
			opts = {} as EnrollmentOptions
		}

		const options = opts as EnrollmentOptions

		const settings: ServiceOptions = {
			maxSegments: options.maxSegments || MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu: options.maxApdu || MaxApduLengthAccepted.OCTETS_1476,
			invokeId: options.invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.GET_ENROLLMENT_SUMMARY,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		GetEnrollmentSummary.encode(
			buffer,
			acknowledgmentFilter,
			options.enrollmentFilter,
			options.eventStateFilter,
			options.eventTypeFilter,
			options.priorityFilter,
			options.notificationClassFilter,
		)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			const result = GetEnrollmentSummary.decodeAcknowledge(
				data.buffer,
				data.offset,
				data.length,
			)
			if (!result) {
				return void next(new Error('INVALID_DECODING'))
			}
			next(null, result)
		})
	}

	/**
	 * Sends an unconfirmed event notification.
	 */
	unconfirmedEventNotification(
		receiver: BACNetAddress,
		eventNotification: EventNotifyDataParams,
	): void {
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(buffer, NpduControlPriority.NORMAL_MESSAGE, receiver)
		baApdu.encodeUnconfirmedServiceRequest(
			buffer,
			PduType.UNCONFIRMED_REQUEST,
			UnconfirmedServiceChoice.UNCONFIRMED_EVENT_NOTIFICATION,
		)
		EventNotifyData.encode(buffer, eventNotification)
		this.sendBvlc(receiver, buffer)
	}

	/**
	 * Sends a confirmed event notification.
	 */
	confirmedEventNotification(
		receiver: BACNetAddress,
		eventNotification: EventNotifyDataParams,
		options: ServiceOptions | ErrorCallback,
		next?: ErrorCallback,
	): void {
		next = next || (options as ErrorCallback)
		const settings: ServiceOptions = {
			maxSegments:
				(options as ServiceOptions).maxSegments ||
				MaxSegmentsAccepted.SEGMENTS_65,
			maxApdu:
				(options as ServiceOptions).maxApdu ||
				MaxApduLengthAccepted.OCTETS_1476,
			invokeId:
				(options as ServiceOptions).invokeId || this._getInvokeId(),
		}
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(
			buffer,
			NpduControlPriority.NORMAL_MESSAGE | NpduControlBit.EXPECTING_REPLY,
			receiver,
		)
		baApdu.encodeConfirmedServiceRequest(
			buffer,
			PduType.CONFIRMED_REQUEST,
			ConfirmedServiceChoice.CONFIRMED_EVENT_NOTIFICATION,
			settings.maxSegments,
			settings.maxApdu,
			settings.invokeId,
			0,
			0,
		)
		EventNotifyData.encode(buffer, eventNotification)
		this.sendBvlc(receiver, buffer)
		this._addCallback(settings.invokeId, (err, data) => {
			if (err) {
				return void next(err)
			}
			next()
		})
	}

	/**
	 * The readPropertyResponse call sends a response with information about one of our properties.
	 */
	readPropertyResponse(
		receiver: BACNetAddress,
		invokeId: number,
		objectId: BACNetObjectID,
		property: BACNetPropertyID,
		value: BACNetAppData[] | BACNetAppData,
		options: { forwardedFrom?: string } = {},
	): void {
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(buffer, NpduControlPriority.NORMAL_MESSAGE, receiver)
		baApdu.encodeComplexAck(
			buffer,
			PduType.COMPLEX_ACK,
			ConfirmedServiceChoice.READ_PROPERTY,
			invokeId,
		)

		const valueArray = Array.isArray(value) ? value : [value]

		ReadProperty.encodeAcknowledge(
			buffer,
			objectId,
			property.id,
			property.index,
			valueArray,
		)
		this.sendBvlc(receiver, buffer)
	}

	/**
	 * Sends a response with information about multiple properties.
	 */
	readPropertyMultipleResponse(
		receiver: BACNetAddress,
		invokeId: number,
		values: BACNetReadAccess[],
	): void {
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(buffer, NpduControlPriority.NORMAL_MESSAGE, receiver)
		baApdu.encodeComplexAck(
			buffer,
			PduType.COMPLEX_ACK,
			ConfirmedServiceChoice.READ_PROPERTY_MULTIPLE,
			invokeId,
		)
		ReadPropertyMultiple.encodeAcknowledge(buffer, values)
		this.sendBvlc(receiver, buffer)
	}

	/**
	 * The iAmResponse command is sent as a reply to a whoIs request.
	 */
	iAmResponse(
		receiver: BACNetAddress,
		deviceId: number,
		segmentation: number,
		vendorId: number,
	): void {
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(buffer, NpduControlPriority.NORMAL_MESSAGE, receiver)
		baApdu.encodeUnconfirmedServiceRequest(
			buffer,
			PduType.UNCONFIRMED_REQUEST,
			UnconfirmedServiceChoice.I_AM,
		)
		IAm.encode(
			buffer,
			deviceId,
			this._transport.getMaxPayload(),
			segmentation,
			vendorId,
		)
		this.sendBvlc(receiver, buffer)
	}

	/**
	 * Sends an iHave response.
	 */
	iHaveResponse(
		receiver: BACNetAddress,
		deviceId: BACNetObjectID,
		objectId: BACNetObjectID,
		objectName: string,
	): void {
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(buffer, NpduControlPriority.NORMAL_MESSAGE, receiver)
		baApdu.encodeUnconfirmedServiceRequest(
			buffer,
			PduType.UNCONFIRMED_REQUEST,
			UnconfirmedServiceChoice.I_HAVE,
		)
		IHave.encode(buffer, deviceId, objectId, objectName)
		this.sendBvlc(receiver, buffer)
	}

	/**
	 * Sends a simple acknowledgement response.
	 */
	simpleAckResponse(
		receiver: BACNetAddress,
		service: number,
		invokeId: number,
	): void {
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(buffer, NpduControlPriority.NORMAL_MESSAGE, receiver)
		baApdu.encodeSimpleAck(buffer, PduType.SIMPLE_ACK, service, invokeId)
		this.sendBvlc(receiver, buffer)
	}

	/**
	 * Sends an error response.
	 */
	errorResponse(
		receiver: BACNetAddress,
		service: number,
		invokeId: number,
		errorClass: number,
		errorCode: number,
	): void {
		trace(
			`error response on ${JSON.stringify(receiver)} service: ${JSON.stringify(service)} invokeId: ${invokeId} errorClass: ${errorClass} errorCode: ${errorCode}`,
		)
		trace(
			`error message ${ErrorService.buildMessage({ class: errorClass, code: errorCode })}`,
		)
		const buffer = this._getApduBuffer(receiver)
		baNpdu.encode(buffer, NpduControlPriority.NORMAL_MESSAGE, receiver)
		baApdu.encodeError(buffer, PduType.ERROR, service, invokeId)
		ErrorService.encode(buffer, errorClass, errorCode)
		this.sendBvlc(receiver, buffer)
	}

	/**
	 * Sends a BACnet Virtual Link Control message.
	 */
	sendBvlc(receiver: BACNetAddress | null, buffer: EncodeBuffer): void {
		if (receiver && receiver.forwardedFrom) {
			// Remote node address given, forward to BBMD
			baBvlc.encode(
				buffer.buffer,
				BvlcResultPurpose.FORWARDED_NPDU,
				buffer.offset,
				receiver.forwardedFrom,
			)
		} else if (receiver && receiver.address) {
			// Specific address, unicast
			baBvlc.encode(
				buffer.buffer,
				BvlcResultPurpose.ORIGINAL_UNICAST_NPDU,
				buffer.offset,
			)
		} else {
			// No address, broadcast
			baBvlc.encode(
				buffer.buffer,
				BvlcResultPurpose.ORIGINAL_BROADCAST_NPDU,
				buffer.offset,
			)
		}

		this._send(buffer, receiver)
	}

	/**
	 * The resultResponse is a BVLC-Result message used to respond to certain events, such as BBMD registration.
	 * This message cannot be wrapped for passing through a BBMD, as it is used as a BBMD control message.
	 */
	resultResponse(receiver: BACNetAddress, resultCode: number): void {
		const buffer = this._getApduBuffer()
		baApdu.encodeResult(buffer, resultCode)
		baBvlc.encode(
			buffer.buffer,
			BvlcResultPurpose.BVLC_RESULT,
			buffer.offset,
		)
		this._send(buffer, receiver)
	}

	/**
	 * Unloads the current bacnet instance and closes the underlying UDP socket.
	 */
	close(): void {
		this._transport.close()
	}

	/**
	 * Helper function to take an array of enums and produce a bitstring suitable
	 * for inclusion as a property.
	 * @returns BACnet bitstring object
	 */
	static createBitstring(items: number[]): BACNetBitString {
		let offset = 0
		const bytes: number[] = []
		let bitsUsed = 0

		while (items.length) {
			// Find any values between offset and offset+8, for the next byte
			let value = 0
			items = items.filter((i) => {
				if (i >= offset + 8) {
					return true
				} // leave for future iteration
				value |= 1 << (i - offset)
				bitsUsed = Math.max(bitsUsed, i)
				return false // remove from list
			})
			bytes.push(value)
			offset += 8
		}
		bitsUsed++

		return {
			value: bytes,
			bitsUsed,
		}
	}
}
