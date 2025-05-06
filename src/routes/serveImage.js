import { cache } from 'hono/cache'


export const serveImage = app => {
	app.all( '/m/:hash/:size?', cache({
		cacheControl: 'public, max-age=31536000, immutable',
	}),
	async c => {
		let {
			hash, size = 'full'
		} = c.req.param()
		if( ![
			'full',
			'large',
			'medium',
			'small',
			'tiny'
		].includes( size ) ) {
			size = 'large'
		}

		const baseFileName = ( 'full' === size ) ? `${hash}.jpg` : `${hash}-${size}.jpg`

		let assetObj = await c.env.STORAGE.get( baseFileName )

		if( !assetObj ) {
			return c.json({
				error: `No image matched ID: "${hash}`
			}, 404 )
		}

		c.header( 'Content-Type', 'image/jpeg' )

		return c.body( assetObj.body )
	})
}
