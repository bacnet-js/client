import Bacnet, { ApplicationTag, ObjectType, PropertyIdentifier } from '../src'
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

// EFFECTIVE_PERIOD payload:
// - Array with exactly 2 DATE values: [startDate, endDate]
const effectivePeriod = [
	{ type: ApplicationTag.DATE, value: new Date(2025, 7, 22) },
	{ type: ApplicationTag.DATE, value: new Date(2026, 3, 17) },
]

void client
	.writeProperty(
		address,
		{ type: ObjectType.SCHEDULE, instance },
		PropertyIdentifier.EFFECTIVE_PERIOD,
		effectivePeriod as any,
		{},
	)
	.then(() => console.log('EFFECTIVE_PERIOD write OK'))
	.catch((err) => console.error('EFFECTIVE_PERIOD write failed:', err))
	.finally(() => client.close())
