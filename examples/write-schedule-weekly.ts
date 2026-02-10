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

const at = (hours: number, minutes: number) => {
	const d = new Date()
	d.setHours(hours, minutes, 0, 0)
	return d
}

const weekly = [
	[
		{
			time: { type: ApplicationTag.TIME, value: at(8, 0) },
			value: { type: ApplicationTag.BOOLEAN, value: true },
		},
		{
			time: { type: ApplicationTag.TIME, value: at(17, 0) },
			value: { type: ApplicationTag.BOOLEAN, value: false },
		},
	],
	[],
	[],
	[],
	[],
	[],
	[],
]

async function main() {
	try {
		await client.writeProperty(
			address,
			{ type: ObjectType.SCHEDULE, instance },
			PropertyIdentifier.WEEKLY_SCHEDULE,
			weekly as any,
			{},
		)
		console.log('write weekly schedule: ok')
	} catch (err) {
		console.error(err)
	} finally {
		client.close()
	}
}

void main()
