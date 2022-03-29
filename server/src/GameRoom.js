class GameRoom {
	id
    full = false
    players = []
    referee

    add (player) {
    	this.players.push(player)
    	if (!this.referee) {
    		this.referee = player.id
    	}
    	if (this.players.length === 2) {
    		this.full = true
    	}
    }

    remove (id) {
    	this.players = this.players.filter(p => p.id !== id)
    	if (!this.players.length) {
    		return
    	}
    	this.full = false
    	if (this.referee === id) {
    		this.referee = this.players[0].id
    	}
    }
}

module.exports = { GameRoom }
