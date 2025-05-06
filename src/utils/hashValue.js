import crypto from 'crypto'


export const hashValue = ( value, withToken = false ) => {
	const hash = crypto.createHash( 'sha256' )

	if( withToken ) {
		hash.update( value + crypto.randomBytes( 60 ).toString( 'hex' ) )
	} else {
		hash.update( value )
	}

	return hash.digest( 'hex' )
}
