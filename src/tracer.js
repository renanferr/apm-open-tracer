const OpenTracer = require('elastic-apm-node-opentracing')
const { EventEmitter } = require('events')
const opentracing = require('opentracing')
const apm = require('elastic-apm-node')

class Tracer {

  //config example
  // {
  //     serviceName: 'apm-open-tracing',
  //     secretToken: 'T7VeFFYRI1...',
  //     serverUrl: 'https://71874f7b2....apm.sa-east-1.aws.cloud.es.io:443',
  // }
  constructor(config) {
    this._agent = apm.start(config)
    this._tracer = new OpenTracer(this._agent)
    this.Tags = opentracing.Tags
  }

  startSpan(name, opts) {
    return new Span(this._tracer.startSpan(name, opts))
  }

  decorateExpressMiddleware(fn) {
    if (typeof fn !== 'function') {
      return
    }

    const tracer = this

    return function (req, res, next) {

      const span = tracer.startSpan('trace-healthcheck')

      try {
        var fnReturn = fn.call(fn, req, res, next)
      } catch (e) {
        console.log(e)
        return span._handleThrownError(e)
      }

      span.setTag(tracer.Tags.COMPONENT, 'express')
      span.setTag(tracer.Tags.HTTP_METHOD, req.method)
      span.setTag(tracer.Tags.HTTP_URL, req.url)

      const statusCode = !!fnReturn.statusCode && (typeof fnReturn.statusCode === 'number' ? fnReturn.statusCode : parseInt(fnReturn.statusCode, 10)) 

      if (!!statusCode) {
        span.setTag(tracer.Tags.HTTP_STATUS_CODE, statusCode)

        if (statusCode < 200 || statusCode > 299) {
          console.log(fnReturn)
          // span.logError(fnReturn.body)
        }
      }

      span.finish()
      return fnReturn
    }

  }
}

class Span {
  constructor(openTracingSpan) {
    this._span = openTracingSpan
    this._finished = false
  }

  log(payload) {
    this._span.log(payload)
  }

  logError(error, kind) {
    this.setTag(opentracing.Tags.ERROR, true)
    const payload = { 'event': 'error', 'error.object': error, 'error.kind': kind, 'message': error.message, 'stack': error.stack }
    this.log(payload)
  }

  _handleThrownError(error) {
    this.logError(error)
    this.finish()
  }

  // See: https://github.com/opentracing/specification/blob/master/semantic_conventions.md
  setTag(tag, value) {
    this._span.setTag(tag, value)
  }

  context() {
    return this._span.context()
  }

  finish() {
    this._span.finish()
    this._setFinished(true)
  }

  _setFinished(finished) {
    this._finished = finished
  }

  isFinished() {
    return this._finished
  }
}

module.exports = Tracer