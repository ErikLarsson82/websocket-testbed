const AMOUNT = 10000

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })

const positions = new Array(AMOUNT).fill()

const INTERVAL = 1000

setInterval(() => {
  console.log('Updating values', new Date())

  positions.forEach((_, idx) => {
    positions[idx] = {
      lat: Math.random(),
      long: Math.random()
    }
  })
}, INTERVAL)

let pulseInterval = null

wss.on('connection', ws => {
  console.log('Client connected')

  if (pulseInterval !== null) {
    console.log('Only one connection allowed')
    return
  }

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'message', message: 'Welcome' }))
    }
  })

  pulseInterval = setInterval(() => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'data', data: positions }))
      }
    })
  }, INTERVAL)
})

wss.on('close', ws => {
  if (pulseInterval !== null) {
    clearInterval(pulseInterval)
    pulseInterval = null
  }
  console.log('Client disconnected')
})