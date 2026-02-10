import Bacnet, { ApplicationTag, ObjectType, PropertyIdentifier } from '../src'
import * as process from 'process'

const target = process.argv[2]
const instance = Number.parseInt(process.argv[3] || '0', 10)
const targetPort = Number.parseInt(process.argv[4] || '47808', 10)
const localPort = Number.parseInt(process.argv[5] || '47808', 10)

if (!target) {
	console.error(
		'Usage: ts-node write-schedule-period.ts <ip> [instance=0] [targetPort=47808] [localPort=47808]',
	)
	process.exit(1)
}

const client = new Bacnet({ apduTimeout: 4000, port: localPort })
client.on('error', (err) => {
	console.error(err)
	client.close()
})

const effectivePeriod = [
	{ type: ApplicationTag.DATE, value: new Date(2025, 7, 22) },
	{ type: ApplicationTag.DATE, value: new Date(2026, 3, 17) },
]

void client
	.writeProperty(
		{ address: `${target}:${targetPort}` },
		{ type: ObjectType.SCHEDULE, instance },
		PropertyIdentifier.EFFECTIVE_PERIOD,
		effectivePeriod as any,
		{},
	)
	.then(() => console.log('EFFECTIVE_PERIOD write OK'))
	.catch((err) => console.error('EFFECTIVE_PERIOD write failed:', err))
	.finally(() => client.close())
