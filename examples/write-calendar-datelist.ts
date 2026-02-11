import Bacnet, {
	ApplicationTag,
	ObjectType,
	PropertyIdentifier,
	BACNetCalendarDateListPayload,
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

// DATE_LIST payload:
// - Array of calendar entries
// - Entry type must be one of DATE | DATERANGE | WEEKNDAY
// - DATERANGE value must contain exactly 2 DATE entries
const dateList: BACNetCalendarDateListPayload = [
	{ type: ApplicationTag.DATE, value: new Date(2025, 7, 22) },
	{
		type: ApplicationTag.DATERANGE,
		value: [
			{ type: ApplicationTag.DATE, value: new Date(2026, 1, 19) },
			{ type: ApplicationTag.DATE, value: new Date(2026, 3, 17) },
		],
	},
	{ type: ApplicationTag.WEEKNDAY, value: { month: 2, week: 2, wday: 2 } },
]

void client
	.writeProperty(
		address,
		{ type: ObjectType.CALENDAR, instance },
		PropertyIdentifier.DATE_LIST,
		dateList,
		{},
	)
	.then(() => console.log('DATE_LIST write OK'))
	.catch((err) => console.error('DATE_LIST write failed:', err))
	.finally(() => client.close())
