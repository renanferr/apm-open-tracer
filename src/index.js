const express = require('express')
const app = express()
const Tracer = require('./tracer')

app.set('port', process.env.PORT || '8080')

const tracer = new Tracer({
  serviceName: 'apm-node-test',
  secretToken: 'ag7L0WIrXc2p08Noaq',
  serverUrl: 'https://3203596c693b428697a6e59d288b97cc.apm.sa-east-1.aws.cloud.es.io:443',
})

const Tags = tracer.Tags

function handleRequestHealthCheck(req, res) {
  const HTTP_STATUS_CODE = 200
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
  const err = new Error("error")
  // self.test()
  // throw err
  // span.logError(err, 'ExpectedError')
  // span.finish()
  return res.status(500).json({ error: { name: err.name, message: err.message, stack: err.stack } })
}

app.get('/healthcheck', tracer.decorateExpress(handleRequestHealthCheck))
app.get('/delay', handleRequestDelay)
app.get('/error', tracer.decorateExpress(handleRequestError))

app.listen(app.get('port'), () => {
  console.log("Server running and listening on port " + app.get('port'))
})