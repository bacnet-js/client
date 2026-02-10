import Bacnet, { ApplicationTag, ObjectType, PropertyIdentifier } from '../src'
import * as process from 'process'

const target = process.argv[2]
const instance = Number.parseInt(process.argv[3] || '0', 10)
const targetPort = Number.parseInt(process.argv[4] || '47808', 10)
const localPort = Number.parseInt(process.argv[5] || '47808', 10)

if (!target) {
	console.error(
		'Usage: ts-node write-schedule-weekly.ts <ip> [instance=0] [targetPort=47808] [localPort=47808]',
	)
	process.exit(1)
}

const client = new Bacnet({ apduTimeout: 4000, port: localPort })
client.on('error', (err) => {
	console.error(err)
	client.close()
})

const weekly: any[] = [
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
		{ address: `${target}:${targetPort}` },
		{ type: ObjectType.SCHEDULE, instance },
		PropertyIdentifier.WEEKLY_SCHEDULE,
		weekly as any,
		{},
	)
	.then(() => console.log('WEEKLY_SCHEDULE write OK'))
	.catch((err) => console.error('WEEKLY_SCHEDULE write failed:', err))
	.finally(() => client.close())
