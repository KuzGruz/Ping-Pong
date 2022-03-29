import './public/style.css'
import { PingPong } from './ping-pong/PingPong'

const apiUrl = process.env.API_URL || 'http://localhost:3000'
new PingPong({ server: apiUrl })
