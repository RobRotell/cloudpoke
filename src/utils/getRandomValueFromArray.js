export const getRandomValueFromArray = values => {
	return values[ Math.floor( Math.random() * values.length ) ]
}
