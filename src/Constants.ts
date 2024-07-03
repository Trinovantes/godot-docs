import path from 'node:path'
import os from 'node:os'

export const RST_DIR = path.resolve('./docs')
export const MARKDOWN_DIR = path.resolve('./src/routes')
export const BASE_PATH = '/godot-docs/'

export const NUM_THREADS = process.env.CI
    ? 4 // GitHub actions have 4 threads
    : os.cpus().length - 1 // Leave 1 thread for main process
