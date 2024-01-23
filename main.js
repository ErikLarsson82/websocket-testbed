
const OUTPUT_LOG = true
const AMOUNT = 10000
const RENDERING = 500

const sumStr = (acc, curr) => acc += curr

document.getElementById('container').innerHTML = new Array(AMOUNT).fill()
  .map((_, idx) => `<div id="target-${idx}">-</div>`).reduce(sumStr, "")

const ws = new WebSocket('ws://localhost:8080')

ws.onopen = event => {
  OUTPUT_LOG && console.log('Connection open')
}

// let positions = []

ws.onmessage = rawEvent => {

  OUTPUT_LOG && console.log('Message (raw)', rawEvent)

  const event = JSON.parse(rawEvent.data)

  if (event.type === 'message') {
    OUTPUT_LOG && console.log('Message received', event.message)
  }

  if (event.type === 'data') {
    OUTPUT_LOG && console.log('Data received', event.data)
    // positions = event.data
    event.data.slice(0, RENDERING).forEach((pos, idx) => {
      document.getElementById(`target-${idx}`).innerHTML = `Long: ${pos.long} - Lat: ${pos.lat}`
    })
    // event.data.length = 0
  }
}

ws.onclose = event => {
  OUTPUT_LOG && console.log('Connection closed')
}