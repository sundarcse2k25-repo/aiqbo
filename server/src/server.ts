import { createApp } from './app'
import { config, isQboConfigured } from './config/env'
import { logInfo } from './middleware/logger'

const app = createApp(config)

app.listen(config.port, () => {
  logInfo(`AIQBO backend listening on http://localhost:${config.port}`)
  logInfo(`Frontend origin allowed: ${config.frontendOrigin}`)
  logInfo(`QBO configured: ${isQboConfigured(config)} (environment: ${config.qboEnvironment})`)
})
