import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import path from 'node:path'
import cors from 'cors'
import { UPLOADS_ROOT } from './config/paths'

import pinoHttp from 'pino-http'
import { logger, randomID } from './logger'

const allowedOrigins = new Set([
  'https://goldengatemanor.com',
  'https://www.goldengatemanor.com',
  'https://dev.goldengatemanor.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
])

const allowedCorsMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const
const allowedCorsMethodSet = new Set<string>(allowedCorsMethods)

const allowedCorsHeaders = ['content-type', 'authorization', 'x-request-id']
const allowedCorsHeaderSet = new Set<string>(allowedCorsHeaders)

// Routing imports
import mediaRouter from './routes/media.routes'
import eventRouter from './routes/event.routes'
import jobRouter from './routes/job.routes'
import recaptcha from './routes/recaptcha.routes'
import email from './routes/email.routes'
import application from './routes/application.routes'
import contactForm from './routes/contactForm.routes'
import rideRequest from './routes/rideRequest.routes'
import userManagement from './routes/userManagement.routes'
import lead from './routes/lead.routes'
import houses from './routes/houses.routes'
import community from './routes/communityImages.routes'
import crypto from './routes/crypto.routes'
import verify from './routes/verify.routes'
import blogCalendar from './routes/blogCalendar.routes'
import blogPosts from './routes/blogPosts.routes'
import notifications from './routes/notification.routes'

import { errorHandler } from './middlewares/errorHandler'
import { routeLogger } from './middlewares/routeLogs'

const app = express()

const isHealth = (p: string) => /^\/health(?:$|\/)/.test(p)

// behind nginx/Passenger
app.set('trust proxy', true)

app.use(pinoHttp({
  logger,
  autoLogging: false,
  genReqId(req, res) {
    const id = (req.headers['x-request-id'] as string) ?? randomID()
    res.setHeader('X-Request-Id', id)
    return id
  },
  redact: { paths: ['req.headers.authorization', 'req.headers.cookie'], remove: true },
  customProps: (req) => ({ userId: (req as any).user?.uid ?? null, ip: req.ip }),
}))

// Explicit CORS validation + logging so failed preflights are obvious
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin

  if (!origin) return next()

  if (!allowedOrigins.has(origin)) {
    req.log.warn({
      origin,
      method: req.method,
      path: req.originalUrl
    }, 'cors blocked: origin not allowed')

    res.status(403).json({
      success: false,
      message: `CORS blocked: origin not allowed (${origin})`,
      requestId: (req as any).id || res.getHeader('X-Request-Id') || null
    })
    return
  }

  if (req.method === 'OPTIONS') {
    const requestedMethod = String(req.headers['access-control-request-method'] ?? '').toUpperCase()
    const requestedHeadersRaw = String(req.headers['access-control-request-headers'] ?? '')
    const requestedHeaders = requestedHeadersRaw.split(',').map(header => header.trim().toLowerCase()).filter(Boolean)

    const methodAllowed = !requestedMethod || allowedCorsMethodSet.has(requestedMethod)
    const disallowedHeaders = requestedHeaders.filter(header => !allowedCorsHeaderSet.has(header))

    if (!methodAllowed || disallowedHeaders.length > 0) {
      req.log.warn({
        origin,
        path: req.originalUrl,
        requestedMethod: requestedMethod || null,
        requestedHeaders,
        methodAllowed,
        disallowedHeaders,
        allowedMethods: [...allowedCorsMethodSet],
        allowedHeaders: [...allowedCorsHeaderSet]
      }, 'cors blocked: preflight rejected')

      res.status(403).json({
        success: false,
        message: 'CORS blocked: preflight rejected',
        details: {
          origin,
          requestedMethod: requestedMethod || null,
          requestedHeaders,
          methodAllowed,
          disallowedHeaders
        },
        requestId: (req as any).id || res.getHeader('X-Request-Id') || null
      })
      return
    }

    req.log.debug({
      origin,
      path: req.originalUrl,
      requestedMethod: requestedMethod || null,
      requestedHeaders
    }, 'cors preflight allowed')
  }

  next()
})

// CORS for API routes
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true)

    if (allowedOrigins.has(origin)) {
      logger.debug({ origin }, 'CORS origin allowed')
      return cb(null, true)
    }

    logger.warn({ origin }, 'CORS origin rejected')
    return cb(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true,
  methods: [...allowedCorsMethods],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-Filename', 'Content-Disposition'],
  maxAge: 86400
}))

app.use(routeLogger({
  name: 'api',
  skip: (req) =>
    isHealth(req.path) ||
    req.path.startsWith('/uploads')
}))

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const isCorsError = err.message.toLowerCase().includes('cors')

  if (isCorsError) {
    req.log.warn({
      err: {
        message: err.message,
        stack: err.stack
      },
      method: req.method,
      path: req.originalUrl,
      origin: req.headers.origin ?? null,
      accessControlRequestMethod: req.headers['access-control-request-method'] ?? null,
      accessControlRequestHeaders: req.headers['access-control-request-headers'] ?? null
    }, 'cors-error')
  }

  next(err)
})

app.use(express.json())

app.use('/uploads', express.static(UPLOADS_ROOT))

// Serve application form PDFs (background-check, caps, availability-schedule)
const applicationStaticPath = path.resolve(__dirname, 'static', 'application')
app.use('/static/application', express.static(applicationStaticPath))

// Routing
app.use('/api/media', mediaRouter)
app.use('/api/events', eventRouter)
app.use('/api/jobs', jobRouter)
app.use('/api/recaptcha', recaptcha)
app.use('/api/email', email)
app.use('/api/application', application)
app.use('/api/contact-form', contactForm)
app.use('/api/ride-request', rideRequest)
app.use('/api/users', userManagement)
app.use('/api/leads', lead)
app.use('/api/houses', houses)
app.use('/api/community', community)
app.use('/api/crypto', crypto)
app.use('/api/verify', verify)
app.use('/api/calendar', blogCalendar)
app.use('/api/blog-posts', blogPosts)
app.use('/api/notification', notifications)

app.get('/', (_req, res) => {
  res.status(403).send('<h1>Access is not Available.</h1>')
})

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' })
})

app.get('/ping', (req, res) => {
  req.log.info({ msg: 'pong' }, 'route-log')
  res.json({ ok: true })
})

app.get('/boom', (_req, _res) => { throw new Error('kaboom') })

app.use(errorHandler)
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log.error({ err }, 'unhandled-error')
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    requestId: (req as any).id || res.getHeader('X-Request-Id') || null
  })
})

export default app