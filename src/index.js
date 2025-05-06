import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getEntry } from './routes/getEntry'
import { serveImage } from './routes/serveImage'
import { getEntries } from './routes/getEntries'

const app = new Hono()

app.use( '*', cors() )

;[
	getEntry,
	getEntries,
	serveImage
].forEach( route => route( app ) )

export default {
	fetch: app.fetch,
}
