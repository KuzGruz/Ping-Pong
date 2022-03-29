export class Ball {
	#context
	#position
	#speed = [-1, 0]
	#options = {
		defaultPosition: [0, 0],
		color: 'white',
		radius: 5
	}

	get radius () {
		return this.#options.radius
	}

	get x () {
		return this.#position[0]
	}

	get y () {
		return this.#position[1]
	}

	get speedX () {
		return this.#speed[0]
	}

	get speedY () {
		return this.#speed[1]
	}

	get defaultPosition () {
		return JSON.parse((JSON.stringify(this.#options.defaultPosition)))
	}

	constructor (context, options) {
		this.#options = { ...this.#options, ...options }
		this.#context = context
		this.#position = this.defaultPosition
	}

	render () {
		this.#context.beginPath()
		this.#context.fillStyle = this.#options.color
		this.setPosition()
		this.#context.arc(this.x, this.y, this.radius, 2 * Math.PI, false)
		this.#context.fill()
	}

	setPosition (position) {
		this.#position = position || this.#position
	}

	setDefaultPosition () {
		this.#position = this.defaultPosition
	}

	setSpeed (speed = [0, 0]) {
		this.#speed = speed
	}

	setSpeedX (speed) {
		this.#speed = [speed, this.speedY]
	}

	setSpeedY (speed) {
		this.#speed = [this.speedX, speed]
	}

	moveX (direction = 1) {
		this.#position[0] = this.x + (direction * this.speedX)
	}

	moveY (direction = 1) {
		this.#position[1] = this.y + (direction * this.speedY)
	}

	reverseSpeedX () {
		this.#speed[0] = -this.speedX
	}

	reverseSpeedY () {
		this.#speed[1] = -this.speedY
	}
}
