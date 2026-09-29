/**
 * Comprueba que la marca guardada aquí es la que se puede reproducir y la que
 * usa el producto.
 *
 *   npm run comprobar                       # reproducibilidad
 *   FINTIDE_MONOREPO=../Fintide npm run comprobar   # y deriva con el monorepo
 *   npm run comprobar -- --probar           # y que cada regla sabe ponerse en rojo
 *
 * Dos preguntas, cada una con su regla:
 *
 * 1. REPRODUCIBILIDAD. Cada pieza derivada —símbolo recortado, iconos,
 *    logotipo, tokens.css, la guía— tiene que salir idéntica de volver a
 *    correr sus guiones sobre sus fuentes. Si alguien retoca un PNG a mano o
 *    edita el CSS en vez del JSON, la pieza deja de ser del original y aquí se
 *    ve.
 *
 * 2. DERIVA CON EL MONOREPO. El producto declara los mismos colores en
 *    `apps/web/src/app/globals.css`, sirve las mismas piezas del símbolo y lleva
 *    el mismo trazo del nombre en `logotipo.tsx`. Si uno cambia sin el otro, la
 *    marca de este repositorio deja de ser la que ve la gente. Solo se revisa
 *    si se le dice dónde está el monorepo; si no, lo dice y no finge un verde.
 *
 * `--probar` existe por lo que pasó en el monorepo: una regla vigilaba tablas
 * que no existían y su verde no significaba nada. Aquí se estropea a propósito
 * una copia —un color, un pixel— y se exige que la regla correspondiente falle.
 */

import { createHash } from 'node:crypto'
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const GUIONES = ['generar-simbolo.mjs', 'generar-logotipo.mjs', 'generar-tokens.mjs', 'generar-guia.mjs']
const DERIVADAS = [
  'simbolo/simbolo.png',
  'simbolo/simbolo-fondo-claro.png',
  'iconos/favicon.ico',
  'iconos/icon-32.png',
  'iconos/apple-icon-180.png',
  'iconos/icono-192.png',
  'iconos/icono-512.png',
  'iconos/icono-maskable-512.png',
  'logotipo/logotipo-fondo-oscuro.svg',
  'logotipo/logotipo-fondo-claro.svg',
  'logotipo/logotipo-fondo-oscuro.png',
  'logotipo/logotipo-fondo-claro.png',
  'logotipo/logotipo-fondo-oscuro@2x.png',
  'logotipo/logotipo-fondo-claro@2x.png',
  'color/tokens.css',
  'guia/index.html'
]

/** Pieza de aquí → dónde vive la misma en el monorepo. */
const EN_MONOREPO = {
  'simbolo/original.jpg': 'assets/marca/simbolo-original.jpg',
  'simbolo/simbolo.png': 'apps/web/public/marca/simbolo.png',
  'simbolo/simbolo-fondo-claro.png': 'apps/web/public/marca/simbolo-fondo-claro.png',
  'iconos/favicon.ico': 'apps/web/src/app/favicon.ico',
  'iconos/icon-32.png': 'apps/web/src/app/icon.png',
  'iconos/apple-icon-180.png': 'apps/web/src/app/apple-icon.png',
  'iconos/icono-192.png': 'apps/web/public/marca/icono-192.png',
  'iconos/icono-512.png': 'apps/web/public/marca/icono-512.png',
  'iconos/icono-maskable-512.png': 'apps/web/public/marca/icono-maskable-512.png',
  'tipografia/jakarta-600.woff': 'assets/tarjetas-sociales/fuentes/jakarta-600.woff',
  'tipografia/jakarta-800.woff': 'assets/tarjetas-sociales/fuentes/jakarta-800.woff'
}

const huella = async (archivo) => createHash('sha256').update(await readFile(archivo)).digest('hex')

/**
 * Si dos piezas son la misma. Los PNG se comparan por lo que se ve —medidas,
 * canales y cada valor de pixel— y no por sus bytes: la compresión de sharp no
 * escribe los mismos bytes en macOS que en Linux aunque la imagen sea idéntica,
 * y comparar bytes pondría el CI en rojo sin que nada hubiera cambiado. Todo lo
 * demás (SVG, ICO, CSS, HTML, fuentes) sí se compara byte a byte.
 */
async function igual(a, b) {
  if (!a.endsWith('.png')) return (await huella(a)) === (await huella(b))
  const [x, y] = await Promise.all([a, b].map((f) => sharp(f).raw().toBuffer({ resolveWithObject: true })))
  return (
    x.info.width === y.info.width &&
    x.info.height === y.info.height &&
    x.info.channels === y.info.channels &&
    x.data.equals(y.data)
  )
}

/** Regla 1. Devuelve la lista de piezas que no salen idénticas de sus guiones. */
export async function reproducibilidad(raiz = RAIZ) {
  const copia = await mkdtemp(path.join(os.tmpdir(), 'fintide-marca-'))
  try {
    for (const entrada of await readdir(raiz)) {
      if (entrada === '.git' || entrada === 'node_modules') continue
      await cp(path.join(raiz, entrada), path.join(copia, entrada), { recursive: true })
    }
    await symlink(path.join(RAIZ, 'node_modules'), path.join(copia, 'node_modules'))
    for (const g of GUIONES) {
      execFileSync(process.execPath, [path.join(copia, 'scripts', g)], { stdio: 'ignore' })
    }
    const fallos = []
    for (const pieza of DERIVADAS) {
      if (!(await igual(path.join(raiz, pieza), path.join(copia, pieza)))) {
        fallos.push(`${pieza}: no sale igual de su guion (¿se editó a mano?)`)
      }
    }
    return fallos
  } finally {
    await rm(copia, { recursive: true, force: true })
  }
}

/** Regla 2. Devuelve las diferencias con el monorepo. */
export async function deriva(monorepo, raiz = RAIZ) {
  const fallos = []

  const tokens = JSON.parse(await readFile(path.join(raiz, 'color/tokens.json'), 'utf8'))
  const css = await readFile(path.join(monorepo, 'apps/web/src/app/globals.css'), 'utf8')
  const enProducto = new Map(
    [...css.matchAll(/--color-([a-z]+-\d+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2].toUpperCase()])
  )
  const aqui = new Map()
  const { estados, ...marca } = tokens.color
  for (const [nombre, { valores }] of Object.entries(marca)) {
    for (const [paso, hex] of Object.entries(valores)) aqui.set(`${nombre}-${paso}`, hex.toUpperCase())
  }
  for (const [nombre, valores] of Object.entries(estados.valores)) {
    for (const [paso, hex] of Object.entries(valores)) aqui.set(`${nombre}-${paso}`, hex.toUpperCase())
  }
  for (const [token, hex] of aqui) {
    const suyo = enProducto.get(token)
    if (suyo === undefined) fallos.push(`--color-${token}: está aquí y no en globals.css`)
    else if (suyo !== hex) fallos.push(`--color-${token}: aquí ${hex}, en el producto ${suyo}`)
  }
  for (const token of enProducto.keys()) {
    if (!aqui.has(token)) fallos.push(`--color-${token}: está en globals.css y no aquí`)
  }

  for (const [pieza, suya] of Object.entries(EN_MONOREPO)) {
    const destino = path.join(monorepo, suya)
    if (!existsSync(destino)) fallos.push(`${pieza}: el monorepo ya no tiene ${suya}`)
    else if (!(await igual(path.join(raiz, pieza), destino))) {
      fallos.push(`${pieza}: distinta de ${suya}`)
    }
  }

  const tsx = await readFile(path.join(monorepo, 'apps/web/src/components/marca/logotipo.tsx'), 'utf8')
  const trazoProducto = tsx.match(/const TRAZO_NOMBRE =\s*'([^']+)'/)?.[1]
  const trazoAqui = (await readFile(path.join(raiz, 'logotipo/nombre.svg'), 'utf8')).match(/ d="([^"]+)"/)?.[1]
  if (!trazoProducto) fallos.push('logotipo.tsx: no se encontró TRAZO_NOMBRE')
  else if (trazoProducto !== trazoAqui) fallos.push('logotipo/nombre.svg: el trazo no es el de logotipo.tsx')

  return fallos
}

/** Estropea una copia a propósito y exige que cada regla lo vea. */
async function probar(monorepo) {
  const resultados = []
  const copia = await mkdtemp(path.join(os.tmpdir(), 'fintide-marca-probar-'))
  try {
    for (const entrada of await readdir(RAIZ)) {
      if (entrada === '.git' || entrada === 'node_modules') continue
      await cp(path.join(RAIZ, entrada), path.join(copia, entrada), { recursive: true })
    }

    // Un icono retocado a mano —un cuadro coral encima—: la reproducibilidad
    // tiene que verlo aunque el archivo siga siendo un PNG válido.
    const icono = path.join(copia, 'iconos/icono-192.png')
    const parche = await sharp({ create: { width: 8, height: 8, channels: 4, background: '#F27457' } }).png().toBuffer()
    await writeFile(icono, await sharp(await readFile(icono)).composite([{ input: parche, left: 90, top: 90 }]).png().toBuffer())
    const r1 = await reproducibilidad(copia)
    resultados.push(['un icono retocado a mano falla la reproducibilidad', r1.some((f) => f.startsWith('iconos/icono-192.png'))])

    // Lo legítimo pasa: el repositorio sin tocar.
    resultados.push(['el repositorio sin tocar pasa la reproducibilidad', (await reproducibilidad(RAIZ)).length === 0])

    if (monorepo) {
      // Un color movido aquí y no allá: la deriva tiene que verlo.
      const ruta = path.join(copia, 'color/tokens.json')
      const t = JSON.parse(await readFile(ruta, 'utf8'))
      t.color.coral.valores['500'] = '#FF0000'
      await writeFile(ruta, JSON.stringify(t, null, 2))
      const r2 = await deriva(monorepo, copia)
      resultados.push(['un color distinto al del producto falla la deriva', r2.some((f) => f.includes('coral-500'))])
      resultados.push(['el repositorio sin tocar no tiene deriva', (await deriva(monorepo, RAIZ)).length === 0])
    }
  } finally {
    await rm(copia, { recursive: true, force: true })
  }
  return resultados
}

async function main() {
  const monorepo = process.env.FINTIDE_MONOREPO ? path.resolve(process.env.FINTIDE_MONOREPO) : null
  let rojo = false

  console.log('==> Reproducibilidad')
  const r = await reproducibilidad()
  if (r.length === 0) console.log(`  [ok]   ${DERIVADAS.length} piezas salen idénticas de sus guiones`)
  for (const f of r) console.log(`  [rojo] ${f}`)
  rojo ||= r.length > 0

  console.log('==> Deriva con el monorepo')
  if (!monorepo) {
    console.log('  [sin revisar] falta FINTIDE_MONOREPO; esto no es un verde')
  } else {
    const d = await deriva(monorepo)
    if (d.length === 0) console.log(`  [ok]   colores, ${Object.keys(EN_MONOREPO).length} piezas y el trazo del nombre coinciden`)
    for (const f of d) console.log(`  [rojo] ${f}`)
    rojo ||= d.length > 0
  }

  if (process.argv.includes('--probar')) {
    console.log('==> Las reglas contra sí mismas')
    for (const [caso, bien] of await probar(monorepo)) {
      console.log(`  [${bien ? 'ok' : 'rojo'}]${bien ? '   ' : ' '}${caso}`)
      rojo ||= !bien
    }
  }

  process.exit(rojo ? 1 : 0)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
