/**
 * Compone el logotipo completo —símbolo y nombre— a partir de sus dos piezas.
 *
 *   node scripts/generar-logotipo.mjs
 *
 * Las piezas no se dibujan aquí. El símbolo sale de `generar-simbolo.mjs` y el
 * nombre es `logotipo/nombre.svg`, las letras de Plus Jakarta Sans convertidas
 * a curvas. Este guion solo las junta con las proporciones que usa el producto
 * (`components/marca/logotipo.tsx` en el monorepo), para que quien necesite el
 * logotipo fuera del sitio —una presentación, un documento, un proveedor— lo
 * tenga igual que en pantalla y no lo arme a ojo.
 *
 * Proporciones, las de la medida `md` del producto multiplicadas por diez:
 * símbolo de 280 de alto, nombre de 150 y un hueco de 90 entre los dos. El
 * símbolo va casi al doble de la altura de mayúscula del nombre: igualado a la
 * mayúscula parecería una letra más de la palabra.
 *
 * El símbolo va incrustado en el SVG como mapa de bits, y es a propósito: tiene
 * degradados y dos cintas que se cruzan translúcidas, y un trazado vectorial de
 * eso sería una versión parecida, no el símbolo.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA = path.join(RAIZ, 'logotipo')

const ALTO_SIMBOLO = 280
const ALTO_NOMBRE = 150
const HUECO = 90
const RELACION_SIMBOLO = 295 / 256
/** Caja de tinta del nombre, en unidades de la fuente. */
const CAJA = { x: 77, y: -757, ancho: 3077, alto: 769 }

/**
 * Sobre fondo oscuro, cinta blanca y nombre blanco. Sobre fondo claro la cinta
 * blanca se pierde, así que va la variante con la cinta en verde azulado y el
 * nombre en `teal-900`, como en la pantalla de acceso en móvil.
 */
const VARIANTES = [
  { nombre: 'logotipo-fondo-oscuro', simbolo: 'simbolo.png', tinta: '#FFFFFF' },
  { nombre: 'logotipo-fondo-claro', simbolo: 'simbolo-fondo-claro.png', tinta: '#0D5152' }
]

async function main() {
  await mkdir(SALIDA, { recursive: true })
  const trazo = (await readFile(path.join(SALIDA, 'nombre.svg'), 'utf8')).match(/ d="([^"]+)"/)[1]

  const anchoSimbolo = ALTO_SIMBOLO * RELACION_SIMBOLO
  const anchoNombre = (ALTO_NOMBRE * CAJA.ancho) / CAJA.alto
  const ancho = Math.ceil(anchoSimbolo + HUECO + anchoNombre)
  const alto = ALTO_SIMBOLO
  const escala = ALTO_NOMBRE / CAJA.alto
  const xNombre = anchoSimbolo + HUECO
  const yNombre = (alto - ALTO_NOMBRE) / 2

  for (const v of VARIANTES) {
    const png = await readFile(path.join(RAIZ, 'simbolo', v.simbolo))
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
      `viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" role="img" aria-label="Fintide">\n` +
      `  <image width="${anchoSimbolo.toFixed(2)}" height="${ALTO_SIMBOLO}" ` +
      `xlink:href="data:image/png;base64,${png.toString('base64')}"/>\n` +
      `  <path fill="${v.tinta}" transform="translate(${xNombre.toFixed(2)} ${yNombre.toFixed(2)}) ` +
      `scale(${escala.toFixed(6)}) translate(${-CAJA.x} ${-CAJA.y})" d="${trazo}"/>\n` +
      `</svg>\n`
    await writeFile(path.join(SALIDA, `${v.nombre}.svg`), svg)

    // PNG a dos resoluciones, con transparencia, para quien no puede usar SVG.
    for (const factor of [1, 2]) {
      await sharp(Buffer.from(svg), { density: 72 * factor })
        .png()
        .toFile(path.join(SALIDA, `${v.nombre}${factor === 1 ? '' : '@2x'}.png`))
    }
    console.log(`  logotipo/${v.nombre}.svg  ${ancho}×${alto}  (+ .png y @2x.png)`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
