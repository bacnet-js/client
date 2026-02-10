import Bacnet, { ApplicationTag, ObjectType, PropertyIdentifier } from '../src'

const target = process.argv[2] || '192.168.40.245'
const instance = Number(process.argv[3] || 0)
const port = Number(process.argv[4] || 47808)
const address = { address: `${target}:${port}` }

const client = new Bacnet({ apduTimeout: 4000 })

client.on('error', (err: Error) => {
	console.error(err)
	client.close()
})

const effectivePeriod = [
	{ type: ApplicationTag.DATE, value: new Date(2026, 0, 1) },
	{ type: ApplicationTag.DATE, value: new Date(2026, 11, 31) },
]

async function main() {
	try {
		await client.writeProperty(
			address,
			{ type: ObjectType.SCHEDULE, instance },
			PropertyIdentifier.EFFECTIVE_PERIOD,
			effectivePeriod as any,
			{},
		)
		console.log('write effective period: ok')
	} catch (err) {
		console.error(err)
	} finally {
		client.close()
	}
}

void main()
