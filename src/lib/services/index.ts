// Import abstract classes
import { BacnetService, BacnetAckService } from './AbstractServices'

// Import service classes
import AddListElement from './AddListElement'
import AlarmAcknowledge from './AlarmAcknowledge'
import AlarmSummary from './AlarmSummary'
import AtomicReadFile from './AtomicReadFile'
import AtomicWriteFile from './AtomicWriteFile'
import CovNotify from './CovNotify'
import CreateObject from './CreateObject'
import DeleteObject from './DeleteObject'
import DeviceCommunicationControl from './DeviceCommunicationControl'
import ErrorService from './Error'
import EventInformation from './EventInformation'
import EventNotifyData from './EventNotifyData'
import GetEnrollmentSummary from './GetEnrollmentSummary'
import GetEventInformation from './GetEventInformation'
import IAm from './IAm'
import IHave from './IHave'
import LifeSafetyOperation from './LifeSafetyOperation'
import PrivateTransfer from './PrivateTransfer'
import ReadProperty from './ReadProperty'
import ReadPropertyMultiple from './ReadPropertyMultiple'
import ReadRange from './ReadRange'
import RegisterForeignDevice from './RegisterForeignDevice'
import ReinitializeDevice from './ReinitializeDevice'
import SubscribeCov from './SubscribeCov'
import SubscribeProperty from './SubscribeProperty'
import TimeSync from './TimeSync'
import WhoHas from './WhoHas'
import WhoIs from './WhoIs'
import WriteProperty from './WriteProperty'
import WritePropertyMultiple from './WritePropertyMultiple'

// Export abstract classes
export { BacnetService, BacnetAckService }

// Export service classes
export { AddListElement }
export { AlarmAcknowledge }
export { AlarmSummary }
export { AtomicReadFile }
export { AtomicWriteFile }
export { CovNotify }
export { CreateObject }
export { DeleteObject }
export { DeviceCommunicationControl }
export { ErrorService }
export { EventInformation }
export { EventNotifyData }
export { GetEnrollmentSummary }
export { GetEventInformation }
export { IAm }
export { IHave }
export { LifeSafetyOperation }
export { PrivateTransfer }
export { ReadProperty }
export { ReadPropertyMultiple }
export { ReadRange }
export { RegisterForeignDevice }
export { ReinitializeDevice }
export { SubscribeCov }
export { SubscribeProperty }
export { TimeSync }
export { WhoHas }
export { WhoIs }
export { WriteProperty }
export { WritePropertyMultiple }

// Create and export ServicesMap
const ServicesMap: Record<
	string,
	typeof BacnetService | typeof BacnetAckService
> = {
	addListElement: AddListElement,
	alarmAcknowledge: AlarmAcknowledge,
	alarmSummary: AlarmSummary,
	atomicReadFile: AtomicReadFile,
	atomicWriteFile: AtomicWriteFile,
	covNotify: CovNotify,
	covNotifyUnconfirmed: CovNotify,
	createObject: CreateObject,
	deleteObject: DeleteObject,
	deviceCommunicationControl: DeviceCommunicationControl,
	error: ErrorService,
	eventInformation: EventInformation,
	eventNotify: EventNotifyData,
	eventNotifyData: EventNotifyData,
	getEnrollmentSummary: GetEnrollmentSummary,
	getEventInformation: GetEventInformation,
	iAm: IAm,
	iHave: IHave,
	lifeSafetyOperation: LifeSafetyOperation,
	privateTransfer: PrivateTransfer,
	readProperty: ReadProperty,
	readPropertyMultiple: ReadPropertyMultiple,
	readRange: ReadRange,
	registerForeignDevice: RegisterForeignDevice,
	reinitializeDevice: ReinitializeDevice,
	subscribeCov: SubscribeCov,
	subscribeProperty: SubscribeProperty,
	timeSync: TimeSync,
	timeSyncUTC: TimeSync,
	whoHas: WhoHas,
	whoIs: WhoIs,
	writeProperty: WriteProperty,
	writePropertyMultiple: WritePropertyMultiple,
}

export default ServicesMap
