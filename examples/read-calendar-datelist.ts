import Bacnet, { ObjectType, PropertyIdentifier } from '../src'

const target = process.argv[2] || '192.168.40.245'
const instance = Number(process.argv[3] || 0)
const port = Number(process.argv[4] || 47808)
const address = { address: `${target}:${port}` }

const client = new Bacnet({ apduTimeout: 4000 })

client.on('error', (err: Error) => {
	console.error(err)
	client.close()
})

async function main() {
	try {
		const value = await client.readProperty(
			address,
			{ type: ObjectType.CALENDAR, instance },
			PropertyIdentifier.DATE_LIST,
		)
		const entries = (value.values[0]?.value as any[]) || []
		entries.forEach((entry) => console.log(entry))
	} catch (err) {
		console.error(err)
	} finally {
		client.close()
	}
}

void main()
