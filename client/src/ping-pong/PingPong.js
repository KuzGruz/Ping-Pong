import { Ball } from './Ball'
import { Player } from './Player'
import { io } from 'socket.io-client'

export class PingPong {
    #options

    #context
    #socket

	#canvasContainer
	#playerNameElement
	#opponentNameElement
	#canvas
	#gameOverElement

    // players
    player
    opponent
    isReferee = false

    // ball
    ball

    // paddles
    #paddlesYOffset = 10
    #computerSpeed = 2

    isGameOver = false
    isOnline = false

    get height () {
    	return this.#options.height || 700
    }

    get width () {
    	return this.#options.width || 500
    }

    get maxScore () {
    	return this.#options.maxScore || 7
    }

    get paddleSize () {
    	return [this.#options.paddleWidth || 50, this.#options.paddleHeight || 10]
    }

    constructor (options = {}) {
    	this.#options = options

    	this.animate = this.animate.bind(this)
    	this.animateOnline = this.animateOnline.bind(this)
    	this.moveHandler = this.moveHandler.bind(this)

    	this.#chooseModal().then(({ name, online }) => {
    		if (online) {
    			this.#connectToServer(name)
    		} else {
    			this.#configureGame({ name, id: 0 }, { name: 'Computer', id: 1 })
    			this.startOfflineGame()
    		}
    	})
    }

    startOfflineGame () {
    	this.#prepareField()
    	this.resetScore()
    	this.resetBall(-1)
    	this.animate()
    	this.#canvas.addEventListener('mousemove', this.moveHandler)
    }

    startOnlineGame () {
    	this.#prepareField()
    	if (this.isReferee) {
    		this.resetScore()
    		this.resetBall(-1)
    	}
    	this.animateOnline()
    	this.#canvas.addEventListener('mousemove', this.moveHandler)
    }

    gameOver (winner) {
    	this.isGameOver = true
    	this.#showGameOverEl(winner)
    }

    resetScore () {
    	this.player.score = 0
    	this.opponent.score = 0
    }

    resetBall (direction) {
    	this.player.markAsUnTouched()
    	this.opponent.markAsUnTouched()
    	this.ball.setDefaultPosition()
    	this.ball.setSpeedY(direction * 5)
    }

    increaseScore (winner) {
    	winner.score++
    	if (this.isOnline) {
    		this.#registerScore()
    	}
    	if (winner.score === this.maxScore) {
    		this.gameOver(winner)
    	}
    }

    animate () {
    	this.#renderCanvas()
    	this.#ballMove()
    	this.#ballBoundaries()
    	this.#computerAI()
    	if (!this.isGameOver) {
    		requestAnimationFrame(this.animate)
    	}
    }

    animateOnline () {
    	this.#renderCanvas()
    	if (this.isReferee) {
    		this.#ballMove()
    		this.#ballBoundaries()
    		this.#registerBallMove()
    	}
    	if (!this.isGameOver) {
    		requestAnimationFrame(this.animateOnline)
    	}
    }

    moveHandler (event) {
    	this.#canvas.style.cursor = 'none'
    	this.player.setX(event.clientX - this.#canvas.getBoundingClientRect().left)
    	const rightBorder = this.width - this.player.paddleWidth
    	if (this.player.x > rightBorder) {
    		this.player.setX(rightBorder)
    	}
    	if (this.isOnline) {
    		this.#registerPaddleMove()
    	}
    }

    #configureGame (player, opponent) {
    	this.#canvasContainer = document.createElement('div')
    	this.#canvasContainer.classList.add('canvas-container')
    	this.#canvas = document.createElement('canvas')
    	this.#context = this.#canvas.getContext('2d')

    	this.#canvas.width = this.width
    	this.#canvas.height = this.height

    	this.ball = new Ball(this.#context, { defaultPosition: [this.width / 2, this.height / 2] })

    	const [paddleWidth, paddleHeight] = this.paddleSize
    	const paddleXOffset = (this.width - paddleWidth) / 2
    	this.player = new Player(this.#context, player.name, player.id, { defaultPosition: [paddleXOffset, this.height - paddleHeight - this.#paddlesYOffset] })
    	this.opponent = new Player(this.#context, opponent.name, opponent.id, { defaultPosition: [paddleXOffset, this.#paddlesYOffset] })

    	this.#playerNameElement = document.createElement('span')
    	this.#playerNameElement.classList.add('name', 'bottom')
    	this.#playerNameElement.textContent = player.name

    	this.#opponentNameElement = document.createElement('span')
    	this.#opponentNameElement.classList.add('name', 'top')
    	this.#opponentNameElement.textContent = opponent.name

    	this.#canvasContainer.appendChild(this.#canvas)
    	this.#canvasContainer.appendChild(this.#opponentNameElement)
    	this.#canvasContainer.appendChild(this.#playerNameElement)

    	if (this.#options.parent) {
    		this.#options.parent.appendChild(this.#canvasContainer)
    	} else {
    		document.body.appendChild(this.#canvasContainer)
    	}
    	this.#renderCanvas()
    }

    #renderCanvas () {
    	// render board
    	this.#context.fillStyle = 'black'
    	this.#context.fillRect(0, 0, this.width, this.height)

    	// render paddles
    	this.player.render()
    	this.opponent.render()

    	// render center line
    	this.#context.beginPath()
    	this.#context.setLineDash([10])
    	this.#context.moveTo(0, this.height / 2)
    	this.#context.lineTo(this.width, this.height / 2)
    	this.#context.strokeStyle = 'grey'
    	this.#context.stroke()

    	// render ball
    	this.ball.render()

    	// render score
    	this.#context.font = '32px Courier New'
    	const scoreXOffset = 20
    	this.#context.fillText(this.player.score.toString(), scoreXOffset, this.height / 2 + 50)
    	this.#context.fillText(this.opponent.score.toString(), scoreXOffset, this.height / 2 - 30)
    }

    #ballMove () {
    	this.ball.moveY(-1)
    	if (this.player.active && this.player.touched) {
    		this.ball.moveX()
    	}
    }

    #ballBoundaries () {
    	const [paddleWidth, paddleHeight] = this.paddleSize

    	// Bounce off Left Wall
    	if (this.ball.x < 0 && this.ball.speedX < 0) {
    		this.ball.reverseSpeedX()
    	}
    	// Bounce off Right Wall
    	if ((this.ball.x + this.ball.radius * 2) > this.width && this.ball.speedX > 0) {
    		this.ball.reverseSpeedX()
    	}
    	// Bounce off player paddle (bottom)
    	if (this.ball.y >= this.height - this.#paddlesYOffset - paddleHeight) {
    		if (this.ball.x > this.player.x && this.ball.x < this.player.x + paddleWidth) {
    			this.player.markAsTouched()
    			// Add Speed on Hit
    			if (this.player.active) {
    				this.ball.setSpeedY(this.ball.speedY - 1)
    				// Max Speed
    				if (this.ball.speedY < -5) {
    					this.ball.setSpeedY(-5)
    					this.#computerSpeed = 6
    				}
    			}
    			this.ball.reverseSpeedY()
    			const trajectoryX = this.ball.x - (this.player.x + this.#paddlesYOffset + paddleHeight)
    			this.ball.setSpeedX(trajectoryX * 0.3)
    		} else if (this.ball.y > this.height) {
    			this.resetBall(-1)
    			this.increaseScore(this.opponent)
    		}
    	}
    	// Bounce off computer paddle (top)
    	if (this.ball.y <= this.#paddlesYOffset + paddleHeight) {
    		if (this.ball.x > this.opponent.x && this.ball.x < this.opponent.x + paddleWidth) {
    			// Add Speed on Hit
    			if (this.player.active) {
    				this.ball.setSpeedY(this.ball.speedY + 1)
    				// Max Speed
    				if (this.ball.speedY > 5) {
    					this.ball.setSpeedY(5)
    				}
    			}
    			this.ball.reverseSpeedY()
    		} else if (this.ball.y < 0) {
    			// Reset Ball, add to Player Score
    			this.resetBall(1)
    			this.increaseScore(this.player)
    		}
    	}
    }

    #computerAI () {
    	if (this.player.active) {
    		const [paddleWidth] = this.paddleSize
    		const currentX = this.opponent.x + paddleWidth / 2
    		const customSpeed = Math.random() > 0.5 ? this.#computerSpeed / 2 : this.#computerSpeed
    		if (currentX - this.#computerSpeed <= this.ball.x && currentX + this.#computerSpeed >= this.ball.x) {
    			return
    		}
    		if (currentX < this.ball.x) {
    			if (this.opponent.x + customSpeed > this.width) {
    				this.opponent.setX(this.width)
    			} else {
    				this.opponent.setX(this.opponent.x + customSpeed)
    			}
    		} else {
    			if (this.opponent.x - customSpeed < 0) {
    				this.opponent.setX(0)
    			} else {
    				this.opponent.setX(this.opponent.x - customSpeed)
    			}
    		}
    	}
    }

    #showGameOverEl (winner) {
    	this.#canvas.hidden = true
    	this.#opponentNameElement.hidden = true
    	this.#playerNameElement.hidden = true
    	this.#gameOverElement = document.createElement('div')
    	this.#gameOverElement.textContent = ''
    	this.#gameOverElement.classList.add('game-over-container')
    	const title = document.createElement('h1')
    	title.textContent = `${winner.name} wins!`
    	const playAgainBtn = document.createElement('button')
    	playAgainBtn.onclick = () => this.isOnline ? this.startOnlineGame() : this.startOfflineGame()
    	playAgainBtn.textContent = 'Play Again'
    	this.#gameOverElement.append(title, playAgainBtn)
    	document.body.appendChild(this.#gameOverElement)
    }

    #prepareField () {
    	this.#gameOverElement?.remove()
    	this.isGameOver = false
    	this.#canvas.hidden = false
    	this.#opponentNameElement.hidden = false
    	this.#playerNameElement.hidden = false
    }

    #chooseModal () {
    	return new Promise((resolve) => {
    		const modal = document.createElement('div')
    		modal.classList.add('modal')
    		const h1 = document.createElement('h1')
    		h1.textContent = 'Ping Pong Game!'
    		const label = document.createElement('label')
    		label.textContent = 'Enter your name:'
    		const input = document.createElement('input')
    		const buttonOnline = document.createElement('button')
    		buttonOnline.textContent = 'Online'
    		const buttonOffline = document.createElement('button')
    		buttonOffline.textContent = 'Offline'

    		modal.appendChild(h1)
    		modal.appendChild(label)
    		label.appendChild(input)
    		modal.appendChild(buttonOnline)
    		modal.appendChild(buttonOffline)

    		document.body.appendChild(modal)

    		buttonOnline.onclick = () => {
    			const name = input.value
    			if (name) {
    				resolve({ name, online: true })
    				modal.remove()
    			}
    		}
    		buttonOffline.onclick = () => {
    			const name = input.value
    			if (name) {
    				resolve({ name: input.value, online: false })
    				modal.remove()
    			}
    		}
    	})
    }

	#renderIntro () {
    	const modal = document.createElement('div')
    	modal.classList.add('modal')
    	const h1 = document.createElement('h1')
    	h1.textContent = 'Waiting for opponent...'
    	modal.appendChild(h1)
    	document.body.appendChild(modal)
    	return modal
    }

    #connectToServer (name) {
    	this.isOnline = true
    	this.#socket = io(this.#options.server)
		const modal = this.#renderIntro()
		this.#socket.emit('ready', name)

    	this.#socket.on('startGame', ({ refereeId, players }) => {
			modal.remove()
    		this.isReferee = this.#socket.id === refereeId
    		const playerIndex = players.findIndex(p => p.id === this.#socket.id)
    		const player = players[playerIndex]
    		const opponent = players[1 - playerIndex]
    		this.#configureGame(player, opponent)
    		this.startOnlineGame()
    	})

    	this.#socket.on('opponentPaddleMove', x => {
    		const [paddleWidth] = this.paddleSize
    		this.opponent.setX(this.width - paddleWidth - x)
    	})

    	this.#socket.on('ballMove', ([x, y]) => {
    		this.ball.setPosition([this.width - x, this.height - y])
    	})

    	this.#socket.on('score', ({ opponent, player }) => {
    		console.log(opponent, player)
    		this.opponent.score = opponent
    		this.player.score = player

    		if (player === this.maxScore) {
    			this.gameOver(this.player)
    		} else if (opponent === this.maxScore) {
    			this.gameOver(this.opponent)
    		}
    	})
	}

    #registerPaddleMove () {
    	this.#socket.emit('paddleMove', this.player.x)
    }

    #registerBallMove () {
    	this.#socket.emit('ballMove', [this.ball.x, this.ball.y])
    }

    #registerScore () {
    	this.#socket.emit('score', { player: this.player.score, opponent: this.opponent.score })
    }

    destroy () {
    	this.#canvas.removeEventListener('mousemove', this.moveHandler)
    }
}
