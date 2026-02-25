import Bacnet, {
	ApplicationTag,
	ObjectType,
	PropertyIdentifier,
	BACNetWeeklySchedulePayload,
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

// WEEKLY_SCHEDULE payload:
// - Array with exactly 7 items (Monday..Sunday)
// - Each day item must be an array of TimeValue entries
// - TimeValue entry shape: { time: { type: TIME, value: Date }, value: BACnetValue }
const weekly: BACNetWeeklySchedulePayload = [
	[
		{
			time: {
				type: ApplicationTag.TIME,
				value: new Date(2024, 0, 1, 4, 30),
			},
			value: { type: ApplicationTag.UNSIGNED_INTEGER, value: 2 },
		},
	],
	[],
	[],
	[],
	[],
	[],
	[
		{
			time: {
				type: ApplicationTag.TIME,
				value: new Date(2024, 0, 1, 13, 15),
			},
			value: { type: ApplicationTag.UNSIGNED_INTEGER, value: 1 },
		},
	],
]

void client
	.writeProperty(
		address,
		{ type: ObjectType.SCHEDULE, instance },
		PropertyIdentifier.WEEKLY_SCHEDULE,
		weekly,
		{},
	)
	.then(() => console.log('WEEKLY_SCHEDULE write OK'))
	.catch((err) => console.error('WEEKLY_SCHEDULE write failed:', err))
	.finally(() => client.close())
