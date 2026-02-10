import Bacnet, { ApplicationTag, ObjectType, PropertyIdentifier } from '../src'
import * as process from 'process'

const target = process.argv[2]
const instance = Number.parseInt(process.argv[3] || '0', 10)
const targetPort = Number.parseInt(process.argv[4] || '47808', 10)
const localPort = Number.parseInt(process.argv[5] || '47808', 10)

if (!target) {
	console.error(
		'Usage: ts-node write-calendar-datelist.ts <ip> [instance=0] [targetPort=47808] [localPort=47808]',
	)
	process.exit(1)
}

const client = new Bacnet({ apduTimeout: 4000, port: localPort })
client.on('error', (err) => {
	console.error(err)
	client.close()
})

// DATE_LIST payload:
// - Array of calendar entries
// - Entry type must be one of DATE | DATERANGE | WEEKNDAY
// - DATERANGE value must contain exactly 2 DATE entries
const dateList = [
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
		{ address: `${target}:${targetPort}` },
		{ type: ObjectType.CALENDAR, instance },
		PropertyIdentifier.DATE_LIST,
		dateList as any,
		{},
	)
	.then(() => console.log('DATE_LIST write OK'))
	.catch((err) => console.error('DATE_LIST write failed:', err))
	.finally(() => client.close())
