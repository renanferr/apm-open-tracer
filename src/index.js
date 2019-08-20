const express = require('express')
const app = express()
const Tracer = require('./tracer')
const { Tags } = Tracer

app.set('port', process.env.PORT || '8080')


const tracer = new Tracer({
  serviceName: 'apm-open-tracing',
  secretToken: 'T7VeFFYRI1PXhouLB0',
  serverUrl: 'https://71874f7b2b1b4145ab4ed2c2f8ac696d.apm.sa-east-1.aws.cloud.es.io:443',
})

function handleRequestHealthCheck(req, res) {
  const HTTP_STATUS_CODE = 200
  const span = tracer.startSpan('trace-healthcheck')
  span.setTag(Tags.COMPONENT, 'express')
  span.setTag(Tags.HTTP_METHOD, 'GET')
  span.setTag(Tags.HTTP_STATUS_CODE, HTTP_STATUS_CODE)
  span.setTag(Tags.HTTP_URL, 'http://localhost:8080/healthcheck')

  span.finish()
  return res.sendStatus(HTTP_STATUS_CODE)
}

function handleRequestDelay(req, res) {
  const HTTP_STATUS_CODE = 200
  const span = tracer.startSpan('trace-delay')
  span.setTag(Tags.COMPONENT, 'express')
  span.setTag(Tags.HTTP_METHOD, 'GET')
  span.setTag(Tags.HTTP_STATUS_CODE, HTTP_STATUS_CODE)
  span.setTag(Tags.HTTP_URL, 'http://localhost:8080/delay')

  setTimeout(() => {
    span.finish()
    return res.sendStatus(HTTP_STATUS_CODE)
  }, 5000)
}

function handleRequestError(req, res) {
  const span = tracer.startSpan('trace-error')
  const err = new Error("error")
  if (!!err) {
    span.logError(err, 'ExpectedError')
    span.finish()
    return res.status(500).json({ error: { name: err.name, message: err.message, stack: err.stack } })
  }
}

app.get('/healthcheck', handleRequestHealthCheck)
app.get('/delay', handleRequestDelay)
app.get('/error', handleRequestError)

app.listen(app.get('port'), () => {
  console.log("Server running and listening on port " + app.get('port'))
})