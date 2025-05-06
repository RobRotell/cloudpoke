import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { z } from 'zod'
import { validator } from 'hono/validator'


const schema = z.object({
	page: z.coerce.number().positive().default( 1 ),
	limit: z.coerce.number().positive().default( 24 ),
	style: z.string().default( '' ),
	search: z.string().default( '' ),
	random: z.coerce.boolean().default( false ),
})


export const getEntries = app => {
	app.get(
		'/entries',
		validator( 'query', ( value, c ) => {
			const parsed = schema.safeParse( value )

			if( !parsed.success ) {
				return c.json({
					errors: parsed.error.issues.map( err => {
						return {
							field: err.path[0],
							type: err.expected,
							message: err.message,
						}
					})
				}, 400 )
			}

			return parsed.data
		}),
		async c => {
			const {
				page, limit, style, search, random
			} = c.req.valid( 'query' )

			let rawEntries = []

			const metadata = {
				total: 0,
				page,
				limit,
			}

			const prisma = new PrismaClient({
				adapter: new PrismaD1( c.env.DB )
			})

			if( random && ( Number.isInteger( limit ) && 0 < limit ) ) {
				rawEntries = await prisma.$queryRaw(
					Prisma.sql`SELECT * FROM Entry ORDER BY RANDOM() LIMIT ${limit}`
				)

				metadata.total = rawEntries.length
				metadata.page = 0
				metadata.limit = 0
			} else {
				const query = {
					orderBy: [
						{
							date: 'desc'
						}
					],
					skip: ( limit * ( page - 1 ) ),
					take: limit,
					where: {}
				}

				if( style.length ) {
					query.where.imageStyle = {
						contains: style
					}
				}

				if( search ) {
					query.where.prompt = {
						contains: search
					}
				}

				rawEntries = await prisma.entry.findMany( query )

				let countQuery = {
					where: query.where
				}

				metadata.total = await prisma.entry.count( countQuery )
			}

			const entries = rawEntries.map( entry => {
				return {
					id: entry.id,
					prompt: entry.prompt,
					hash: entry.hash,
					imageStyle: entry.imageStyle ?? '',
					images: {
						full: `${c.env.ENDPOINT_URL}/m/${entry.hash}`,
						large: `${c.env.ENDPOINT_URL}/m/${entry.hash}/large`,
						medium: `${c.env.ENDPOINT_URL}/m/${entry.hash}/medium`,
						small: `${c.env.ENDPOINT_URL}/m/${entry.hash}/small`,
						tiny: `${c.env.ENDPOINT_URL}/m/${entry.hash}/tiny`,
					}
				}
			})

			return c.json({
				entries,
				metadata,
			})
		}
	)
}
