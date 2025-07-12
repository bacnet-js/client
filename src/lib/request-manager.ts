import debugLib from 'debug'

import { type NetworkOpResult } from './types'

const debug = debugLib('bacnet:client:requestmanager:debug')
const trace = debugLib('bacnet:client:requestmanager:trace')

class Deferred<T> {
	resolve!: (value: T) => void
	reject!: (err: Error) => void
	promise: Promise<T>
	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
		})
	}
}

interface RequestEntry {
	invokeId: number
	deferred: Deferred<NetworkOpResult>
	expiresAt: number
}

/**
 * In order to keep O(n) operations outside of hot code paths, the values
 * within the `#invokeIds` array are only guaranteed to match the keys of
 * the `#entries` index right after each call to `clear()`. At any other
 * time, the `#invokeIds` array may contain ids of requests that have already
 * been expired or resolved.
 */
export class RequestManager {
	/** Index of pending requests by invokeId */
	#requestsById: Map<number, RequestEntry>

	/** Array of requests ordered by creation time */
	#requestsByTime: RequestEntry[]

	/** Minimum time to wait between scheduled clearings of pending requests */
	#delay: number

	/** Id of the timeout for the next scheduled clearing of pending requests */
	#activeTimeout: NodeJS.Timeout | null

	/**
	 * Local implementation of the global setTimeout function. This can be set
	 * to a custom implementation via the constructor to facilitate mocking in
	 * our unit tests.
	 */
	#setTimeout: typeof setTimeout

	constructor(delay: number, _setTimeout: typeof setTimeout = setTimeout) {
		this.#requestsById = new Map()
		this.#requestsByTime = []
		this.#delay = delay
		this.#activeTimeout = null
		this.#setTimeout = _setTimeout
	}

	add(invokeId: number): Promise<NetworkOpResult> {
		const deferred = new Deferred<NetworkOpResult>()
		const request = {
			invokeId,
			deferred,
			expiresAt: Date.now() + this.#delay,
		}
		this.#requestsById.set(invokeId, request)
		this.#requestsByTime.push(request)
		this.#scheduleClear()
		trace(
			`InvokeId ${invokeId} callback added -> timeout set to ${this.#delay}.`,
		)
		return deferred.promise
	}

	resolve(invokeId: number, err: Error, result?: undefined): boolean
	resolve(
		invokeId: number,
		err: null | undefined,
		result: NetworkOpResult,
	): boolean
	resolve(
		invokeId: number,
		err: Error | null | undefined,
		result?: NetworkOpResult,
	): boolean {
		const request = this.#requestsById.get(invokeId)
		if (request) {
			trace(`InvokeId ${invokeId} found -> call callback`)
			this.#requestsById.delete(invokeId)
			if (err) {
				request.deferred.reject(err)
			} else {
				request.deferred.resolve(result)
			}
			return true
		}
		debug('InvokeId', invokeId, 'not found -> drop package')
		trace(`Stored invokeId: ${Array.from(this.#requestsById.keys())}`)
		return false
	}

	clear = (force?: boolean) => {
		if (this.#activeTimeout !== null) {
			clearTimeout(this.#activeTimeout)
			this.#activeTimeout = null
		}
		const now = Date.now()
		const qty = this.#requestsByTime.length
		// filter() is usually faster than splice() for small-ish arrays
		this.#requestsByTime = this.#requestsByTime.filter((request) => {
			if (!this.#requestsById.has(request.invokeId)) {
				// Request has already been resolved or expired
				return false
			}
			if (force || request.expiresAt <= now) {
				// Request has timed out or we forcefully time it out
				request.deferred.reject(new Error('ERR_TIMEOUT'))
				this.#requestsById.delete(request.invokeId)
				return false
			}
			// Request is still pending
			return true
		})
		debug(`Cleared ${qty - this.#requestsByTime.length} entries.`)
		debug(`There are ${this.#requestsByTime.length} entries pending.`)
		if (!force) {
			this.#scheduleClear()
		}
	}

	#scheduleClear() {
		if (this.#activeTimeout === null && this.#requestsByTime.length > 0) {
			// We schedule the timeout with a minimum delay of 100ms to ensure that
			// we can't saturate the event loop with more than 10 timeouts per second
			// even in a worst case scenario
			const delay = Math.max(
				this.#requestsByTime[0].expiresAt - Date.now(),
				100,
			)
			trace(
				`Scheduling timeout for clearing pending request in ${delay}ms`,
			)
			this.#activeTimeout = this.#setTimeout(this.clear, delay)
		}
	}
}
