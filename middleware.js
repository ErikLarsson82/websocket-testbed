const lerp = require('lerp')

const AMOUNT = 10000

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })

const positions = new Array(AMOUNT).fill()

const INTERVAL = 1000

function lerpIt({ from, to, time }) {
  return {
    lon: lerp(from.lon, to.lon, time),
    lat: lerp(from.lat, to.lat, time)
  }
}

setInterval(() => {
  console.log('Updating values', new Date())

  positions.forEach((_, idx) => {
    if (positions[idx] === undefined) {
      positions[idx] = {
        from: {
          lat: 59 + Math.random(),
          lon: 17 + Math.random()
        },
        to: {
          lat: 59 + Math.random(),
          lon: 17 + Math.random()
        },
        time: 0
      }
    }
    positions[idx].time += 0.01

    if (positions[idx].time > 1) {
      positions[idx].from = positions[idx].to
      positions[idx].to = {
        lat: 59 + Math.random(),
        lon: 17 + Math.random()
      }
      positions[idx].time = 0
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
        client.send(JSON.stringify({ type: 'data', data: positions.map(lerpIt) }))
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