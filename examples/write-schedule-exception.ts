import Bacnet, { ApplicationTag, ObjectType, PropertyIdentifier } from '../src'
import * as process from 'process'

const target = process.argv[2]
const instance = Number.parseInt(process.argv[3] || '0', 10)
const targetPort = Number.parseInt(process.argv[4] || '47808', 10)
const localPort = Number.parseInt(process.argv[5] || '47808', 10)

if (!target) {
	console.error(
		'Usage: ts-node write-schedule-exception.ts <ip> [instance=0] [targetPort=47808] [localPort=47808]',
	)
	process.exit(1)
}

const client = new Bacnet({ apduTimeout: 4000, port: localPort })
client.on('error', (err) => {
	console.error(err)
	client.close()
})

const exceptionSchedule = [
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
		{ address: `${target}:${targetPort}` },
		{ type: ObjectType.SCHEDULE, instance },
		PropertyIdentifier.EXCEPTION_SCHEDULE,
		exceptionSchedule as any,
		{},
	)
	.then(() => console.log('EXCEPTION_SCHEDULE write OK'))
	.catch((err) => console.error('EXCEPTION_SCHEDULE write failed:', err))
	.finally(() => client.close())
