import * as fs from 'fs'
import * as path from 'path'

/**
 * Minimal .env file loader — populates process.env from a .env file at the
 * repository root if one exists, without overriding a variable the real
 * environment already provides (shell, CI, or a deployment platform always
 * wins). This exists purely for local development convenience and
 * deliberately avoids adding a dependency (e.g. dotenv) for what a dozen
 * lines already does; it never logs or returns the values it loads.
 */
export function loadEnvFile(envPath: string = path.resolve(__dirname, '../../../.env')): void {
  if (!fs.existsSync(envPath)) return

  const contents = fs.readFileSync(envPath, 'utf-8')
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue

    const key = line.slice(0, eqIndex).trim()
    let value = line.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}
