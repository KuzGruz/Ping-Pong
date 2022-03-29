export class Player {
    #context
    #position
    #options = {
    	defaultPosition: [0, 0],
    	color: 'white',
    	width: 50,
    	height: 10,
    	auto: false
    }

    id
    name
    score = 0
    active = false
    touched = false

    get x () {
    	return this.#position[0]
    }

    get y () {
    	return this.#position[1]
    }

    get paddleWidth () {
    	return this.#options.width
    }

    get paddleHeight () {
    	return this.#options.height
    }

    get defaultPosition () {
    	return JSON.parse((JSON.stringify(this.#options.defaultPosition)))
    }

    constructor (context, name, id, options) {
    	this.#options = { ...this.#options, ...options }
    	this.name = name
    	this.id = id
    	this.#context = context
    	this.#position = this.defaultPosition
    }

    render () {
    	this.#context.fillStyle = this.#options.color
    	this.setPosition()
    	this.#context.fillRect(this.x, this.y, this.#options.width, this.#options.height)
    }

    setPosition (position) {
    	this.#position = position || this.#position
    }

    setX (x) {
    	this.active = true
    	this.#position[0] = x
    }

    markAsTouched () {
    	this.touched = true
    }

    markAsUnTouched () {
    	this.touched = false
    }
}
