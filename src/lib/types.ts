import {
	type ObjectTypesSupportedBitString,
	type ServicesSupportedBitString,
	type StatusFlagsBitString,
} from './bitstring'

import {
	type ApplicationTag,
	type EventState,
	type EventType,
	type NotifyType,
	type ObjectType,
	type PropertyIdentifier,
	type TimeStamp,
	type EngineeringUnits,
	type DeviceStatus,
	type Segmentation,
	type Reliability,
	type BinaryPV,
	CovType,
} from './enum'

export interface EncodeBuffer {
	buffer: Buffer
	offset: number
}

/**
 * BACnet network address structure.
 */
export interface BACNetAddress {
	/**
	 * The BACnet network, use 0 for local, 1 for remote, 0xffff for broadcast. Default is 0.
	 */
	net?: number
	/** 0 for local, 1 for IP, 2 for MAC, etc. */
	type?: number
	/** IP address or MAC address of the target device. May differ from `address` when behind a proxy */
	adr?: number[]
	/** `<ip>:<port>` */
	forwardedFrom?: string
	/**
	 * The BACnet address `<ip>:<port>`.
	 */
	address?: string
}

/**
 * Decoded Network Protocol Data Unit (NPDU) structure
 * Represents the parsed contents of a BACnet NPDU header according to ASHRAE 135-2020 Section 6.2
 */
export interface DecodedNpdu {
	/** Total length of the NPDU header in bytes */
	len: number

	/**
	 * NPDU control octet containing message type and flags
	 * Bit flags from NpduControlBit enum indicating presence of optional fields
	 */
	funct: number

	/**
	 * Destination network address (optional)
	 * Present when DESTINATION_SPECIFIED bit is set in funct
	 * Contains network number and MAC address for routing
	 */
	destination?: BACNetAddress

	/**
	 * Source network address (optional)
	 * Present when SOURCE_SPECIFIED bit is set in funct
	 * Contains network number and MAC address of originating device
	 */
	source?: BACNetAddress

	/**
	 * Hop count for routed messages
	 * Decremented by each router; message discarded when reaching 0
	 * Only present when destination is specified
	 */
	hopCount: number

	/**
	 * Network layer message type
	 * Values from NetworkLayerMessageType enum for network management messages
	 * Only present when NETWORK_LAYER_MESSAGE bit is set in funct
	 */
	networkMsgType: number

	/**
	 * Vendor identifier for proprietary network messages
	 * Only present for vendor-specific network messages (networkMsgType >= 0x80)
	 * Identifies the vendor for proprietary message interpretation
	 */
	vendorId: number
}

export interface PropertyReference {
	id: PropertyIdentifier
	index?: number
}

/**
 * TODO: when the times comes, drop the default value for the `Tag`
 * paramter to enforce strong typing throughout the entire library.
 */
export interface TypedValue<
	Tag extends ApplicationTag = ApplicationTag,
	Type extends
		ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag],
> {
	type: Tag
	value: Type
}

export interface TransportSettings {
	port?: number
	interface?: string
	broadcastAddress?: string
	reuseAddr?: boolean
}

export interface BACNetObjectID {
	type: ObjectType
	instance: number
}

export interface BACNetPropertyID {
	id: PropertyIdentifier
	index: number
}

export interface BACNetReadAccessSpecification {
	objectId: BACNetObjectID
	properties: BACNetPropertyID[]
}

export interface BACNetBitString {
	bitsUsed: number
	value: number[]
}

export interface BACNetRecipient {
	network: number
	address: number[]
}

export interface BACNetCovSubscription {
	recipient: BACNetRecipient
	subscriptionProcessId: number
	monitoredObjectId: BACNetObjectID
	monitoredProperty: BACNetPropertyID
	issueConfirmedNotifications: boolean
	timeRemaining: number
	covIncrement: number
}

export interface BACNetAlarm {
	objectId: BACNetObjectID
	alarmState: number
	acknowledgedTransitions: BACNetBitString
}

export interface BACNetEvent {
	objectId: BACNetObjectID
	eventState: EventState
	acknowledgedTransitions: BACNetBitString
	eventTimeStamps: Date[]
	notifyType: NotifyType
	eventEnable: BACNetBitString
	eventPriorities: number[]
}

export interface BACNetDevObjRef {
	id: number
	arrayIndex: number
	objectId: BACNetObjectID
	deviceIndentifier: BACNetObjectID
}

/**
 * TODO: when the time comes, drop the default value for the `Tag` generic
 *       parameter to enforce type safety everywhere throughout the library.
 */
export interface BACNetAppData<
	Tag extends ApplicationTag = ApplicationTag,
	Type extends
		ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag],
> {
	type: Tag
	value: Type
	encoding?: number
}

/**
 * Map between BACnet Application Tags and TypeScript types.
 *
 * This interface defines the mapping between each BACnet ApplicationTag
 * and its corresponding TypeScript type. This mapping is used throughout
 * the library to ensure type safety when working with BACnet values.
 *
 * Entries mapping to the `any` type are yet to be typed.
 */
export interface ApplicationTagValueTypeMap {
	[ApplicationTag.NULL]: null
	[ApplicationTag.BOOLEAN]: boolean
	[ApplicationTag.UNSIGNED_INTEGER]: number
	[ApplicationTag.SIGNED_INTEGER]: number
	[ApplicationTag.REAL]: number
	[ApplicationTag.DOUBLE]: number
	[ApplicationTag.OCTET_STRING]: any
	[ApplicationTag.CHARACTER_STRING]: string
	[ApplicationTag.BIT_STRING]:
		| StatusFlagsBitString
		| ServicesSupportedBitString
		| ObjectTypesSupportedBitString
	[ApplicationTag.ENUMERATED]:
		| ObjectType
		| EventState
		| EngineeringUnits
		| PropertyIdentifier
		| DeviceStatus
		| Segmentation
		| Reliability
		| BinaryPV
	[ApplicationTag.DATE]: Date
	[ApplicationTag.TIME]: Date
	[ApplicationTag.OBJECTIDENTIFIER]: BACNetObjectID
	[ApplicationTag.EMPTYLIST]: any
	[ApplicationTag.WEEKNDAY]: any
	[ApplicationTag.DATERANGE]: any
	[ApplicationTag.DATETIME]: any
	[ApplicationTag.TIMESTAMP]: BACNetTimestamp
	[ApplicationTag.ERROR]: any
	[ApplicationTag.DEVICE_OBJECT_PROPERTY_REFERENCE]: DeviceObjPropertyRef
	[ApplicationTag.DEVICE_OBJECT_REFERENCE]: BACNetDevObjRef
	[ApplicationTag.OBJECT_PROPERTY_REFERENCE]: any
	[ApplicationTag.DESTINATION]: any
	[ApplicationTag.RECIPIENT]: BACNetRecipient
	[ApplicationTag.COV_SUBSCRIPTION]: BACNetCovSubscription
	[ApplicationTag.CALENDAR_ENTRY]: any
	[ApplicationTag.WEEKLY_SCHEDULE]: any
	[ApplicationTag.SPECIAL_EVENT]: any
	[ApplicationTag.READ_ACCESS_SPECIFICATION]: any
	[ApplicationTag.READ_ACCESS_RESULT]: any
	[ApplicationTag.LIGHTING_COMMAND]: any
	[ApplicationTag.CONTEXT_SPECIFIC_DECODED]: any
	[ApplicationTag.CONTEXT_SPECIFIC_ENCODED]: any
	[ApplicationTag.LOG_RECORD]: any
}

export interface BACNetPropertyState {
	type: number
	state: number
}

export interface BACNetEventInformation {
	objectId: BACNetObjectID
	eventState: EventState
	acknowledgedTransitions: BACNetBitString
	eventTimeStamps: any[]
	notifyType: NotifyType
	eventEnable: BACNetBitString
	eventPriorities: number[]
}

export interface TimeStampValueTypeMap {
	[TimeStamp.DATETIME]: Date
	[TimeStamp.SEQUENCE_NUMBER]: number
	[TimeStamp.TIME]: Date
}

export interface BACNetTimestamp<T extends TimeStamp = TimeStamp> {
	type: T
	value: TimeStampValueTypeMap[T]
}

export interface Decode<T> {
	len: number
	value: T
}

export interface Tag {
	len: number
	tagNumber: number
	value?: number
}

export interface ObjectId {
	len: number
	objectType: ObjectType
	instance: number
}

export interface ApplicationData extends BACNetAppData {
	len: number
}

export interface BACNetReadAccess {
	objectId: BACNetObjectID
	values: {
		property: BACNetPropertyID
		value: any[]
	}[]
}

export interface ReadAccessDecode {
	len: number
	value: {
		objectId: BACNetObjectID
		values: ReadAccessProperty[]
	}
}

export interface CharacterString extends Decode<string> {
	encoding: number
}

export interface CalendarDate {
	len: number
	year: number
	month: number
	day: number
	wday: number
}

export interface CalendarDateRange {
	len: number
	startDate: Decode<Date>
	endDate: Decode<Date>
}

export interface CalendarWeekDay {
	len: number
	month: number
	week: number
	wday: number
}

export interface Calendar {
	len: number
	value: any[]
}

export interface DeviceObjPropertyRef {
	len: number
	value: {
		objectId: ObjectId
		id: Decode<number>
	}
}

export interface ReadAccessSpec {
	len: number
	value: BACNetReadAccessSpecification
}

export interface CovSubscription {
	len: number
	value: BACNetCovSubscription
}

export interface ContextTagWithLength {
	len: number
	value: boolean
}

export interface ContextCharacterString extends Decode<string> {
	encoding: number
}

export interface BasePacket {
	len: number
	type: number
}

export interface ConfirmedServiceRequest extends BasePacket {
	service: number
	maxSegments: number
	maxApdu: number
	invokeId: number
	sequencenumber: number
	proposedWindowNumber: number
}

export interface UnconfirmedServiceRequest extends BasePacket {
	service: number
}

export interface SimpleAck extends BasePacket {
	service: number
	invokeId: number
}

export interface ComplexAck extends BasePacket {
	service: number
	invokeId: number
	sequencenumber: number
	proposedWindowNumber: number
}

export interface SegmentAck extends BasePacket {
	originalInvokeId: number
	sequencenumber: number
	actualWindowSize: number
}

export interface BACnetError extends BasePacket {
	service: number
	invokeId: number
}

export interface Abort extends BasePacket {
	invokeId: number
	reason: number
}

export interface BvlcPacket {
	len: number
	func: number
	msgLength: number
	originatingIP?: string
}

export interface ClientOptions {
	port?: number
	interface?: string
	transport?: any
	broadcastAddress?: string
	apduTimeout?: number
	reuseAddr?: boolean
}

export interface WhoIsOptions {
	lowLimit?: number
	highLimit?: number
}

export interface ServiceOptions {
	maxSegments?: number
	maxApdu?: number
	invokeId?: number
}

export interface ReadPropertyOptions extends ServiceOptions {
	arrayIndex?: number
}

export interface WritePropertyOptions extends ServiceOptions {
	arrayIndex?: number
	priority?: number
}

export interface IAMResult {
	address: string
	deviceId: number
	maxApdu: number
	segmentation: number
	vendorId: number
}

export interface WhoIsResult {
	address: string
	lowLimit?: number
	highLimit?: number
}

export interface TargetResult {
	target: BACNetAddress
	len: number
}

export type ErrorCallback = (err?: Error) => void

export type DataCallback<T = any> = (err?: Error, result?: T) => void

export interface DecodeAcknowledgeSingleResult {
	len: number
	objectId: BACNetObjectID
	property: {
		id: PropertyIdentifier
		index: number
	}
	values: ApplicationData[]
}

export interface ReadAccessProperty {
	id: PropertyIdentifier
	index: number
	value: ApplicationData[]
}

export interface ReadAccessError {
	errorClass: number
	errorCode: number
}

export interface DecodeAcknowledgeMultipleResult {
	len: number
	values: ReadAccessDecode['value'][]
}

export interface ReadPropertyRequest {
	len: number
	objectId: BACNetObjectID
	property: BACNetPropertyID
}

export interface WritePropertyRequest {
	len: number
	objectId: BACNetObjectID
	value: {
		property: BACNetPropertyID
		value: ApplicationData[]
		priority: number
	}
}

export interface DeviceCommunicationOptions extends ServiceOptions {
	password?: string
}

export interface ReinitializeDeviceOptions extends ServiceOptions {
	password?: string
}

export interface BACnetMessageHeader {
	apduType: number
	expectingReply: boolean
	sender: BACNetAddress
	func?: number
	confirmedService?: boolean
}

export interface BACnetMessageBase {
	len: number
	type?: number
	header?: BACnetMessageHeader
	payload?: any
}

export interface HasService {
	service: number
}

export interface HasInvokeId {
	invokeId: number
}

export interface HasOriginalInvokeId {
	originalInvokeId: number
}

export interface IsSegmentable {
	sequencenumber: number
	proposedWindowNumber: number
}

export type ServiceMessage = BACnetMessageBase & HasService
export type InvokeMessage = BACnetMessageBase & HasInvokeId
export type SegmentableMessage = InvokeMessage & IsSegmentable

export type UnconfirmedServiceRequestMessage = UnconfirmedServiceRequest &
	ServiceMessage
export type ConfirmedServiceRequestMessage = ConfirmedServiceRequest &
	ServiceMessage &
	SegmentableMessage
export type SimpleAckMessage = SimpleAck & InvokeMessage & HasService
export type ComplexAckMessage = ComplexAck & ServiceMessage & SegmentableMessage
export type SegmentAckMessage = SegmentAck &
	BACnetMessageBase &
	HasOriginalInvokeId
export type BACnetErrorMessage = BACnetError & ServiceMessage & InvokeMessage
export type AbortMessage = Abort & InvokeMessage

export type BACnetMessage =
	| UnconfirmedServiceRequestMessage
	| ConfirmedServiceRequestMessage
	| SimpleAckMessage
	| ComplexAckMessage
	| SegmentAckMessage
	| BACnetErrorMessage
	| AbortMessage

export interface BasicServicePayload {
	header?: BACnetMessageHeader
}

export interface SimpleAckPayload extends BasicServicePayload {
	success: boolean
}

export interface CovNotifyPayload extends BasicServicePayload {
	subscriberProcessId: number
	initiatingDeviceId: number
	monitoredObjectId: BACNetObjectID
	timeRemaining: number
	values: Array<{
		property: PropertyReference
		value: BACNetAppData[]
	}>
}

export interface AtomicFilePayload extends BasicServicePayload {
	fileStartPosition: number
	fileData?: Buffer | number[][]
	endOfFile?: boolean
	fileSize?: number
}

export interface SubscribeCovPayload extends BasicServicePayload {
	subscriberProcessId: number
	monitoredObjectId: BACNetObjectID
	issueConfirmedNotifications: boolean
	lifetime: number
}

export interface DeviceCommunicationControlPayload extends BasicServicePayload {
	timeDuration: number
	enable: boolean
	password?: string
}

export interface ReinitializeDevicePayload extends BasicServicePayload {
	reinitializedStateOfDevice: number
	password?: string
}

export interface EventNotificationPayload extends BasicServicePayload {
	processIdentifier: number
	initiatingDeviceIdentifier: BACNetObjectID
	eventObjectIdentifier: BACNetObjectID
	timeStamp: BACNetTimestamp
	notificationClass: number
	priority: number
	eventType: EventType
	messageText?: string
	notifyType: NotifyType
	ackRequired: boolean
	fromState: number
	toState: number
	eventValues: BACNetAppData[]
}

export interface ReadRangePayload extends BasicServicePayload {
	objectId: BACNetObjectID
	propertyId: PropertyIdentifier
	position: number
	count: number
	values: BACNetAppData[]
}

export interface ReadRangeAcknowledge {
	objectId: BACNetObjectID
	property: PropertyIdentifier
	resultFlag: BACNetBitString
	itemCount: number
	rangeBuffer: Buffer
	len: number
}

export interface EnrollmentSummary {
	objectId: BACNetObjectID
	eventType: number
	eventState: number
	priority: number
	notificationClass: number
}

export interface EnrollmentOptions extends ServiceOptions {
	enrollmentFilter?: EnrollmentFilter
	eventStateFilter?: number
	eventTypeFilter?: number
	priorityFilter?: PriorityFilter
	notificationClassFilter?: number
}

export interface EnrollmentFilter {
	objectId: BACNetObjectID
	processId: number
}

export interface PriorityFilter {
	min: number
	max: number
}

export interface EnrollmentSummaryAcknowledge {
	enrollmentSummaries: EnrollmentSummary[]
	len: number
}

export interface EventNotifyDataParams {
	processId: number
	initiatingObjectId: {
		type: number
		instance: number
	}
	eventObjectId: {
		type: number
		instance: number
	}
	timeStamp: {
		type: TimeStamp
		value: Date | number
	}
	notificationClass: number
	priority: number
	eventType: EventType
	messageText?: string
	notifyType: NotifyType
	ackRequired?: boolean
	fromState?: number
	toState: number

	// CHANGE_OF_BITSTRING
	changeOfBitstringReferencedBitString?: BACNetBitString
	changeOfBitstringStatusFlags?: BACNetBitString

	// CHANGE_OF_STATE
	changeOfStateNewState?: BACNetPropertyState
	changeOfStateStatusFlags?: BACNetBitString

	// CHANGE_OF_VALUE
	changeOfValueTag?: CovType
	changeOfValueChangeValue?: number
	changeOfValueChangedBits?: BACNetBitString
	changeOfValueStatusFlags?: BACNetBitString

	// FLOATING_LIMIT
	floatingLimitReferenceValue?: number
	floatingLimitStatusFlags?: BACNetBitString
	floatingLimitSetPointValue?: number
	floatingLimitErrorLimit?: number

	// OUT_OF_RANGE
	outOfRangeExceedingValue?: number
	outOfRangeStatusFlags?: BACNetBitString
	outOfRangeDeadband?: number
	outOfRangeExceededLimit?: number

	// CHANGE_OF_LIFE_SAFETY
	changeOfLifeSafetyNewState?: number
	changeOfLifeSafetyNewMode?: number
	changeOfLifeSafetyStatusFlags?: BACNetBitString
	changeOfLifeSafetyOperationExpected?: number

	// BUFFER_READY
	bufferReadyBufferProperty?: BACNetDevObjRef
	bufferReadyPreviousNotification?: number
	bufferReadyCurrentNotification?: number

	// UNSIGNED_RANGE
	unsignedRangeExceedingValue?: number
	unsignedRangeStatusFlags?: BACNetBitString
	unsignedRangeExceededLimit?: number
}

export interface EventNotifyDataResult extends EventNotifyDataParams {
	len: number
}

export interface ObjectOperationPayload extends BasicServicePayload {
	objectId: BACNetObjectID
	propertyValues?: Array<{
		property: PropertyReference
		value: BACNetAppData[]
		priority?: number
	}>
}

export interface ListElementOperationPayload extends BasicServicePayload {
	objectId: BACNetObjectID
	propertyId: PropertyIdentifier
	arrayIndex: number
	listOfElements: BACNetAppData[]
}

export interface PrivateTransferPayload extends BasicServicePayload {
	vendorId: number
	serviceNumber: number
	data: any
}

export interface RegisterForeignDevicePayload extends BasicServicePayload {
	ttl: number
}

export interface WhoHasPayload extends BasicServicePayload {
	lowLimit?: number
	highLimit?: number
	objectId?: BACNetObjectID
	objectName?: string
}

export interface IHavePayload extends BasicServicePayload {
	deviceId: BACNetObjectID
	objectId: BACNetObjectID
	objectName: string
}

export interface TimeSyncPayload extends BasicServicePayload {
	dateTime: Date
}

export type ServiceResponse<T> = (content: {
	header?: BACnetMessageHeader
	payload: T
}) => void

export interface BacnetService {
	encode: (buffer: EncodeBuffer, ...args: any[]) => void
	decode: (buffer: Buffer, offset: number, apduLen: number) => Decode<any>
}

export interface PropertyResult {
	id: PropertyIdentifier
	index: number
	value: ApplicationData[]
}

export interface DeviceObjectResult {
	values: Array<{
		objectId: BACNetObjectID
		values: PropertyResult[]
	}>
}

export interface WritePropertyMultipleValue {
	property: PropertyReference
	value: BACNetAppData[]
	priority: number
}

export interface WritePropertyMultipleObject {
	objectId: BACNetObjectID
	values: WritePropertyMultipleValue[]
}

export interface DecodeAtomicWriteFileResult {
	len: number
	isStream: boolean
	position: number
}

export interface DecodeAtomicReadFileResult {
	len: number
	endOfFile: boolean
	isStream: boolean
	position: number
	buffer: Buffer
}
