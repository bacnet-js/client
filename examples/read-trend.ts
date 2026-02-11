import Bacnet, {
	MaxSegmentsAccepted,
	ObjectType,
	PropertyIdentifier,
} from '../src'

const target = process.argv[2] || '192.168.40.245'
const instance = Number(process.argv[3] || 0)
const startIndex = Number(process.argv[4] || 1)
const count = Number(process.argv[5] || 55)
const port = Number(process.argv[6] || 47808)
const address = { address: `${target}:${port}` }

const client = new Bacnet({ apduTimeout: 10000 })

client.on('error', (err: Error) => {
	console.error(err)
	client.close()
})

async function main() {
	try {
		const recordCount = await client.readProperty(
			address,
			{ type: ObjectType.TREND_LOG, instance },
			PropertyIdentifier.RECORD_COUNT,
		)
		console.log('recordCount:', recordCount.values?.[0]?.value)

		const response = await client.readRange(
			address,
			{ type: ObjectType.TREND_LOG, instance },
			startIndex,
			count,
			{ maxSegments: MaxSegmentsAccepted.SEGMENTS_65 },
		)

		// Until readRange typed trend decoding is ported, inspect raw payload.
		if ((response as any).values) {
			console.log((response as any).values)
		} else {
			console.log(response)
			console.log(response.rangeBuffer)
		}
	} catch (err) {
		console.error(err)
	} finally {
		client.close()
	}
}

void main()
