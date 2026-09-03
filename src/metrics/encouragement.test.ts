import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const FORBIDDEN = [
  /\bgreat job\b/i,
  /\bkeep it up\b/i,
  /\byou're doing great\b/i,
  /\bgood job\b/i,
  /\bwell done\b/i,
  /\bscore:\s*\d/i,
]

function walk(dir: string, into: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules') continue
      walk(full, into)
    } else if (/\.(ts|tsx)$/.test(name) && !name.includes('.test.')) {
      into.push(full)
    }
  }
  return into
}

describe('no generic encouragement', () => {
  it('never emits praise without a measured number', () => {
    const files = walk(join(process.cwd(), 'src'))
    const hits: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const pattern of FORBIDDEN) {
        if (pattern.test(text)) hits.push(`${file} ${pattern}`)
      }
    }
    expect(hits).toEqual([])
  })
})
