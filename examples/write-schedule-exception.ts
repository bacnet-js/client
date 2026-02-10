import Bacnet, {
	ApplicationTag,
	ObjectType,
	PropertyIdentifier,
} from '../src'

const target = process.argv[2] || '192.168.40.245'
const instance = Number(process.argv[3] || 1)
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

const exceptionSchedule = [
	{
		date: { type: ApplicationTag.DATE, value: new Date(2026, 0, 2) },
		events: [
			{
				time: { type: ApplicationTag.TIME, value: at(6, 0) },
				value: { type: ApplicationTag.BOOLEAN, value: true },
			},
			{
				time: { type: ApplicationTag.TIME, value: at(7, 0) },
				value: { type: ApplicationTag.BOOLEAN, value: false },
			},
		],
		priority: { type: ApplicationTag.UNSIGNED_INTEGER, value: 1 },
	},
	{
		date: { type: ApplicationTag.WEEKNDAY, value: { month: 1, week: 1, wday: 2 } },
		events: [
			{
				time: { type: ApplicationTag.TIME, value: at(8, 0) },
				value: { type: ApplicationTag.ENUMERATED, value: 3 },
			},
		],
		priority: { type: ApplicationTag.UNSIGNED_INTEGER, value: 2 },
	},
]

async function main() {
	try {
		await client.writeProperty(
			address,
			{ type: ObjectType.SCHEDULE, instance },
			PropertyIdentifier.EXCEPTION_SCHEDULE,
			exceptionSchedule as any,
			{},
		)
		console.log('write exception schedule: ok')
	} catch (err) {
		console.error(err)
	} finally {
		client.close()
	}
}

void main()
