const server = require('http').createServer()
const uuid = require('uuid')
const { GameRoom } = require('./src/GameRoom')
const { Server } = require('socket.io')
require('dotenv').config({ path: './.env' })

const PORT = process.env.PORT || 3000
const io = new Server(server, { cors: { origin: '*' } })
const rooms = []

server.listen(PORT, () => console.log(`Server run op port: ${PORT}...`))

io.on('connection', (socket) => {
	const playerId = socket.id
	let room

	socket.on('ready', name => {
		const existingRoom = rooms.find(r => !r.full)
		if (existingRoom) {
			existingRoom.add({ name, id: playerId })
			room = existingRoom
		} else {
			const newRoom = new GameRoom()
			newRoom.id = uuid.v4()
			newRoom.add({ name, id: playerId })
			rooms.push(newRoom)
			room = newRoom
		}

		socket.join(room.id)

		if (room.full) {
			io.to(room.id).emit('startGame', { players: room.players, refereeId: room.referee })
		}
	})

	// socket.on('disconnect', (reason) => {
	// 	console.log('disconnect')
	// 	// room.remove(playerId)
	// 	// if (!room.players.length) {
	// 	// 	const idx = rooms.indexOf(room)
	// 	// 	rooms.splice(idx, 1)
	// 	// }
	// })

	socket.on('paddleMove', positions => {
		const opponentId = room.players[1 - room.players.findIndex(p => p.id === playerId)].id
		io.to(opponentId).emit('opponentPaddleMove', positions)
	})

	socket.on('ballMove', positions => {
		const opponentId = room.players[1 - room.players.findIndex(p => p.id === playerId)].id
		io.to(opponentId).emit('ballMove', positions)
	})

	socket.on('score', ({ player, opponent }) => {
		const opponentId = room.players[1 - room.players.findIndex(p => p.id === playerId)].id
		io.to(opponentId).emit('score', { player: opponent, opponent: player })
	})
})
