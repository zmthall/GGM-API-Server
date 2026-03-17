const { spawn } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const SSH_USER = process.env.SSH_USER || 'admin'
const SSH_HOST = process.env.SSH_HOST || 'api.goldengatemanor.com'
const SSH_PORT = process.env.SSH_PORT || '22'

const LOCAL_HOST = process.env.DB_TUNNEL_LOCAL_HOST || '127.0.0.1'
const LOCAL_PORT = process.env.DB_TUNNEL_LOCAL_PORT || '15432'

const REMOTE_HOST = process.env.DB_TUNNEL_REMOTE_HOST || '127.0.0.1'
const REMOTE_PORT = process.env.DB_TUNNEL_REMOTE_PORT || '5432'

const explicitKeyPath = process.env.SSH_KEY_PATH
const homeDir = os.homedir()
const sshDir = path.join(homeDir, '.ssh')

const keyCandidates = explicitKeyPath
  ? [explicitKeyPath]
  : [
      path.join(sshDir, 'ggm_api_windows_ed25519'),
      path.join(sshDir, 'ggm_api_linux_ed25519'),
      path.join(sshDir, 'id_ed25519'),
      path.join(sshDir, 'id_rsa')
    ]

const detectedKeyPath = keyCandidates.find((candidate) => fs.existsSync(candidate))

console.log(`Home directory: ${homeDir}`)
console.log('Checked SSH key paths:')
for (const candidate of keyCandidates) {
  console.log(`- ${candidate} ${fs.existsSync(candidate) ? '(found)' : '(missing)'}`)
}

const sshArgs = [
  '-p',
  SSH_PORT,
  '-o',
  'ExitOnForwardFailure=yes',
  '-N',
  '-L',
  `${LOCAL_HOST}:${LOCAL_PORT}:${REMOTE_HOST}:${REMOTE_PORT}`
]

if (detectedKeyPath) {
  sshArgs.push('-i', detectedKeyPath)
}

sshArgs.push(`${SSH_USER}@${SSH_HOST}`)

console.log(`Opening SSH tunnel ${LOCAL_HOST}:${LOCAL_PORT} -> ${REMOTE_HOST}:${REMOTE_PORT} via ${SSH_USER}@${SSH_HOST}:${SSH_PORT}`)

if (detectedKeyPath) {
  console.log(`Auth mode: SSH key (${detectedKeyPath})`)
} else {
  console.log('Auth mode: password prompt fallback (no local key file found)')
  console.log('If prompted, type your SSH password and press Enter. On Windows, nothing shows while typing.')
}

const sshProcess = spawn('ssh', sshArgs, {
  stdio: 'inherit'
})

let tunnelAnnounced = false
let openTimer = null

sshProcess.on('spawn', () => {
  openTimer = setTimeout(() => {
    tunnelAnnounced = true
    console.log(`Tunnel is open on ${LOCAL_HOST}:${LOCAL_PORT} -> ${REMOTE_HOST}:${REMOTE_PORT}`)
  }, 1000)
})

sshProcess.on('error', (err) => {
  if (openTimer) clearTimeout(openTimer)
  console.error('Failed to start SSH process.')
  console.error(err.message)
  process.exit(1)
})

sshProcess.on('exit', (code, signal) => {
  if (openTimer) clearTimeout(openTimer)

  if (!tunnelAnnounced) {
    console.error('Tunnel did not stay open.')
  }

  if (signal) {
    console.log(`Tunnel closed by signal: ${signal}`)
    process.exit(0)
  }

  console.log(`Tunnel closed with exit code: ${code ?? 0}`)
  process.exit(code ?? 0)
})

process.on('SIGINT', () => {
  console.log('\nClosing tunnel...')
  sshProcess.kill('SIGINT')
})

process.on('SIGTERM', () => {
  console.log('\nClosing tunnel...')
  sshProcess.kill('SIGTERM')
})