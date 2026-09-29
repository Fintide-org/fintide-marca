/**
 * Genera `color/tokens.css` a partir de `color/tokens.json`.
 *
 *   node scripts/generar-tokens.mjs
 *
 * El JSON es la fuente y el CSS se deriva, nunca al revés: si se editan los
 * dos a mano, tarde o temprano dicen colores distintos y nadie sabe cuál vale.
 * Los nombres son los mismos que declara el monorepo en `globals.css` (bloques
 * `@theme` de Tailwind 4), para que copiar un token de aquí allá no requiera
 * traducción.
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export async function tokensCss() {
  const t = JSON.parse(await readFile(path.join(RAIZ, 'color/tokens.json'), 'utf8'))
  const lineas = [
    '/* Generado por scripts/generar-tokens.mjs desde color/tokens.json. No se edita a mano. */',
    '@theme {'
  ]
  const { estados, ...marca } = t.color
  for (const [nombre, { valores }] of Object.entries(marca)) {
    for (const [paso, hex] of Object.entries(valores)) lineas.push(`  --color-${nombre}-${paso}: ${hex};`)
  }
  for (const [nombre, valores] of Object.entries(estados.valores)) {
    for (const [paso, hex] of Object.entries(valores)) lineas.push(`  --color-${nombre}-${paso}: ${hex};`)
  }
  for (const [nombre, valor] of Object.entries(t.sombra)) {
    if (!nombre.startsWith('$')) lineas.push(`  --shadow-${nombre}: ${valor};`)
  }
  for (const [nombre, valor] of Object.entries(t.radio)) {
    if (!nombre.startsWith('$')) lineas.push(`  --radius-${nombre}: ${valor};`)
  }
  lineas.push(`  --font-sans: ${t.tipografia.familia};`, '}', '', ':root {')
  for (const [nombre, valor] of Object.entries(t.degradado)) {
    if (!nombre.startsWith('$')) lineas.push(`  --${nombre}: ${valor};`)
  }
  for (const [nombre, valor] of Object.entries(t.grafica.valores)) lineas.push(`  --grafica-${nombre}: ${valor};`)
  lineas.push('}', '')
  return lineas.join('\n')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await writeFile(path.join(RAIZ, 'color/tokens.css'), await tokensCss())
  console.log('  color/tokens.css')
}
