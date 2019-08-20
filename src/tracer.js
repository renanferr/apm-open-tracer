const OpenTracer = require('elastic-apm-node-opentracing')
const { EventEmitter } = require('events')
const opentracing = require('opentracing')
const apm = require('elastic-apm-node')

class Tracer {

    //config example
    // {
    //     serviceName: 'apm-open-tracing',
    //     secretToken: 'T7VeFFYRI1PXhouLB0',
    //     serverUrl: 'https://71874f7b2b1b4145ab4ed2c2f8ac696d.apm.sa-east-1.aws.cloud.es.io:443',
    // }
    constructor(config) {
        this._agent = apm.start(config)
        this._optracer = new OpenTracer(this._agent)
    }

    startSpan(name, opts) {
        return new Span(this._optracer.startSpan(name, opts))
    }
}

class Span {
    constructor(openTracingSpan) {
        this._opSpan = openTracingSpan
        this._finished = false
    }

    log(payload) {
        this._opSpan.log(payload)
    }

    logError(error, kind) {
        this._opSpan.setTag(opentracing.Tags.ERROR, true)
        const payload = { 'event': 'error', 'error.object': error, 'error.kind': kind, 'message': error.message, 'stack': error.stack }

        this._opSpan.log(payload)
    }

    // See: https://github.com/opentracing/specification/blob/master/semantic_conventions.md
    setTag(tag, value) {
        this._opSpan.setTag(tag, value)
    }

    context() {
        return this._opSpan.context()
    }

    finish() {
        this._opSpan.finish()
        this._setFinished(true)
    }

    _setFinished(finished) {
        this._finished = finished
    }

    isFinished() {
        return this._finished
    }
}

Tracer.Tags = opentracing.Tags

module.exports = Tracer