
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style'
import { fromLonLat, toLonLat } from 'ol/proj'

import lerp from 'lerp'

const vehicleLayer = new VectorLayer({ source: new VectorSource() })

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      })
    }),
    vehicleLayer
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const OUTPUT_LOG = false
const AMOUNT = 10000
const RENDERING = 1
const OL_RENDERING = 1000
const DELTA = 0.0072

let previousPositions = []
let currentPositions = []

let timeSinceData = 0

const fill = new Fill({ color: 'rgba(255,255,255,0.4)' })
const stroke = new Stroke({ color: '#4a89f3', width: 1.25 })

const features = new Array(OL_RENDERING).fill().map((_, idx) => {
  const style = new Style({
    image: new CircleStyle({
      fill,
      stroke,
      radius: 23
    }),
    fill,
    stroke,
    renderer: (coordinates, state) => {
      // console.log('time since', timeSinceData)
      if (previousPositions.length === 0) return
      const { context } = state
      context.save()
      // const previous = toLonLat([previousPositions[idx].long, previousPositions[idx].lat])
      // debugger
      // const lon = lerp(previous[0], coordinates[0], 0)
      // const lat = lerp(previous[1], coordinates[1], 0)
      context.translate(coordinates[0], coordinates[1])
      context.beginPath()
      context.arc(0,0,10,0,2*Math.PI)
      context.fillStyle = '#0096FF'
      context.fill()
      context.restore()
    }
  })
  const feature = new Feature({
    geometry: new Point(fromLonLat([0, 0]))
  })
  feature.setStyle(style)
  vehicleLayer.getSource().addFeature(feature)
  return feature
})

function tick(ms, delta) {
  timeSinceData += DELTA

  if (previousPositions.length > 0 && currentPositions.length > 0) {
    features.forEach((feature, idx) => {
      const lon = lerp(previousPositions[idx].lon, currentPositions[idx].lon, timeSinceData)
      const lat = lerp(previousPositions[idx].lat, currentPositions[idx].lat, timeSinceData)
      // debugger
      feature.getGeometry().setCoordinates(fromLonLat([lon, lat]))
    })
  }

  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)

const sumStr = (acc, curr) => acc += curr

document.getElementById('container').innerHTML = new Array(AMOUNT).fill()
  .map((_, idx) => `<div id="target-${idx}">-</div>`).reduce(sumStr, "")

const ws = new WebSocket('ws://localhost:8080')

ws.onopen = event => {
  OUTPUT_LOG && console.log('Connection open')
}

ws.onmessage = rawEvent => {

  OUTPUT_LOG && console.log('Message (raw)', rawEvent)

  const event = JSON.parse(rawEvent.data)

  if (event.type === 'message') {
    OUTPUT_LOG && console.log('Message received', event.message)
  }

  if (event.type === 'data') {
    OUTPUT_LOG && console.log('Data received', event.data)
    timeSinceData = 0
    // previousPositions.length = 0
    // currentPositions.length = 0
    previousPositions = currentPositions
    currentPositions = event.data.slice(0, OL_RENDERING)
    event.data.slice(0, RENDERING).forEach((pos, idx) => {
      document.getElementById(`target-${idx}`).innerHTML = `Long: ${pos.lon} - Lat: ${pos.lat}`
    })
    event.data.slice(0, OL_RENDERING).forEach((pos, idx) => {
      // features[idx].getGeometry().setCoordinates(fromLonLat([pos.lon, pos.lat]))
    })
    event.data.length = 0
  }
}

ws.onclose = event => {
  OUTPUT_LOG && console.log('Connection closed')
}
