import Bacnet, {
	ApplicationTag,
	ObjectType,
	PropertyIdentifier,
	BACNetExceptionSchedulePayload,
} from '../src'
import * as process from 'process'

const target = process.argv[2] || '192.168.40.245:47808'
const instance = Number.parseInt(process.argv[3] || '0', 10)
const localPortArg = process.argv[4]
const address = {
	address: target.includes(':') ? target : `${target}:47808`,
}

const client = new Bacnet(
	localPortArg
		? { apduTimeout: 4000, port: Number(localPortArg) }
		: { apduTimeout: 4000 },
)
client.on('error', (err) => {
	console.error(err)
	client.close()
})

// EXCEPTION_SCHEDULE payload:
// - Array of SpecialEvent entries
// - Entry shape: { date, events, priority }
// - date supports DATE | DATERANGE (exactly 2 dates) | WEEKNDAY
// - events is TimeValue[] with shape: { time: { type: TIME, value: Date }, value: BACnetValue }
const exceptionSchedule: BACNetExceptionSchedulePayload = [
	{
		date: {
			type: ApplicationTag.DATE,
			value: new Date(2025, 11, 4),
		},
		events: [
			{
				time: {
					type: ApplicationTag.TIME,
					value: new Date(2025, 11, 4, 0, 0),
				},
				value: { type: ApplicationTag.REAL, value: 3 },
			},
		],
		priority: { type: ApplicationTag.UNSIGNED_INTEGER, value: 16 },
	},
	{
		date: {
			type: ApplicationTag.WEEKNDAY,
			value: { month: 2, week: 2, wday: 2 },
		},
		events: [
			{
				time: {
					type: ApplicationTag.TIME,
					value: new Date(2025, 11, 4, 0, 20),
				},
				value: { type: ApplicationTag.ENUMERATED, value: 4 },
			},
		],
		priority: { type: ApplicationTag.UNSIGNED_INTEGER, value: 8 },
	},
]

void client
	.writeProperty(
		address,
		{ type: ObjectType.SCHEDULE, instance },
		PropertyIdentifier.EXCEPTION_SCHEDULE,
		exceptionSchedule,
		{},
	)
	.then(() => console.log('EXCEPTION_SCHEDULE write OK'))
	.catch((err) => console.error('EXCEPTION_SCHEDULE write failed:', err))
	.finally(() => client.close())
