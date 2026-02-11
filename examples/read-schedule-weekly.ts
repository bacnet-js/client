import Bacnet, { ObjectType, PropertyIdentifier } from '../src'

const target = process.argv[2] || '192.168.40.245:47808'
const instance = Number(process.argv[3] || 0)
const localPortArg = process.argv[4]
const address = {
	address: target.includes(':') ? target : `${target}:47808`,
}

const client = new Bacnet(
	localPortArg
		? { apduTimeout: 4000, port: Number(localPortArg) }
		: { apduTimeout: 4000 },
)

client.on('error', (err: Error) => {
	console.error(err)
	client.close()
})

async function main() {
	try {
		const value = await client.readProperty(
			address,
			{ type: ObjectType.SCHEDULE, instance },
			PropertyIdentifier.WEEKLY_SCHEDULE,
		)
		const weekly = (value.values[0]?.value as any[]) || []
		weekly.forEach((day, index) => {
			console.log(`day ${index}:`, day)
		})
	} catch (err) {
		console.error(err)
	} finally {
		client.close()
	}
}

void main()
