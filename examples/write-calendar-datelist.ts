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

const dateList = [
	{ type: ApplicationTag.DATE, value: new Date(2026, 0, 2) },
	{
		type: ApplicationTag.DATERANGE,
		value: [
			{ type: ApplicationTag.DATE, value: new Date(2026, 0, 10) },
			{ type: ApplicationTag.DATE, value: new Date(2026, 0, 20) },
		],
	},
	{ type: ApplicationTag.WEEKNDAY, value: { month: 2, week: 2, wday: 2 } },
]

async function main() {
	try {
		await client.writeProperty(
			address,
			{ type: ObjectType.CALENDAR, instance },
			PropertyIdentifier.DATE_LIST,
			dateList as any,
			{},
		)
		console.log('write calendar date list: ok')
	} catch (err) {
		console.error(err)
	} finally {
		client.close()
	}
}

void main()
