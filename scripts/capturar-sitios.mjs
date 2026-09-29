/**
 * Captura los dos sitios públicos, en escritorio y en celular, página completa.
 *
 *   npx playwright install chromium   # la primera vez
 *   node scripts/capturar-sitios.mjs
 *
 * Es cómo se ve la marca aplicada, para quien no abre el sitio o necesita la
 * imagen en una presentación. No es una pieza derivada: el sitio cambia sin
 * pasar por aquí, así que estas capturas no entran en `npm run comprobar` y
 * llevan la fecha en la carpeta. Se vuelven a tomar cuando el sitio cambia de
 * forma visible, y la carpeta anterior se borra o se pasa a `historico/`.
 *
 * Antes de capturar se recorre la página hasta abajo: las secciones aparecen
 * con una animación al entrar en pantalla (`components/sitio/revelar.tsx` en
 * el monorepo) y sin recorrerla la captura saldría con huecos.
 */

import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fecha = new Date().toISOString().slice(0, 10)
const SALIDA = path.join(RAIZ, 'aplicaciones', `sitios-${fecha}`)

const PAGINAS = [
  ['empresas-inicio', 'https://www.fintide.com.mx/'],
  ['empresas-servicios', 'https://www.fintide.com.mx/servicios'],
  ['empresas-precios', 'https://www.fintide.com.mx/precios'],
  ['empresas-nosotros', 'https://www.fintide.com.mx/nosotros'],
  ['empresas-contacto', 'https://www.fintide.com.mx/contacto'],
  ['colaboradores-inicio', 'https://colaboradores.fintide.com.mx/'],
  ['colaboradores-como-funciona', 'https://colaboradores.fintide.com.mx/como-funciona'],
  ['colaboradores-costo', 'https://colaboradores.fintide.com.mx/costo'],
  ['colaboradores-mi-empresa', 'https://colaboradores.fintide.com.mx/mi-empresa'],
  ['colaboradores-preguntas', 'https://colaboradores.fintide.com.mx/preguntas']
]

const FORMATOS = [
  ['escritorio', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
  ['movil', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]
]

async function recorrer(pagina) {
  await pagina.evaluate(async () => {
    const paso = Math.floor(window.innerHeight * 0.8)
    for (let y = 0; y < document.body.scrollHeight; y += paso) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 250))
    }
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 400))
  })
}

async function main() {
  await mkdir(SALIDA, { recursive: true })
  const navegador = await chromium.launch()
  try {
    for (const [formato, opciones] of FORMATOS) {
      const contexto = await navegador.newContext({ ...opciones, locale: 'es-MX', reducedMotion: 'reduce' })
      const pagina = await contexto.newPage()
      for (const [nombre, url] of PAGINAS) {
        await pagina.goto(url, { waitUntil: 'networkidle' })
        await recorrer(pagina)
        const destino = path.join(SALIDA, `${nombre}-${formato}.jpg`)
        await pagina.screenshot({ path: destino, fullPage: true, type: 'jpeg', quality: 82 })
        console.log(`  ${path.relative(RAIZ, destino)}`)
      }
      await contexto.close()
    }
  } finally {
    await navegador.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
