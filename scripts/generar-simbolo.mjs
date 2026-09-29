/**
 * Deriva todas las piezas del símbolo de marca a partir del original.
 *
 *   node scripts/generar-simbolo.mjs
 *
 * El original (`simbolo/original.jpg`) es lo que entregó el dueño:
 * el símbolo sobre un verde azulado sólido, con el fondo horneado en el pixel.
 * Así solo sirve sobre ese verde exacto; sobre cualquier otro color aparece un
 * cuadrado. Todo lo que hay aquí sale de ese archivo y nada se dibuja a mano,
 * para que volver a correr el guion no pueda separar las piezas del original.
 *
 * Tres problemas y cómo se resuelven:
 *
 * 1. RECORTE. El fondo es plano, así que el alfa se deduce de la distancia al
 *    color de fondo. Lo que importa no es la máscara sino la desmezcla: cada
 *    pixel del borde es `a*tinta + (1-a)*fondo`, y despejar la tinta es lo que
 *    evita el halo verde que deja recortar un PNG con antialias sobre color.
 *
 * 2. LA CINTA BLANCA DESAPARECE SOBRE FONDO CLARO. Es la que da la forma a la
 *    F. La variante para fondo claro le cambia la tinta al verde azulado
 *    profundo de la marca. No se pinta encima: se resta la tinta blanca y se
 *    suma la oscura (`nuevo = obs + w·s·(oscuro − blanco)`), que es lo mismo
 *    que habría salido de componer la ilustración con la cinta ya oscura, así
 *    que los cruces translúcidos con el coral se oscurecen solos y no hay que
 *    inventarse un color para ellos.
 *
 * 3. EL CRUCE SE VUELVE UNA MANCHA A TAMAÑO DIMINUTO. A 16 px la mezcla del
 *    coral con la blanca es un gris rosado sin forma. Para el favicon se
 *    aplanan las tintas a las tres planas de la marca antes de reducir, y el
 *    símbolo va sobre baldosa verde azulada. Comparación en
 *    `docs/simbolo.md`.
 */
import { mkdir, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ORIGEN = path.join(RAIZ, 'simbolo/original.jpg')
const SIMBOLO = path.join(RAIZ, 'simbolo')
const ICONOS = path.join(RAIZ, 'iconos')

/** Verde del fondo horneado, medido sobre el marco del original. */
const FONDO = [20, 82, 92]
/** Rampa del alfa. El original separa limpio: nada del símbolo baja de 60. */
const ALFA_MIN = 12
const ALFA_MAX = 48

/** Paleta de `apps/web/src/app/globals.css`. */
const TEAL_HONDO = [13, 81, 82] // teal-900, la baldosa y la tinta oscura
const CORAL = [242, 116, 87] // coral-500
const TEAL_VIVO = [20, 184, 184] // teal-500
const BLANCO = [255, 255, 255]

const sujetar = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))

/**
 * Quita el fondo y devuelve RGBA con las tintas ya desmezcladas.
 *
 * Después se queda solo con la mancha grande: el original es un JPEG (con la
 * extensión cambiada, pero JPEG) y su ruido de compresión deja un par de
 * cientos de motas de tres o cuatro pixeles sueltas por el marco.
 */
async function recortarFondo() {
  const { data, info } = await sharp(ORIGEN).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const px = width * height
  const rgba = Buffer.alloc(px * 4)

  for (let i = 0, p = 0; i < px; i++, p += channels) {
    const r = data[p]
    const g = data[p + 1]
    const b = data[p + 2]
    const d = Math.hypot(r - FONDO[0], g - FONDO[1], b - FONDO[2])
    let a = (d - ALFA_MIN) / (ALFA_MAX - ALFA_MIN)
    a = a < 0 ? 0 : a > 1 ? 1 : a
    if (a === 0) continue
    const q = i * 4
    rgba[q] = sujetar((r - (1 - a) * FONDO[0]) / a)
    rgba[q + 1] = sujetar((g - (1 - a) * FONDO[1]) / a)
    rgba[q + 2] = sujetar((b - (1 - a) * FONDO[2]) / a)
    rgba[q + 3] = Math.round(a * 255)
  }

  const visto = new Uint8Array(px)
  const cola = new Int32Array(px)
  let mancha = null
  for (let s = 0; s < px; s++) {
    if (visto[s] || rgba[s * 4 + 3] === 0) continue
    let ini = 0
    let fin = 0
    const miembros = []
    cola[fin++] = s
    visto[s] = 1
    while (ini < fin) {
      const c = cola[ini++]
      miembros.push(c)
      const cx = c % width
      const cy = (c / width) | 0
      const vecinos = [
        cx + 1 < width ? c + 1 : -1,
        cx > 0 ? c - 1 : -1,
        cy + 1 < height ? c + width : -1,
        cy > 0 ? c - width : -1
      ]
      for (const k of vecinos) {
        if (k < 0 || visto[k] || rgba[k * 4 + 3] === 0) continue
        visto[k] = 1
        cola[fin++] = k
      }
    }
    if (!mancha || miembros.length > mancha.length) mancha = miembros
  }

  const limpio = Buffer.alloc(px * 4)
  let x0 = width
  let y0 = height
  let x1 = 0
  let y1 = 0
  for (const c of mancha) {
    limpio.set(rgba.subarray(c * 4, c * 4 + 4), c * 4)
    const cx = c % width
    const cy = (c / width) | 0
    if (cx < x0) x0 = cx
    if (cx > x1) x1 = cx
    if (cy < y0) y0 = cy
    if (cy > y1) y1 = cy
  }

  return {
    rgba: limpio,
    width,
    height,
    caja: { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }
  }
}

/**
 * Cambia la tinta blanca de la cinta por el verde azulado profundo.
 *
 * `w` es cuánta cinta blanca hay en el pixel. La tinta blanca es neutra, así
 * que aporta luz sin croma: cuanto más blanca cubre, más baja el croma
 * respecto al del color de debajo. El croma de referencia se elige por el lado
 * del que cae el pixel — coral o verde azulado — porque las dos tintas de
 * debajo no lo tienen igual de saturado.
 *
 * `s` es el sombreado propio de la cinta, que en el original va del blanco
 * puro a un gris muy claro. Sin él, ese matiz se traduciría en un salto de
 * luminancia mucho mayor sobre la tinta oscura y la cinta saldría manchada.
 */
function tintarParaFondoClaro(rgba, width, height) {
  const out = Buffer.from(rgba)
  for (let i = 0; i < width * height; i++) {
    const q = i * 4
    if (out[q + 3] === 0) continue
    const r = out[q]
    const g = out[q + 1]
    const b = out[q + 2]
    const max = Math.max(r, g, b)
    const croma = max - Math.min(r, g, b)
    const referencia = r >= b ? 175 : 150
    let w = 1 - croma / referencia
    w = w < 0 ? 0 : w > 1 ? 1 : w
    const s = max / 255
    for (let k = 0; k < 3; k++) {
      out[q + k] = sujetar(out[q + k] + w * s * (TEAL_HONDO[k] - BLANCO[k]))
    }
  }
  return out
}

/** Lleva cada pixel a la tinta plana más cercana. Solo para tamaños diminutos. */
function aplanarTintas(rgba, width, height) {
  const tintas = [BLANCO, CORAL, TEAL_VIVO]
  const out = Buffer.from(rgba)
  for (let i = 0; i < width * height; i++) {
    const q = i * 4
    if (out[q + 3] === 0) continue
    let elegida = tintas[0]
    let mejor = Infinity
    for (const t of tintas) {
      const d = (out[q] - t[0]) ** 2 + (out[q + 1] - t[1]) ** 2 + (out[q + 2] - t[2]) ** 2
      if (d < mejor) {
        mejor = d
        elegida = t
      }
    }
    out[q] = elegida[0]
    out[q + 1] = elegida[1]
    out[q + 2] = elegida[2]
  }
  return out
}

/** PNG con paleta: el símbolo tiene pocos colores y pesa la mitad así. */
const comoPng = (imagen) => imagen.png({ palette: true, quality: 90, effort: 10 })

/**
 * Sin paleta. Es solo para lo que acaba dentro del ICO y para `icon.png`: el
 * decodificador de ICO de Next rechaza el PNG indexado con «not in RGBA
 * format» y tumba la compilación entera. En piezas de 48 px o menos la paleta
 * ahorraba medio kilobyte, así que no hay nada que defender; el resto de los
 * iconos sí la usan y ahí sí pesa (el de iOS, 5 kB en vez de 16).
 *
 * `palette: false` va explícito porque en sharp basta con nombrar `effort`,
 * `quality` o `colours` para que la paleta se active sola.
 */
const comoPngPlano = (imagen) => imagen.png({ palette: false, compressionLevel: 9 })

/**
 * El símbolo centrado sobre la baldosa verde azulada de marca.
 *
 * La composición se hace aquí, en enteros, y no con `composite()` de sharp. La
 * de libvips usa instrucciones vectoriales que redondean distinto en ARM y en
 * x86: los iconos de 192 y 512 salían con diferencias de hasta 36 niveles
 * según la computadora que corriera el guion, y una marca que depende de la
 * máquina donde se genera no puede ser la fuente de nadie. Redimensionar y
 * cuantizar sí dan lo mismo en las dos, y eso se sigue haciendo con sharp.
 *
 * La baldosa es opaca, así que el resultado también: cada canal es
 * `(tinta·a + fondo·(255−a) + 127) / 255` en división entera, que es
 * `round(tinta·a/255 + fondo·(1−a/255))` sin pasar por coma flotante.
 */
async function baldosa(fuente, lado, margen, plano = false) {
  const interior = Math.round(lado * (1 - margen * 2))
  const { data: pieza, info } = await sharp(fuente)
    .resize({ width: interior, height: interior, fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const lienzo = Buffer.alloc(lado * lado * 4)
  for (let i = 0; i < lado * lado; i++) {
    lienzo[i * 4] = TEAL_HONDO[0]
    lienzo[i * 4 + 1] = TEAL_HONDO[1]
    lienzo[i * 4 + 2] = TEAL_HONDO[2]
    lienzo[i * 4 + 3] = 255
  }
  // Centrado como lo hacía `gravity: 'center'`: el pixel sobrante va del
  // lado izquierdo y de arriba. Con `floor` el símbolo se corría un pixel y
  // el favicon de 32 cambiaba entero.
  const x0 = Math.ceil((lado - info.width) / 2)
  const y0 = Math.ceil((lado - info.height) / 2)
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const s = (y * info.width + x) * 4
      const a = pieza[s + 3]
      if (a === 0) continue
      const d = ((y0 + y) * lado + x0 + x) * 4
      for (let k = 0; k < 3; k++) {
        lienzo[d + k] = Math.floor((pieza[s + k] * a + lienzo[d + k] * (255 - a) + 127) / 255)
      }
    }
  }
  return (plano ? comoPngPlano : comoPng)(
    sharp(lienzo, { raw: { width: lado, height: lado, channels: 4 } })
  ).toBuffer()
}

/**
 * ICO con varios tamaños dentro, cada uno como PNG.
 *
 * Windows lo admite desde Vista y todos los navegadores vigentes también. El
 * formato BMP del ICO clásico obligaría a escribir la máscara AND a mano y no
 * lo pide nadie.
 */
function empaquetarIco(entradas) {
  const cabecera = Buffer.alloc(6)
  cabecera.writeUInt16LE(0, 0)
  cabecera.writeUInt16LE(1, 2)
  cabecera.writeUInt16LE(entradas.length, 4)
  let desplazamiento = 6 + entradas.length * 16
  const directorio = []
  for (const { lado, datos } of entradas) {
    const e = Buffer.alloc(16)
    e.writeUInt8(lado >= 256 ? 0 : lado, 0)
    e.writeUInt8(lado >= 256 ? 0 : lado, 1)
    e.writeUInt8(0, 2)
    e.writeUInt8(0, 3)
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(datos.length, 8)
    e.writeUInt32LE(desplazamiento, 12)
    desplazamiento += datos.length
    directorio.push(e)
  }
  return Buffer.concat([cabecera, ...directorio, ...entradas.map((e) => e.datos)])
}

const informe = []
async function guardar(destino, datos) {
  await writeFile(destino, datos)
  const { size } = await stat(destino)
  informe.push([path.relative(RAIZ, destino), size])
}

async function main() {
  await mkdir(SIMBOLO, { recursive: true })
  await mkdir(ICONOS, { recursive: true })

  const { rgba, width, height, caja } = await recortarFondo()
  const claro = tintarParaFondoClaro(rgba, width, height)
  const plano = aplanarTintas(rgba, width, height)

  const crudo = (buf) => sharp(buf, { raw: { width, height, channels: 4 } }).extract(caja)

  // Maestros. Los sirve `next/image`, que entrega al navegador la medida que
  // toca, así que este peso se queda en el servidor y no viaja al teléfono.
  // 256 px de alto son cuatro veces el uso más grande que tiene hoy el símbolo
  // —la marca de las tarjetas sociales—, y ocho veces el de las cabeceras.
  const maestroOscuro = await comoPng(crudo(rgba).resize({ height: 256 })).toBuffer()
  const maestroClaro = await comoPng(crudo(claro).resize({ height: 256 })).toBuffer()
  await guardar(path.join(SIMBOLO, 'simbolo.png'), maestroOscuro)
  await guardar(path.join(SIMBOLO, 'simbolo-fondo-claro.png'), maestroClaro)

  // Fuentes intermedias para las baldosas, en memoria.
  const planoGrande = await crudo(plano).resize({ height: 512 }).png().toBuffer()
  const fielGrande = await crudo(rgba).resize({ height: 1024 }).png().toBuffer()

  // Favicon: hasta 48 px va la versión aplanada; por encima, la fiel.
  const ico = empaquetarIco(
    await Promise.all(
      [16, 32, 48].map(async (lado) => ({
        lado,
        datos: await baldosa(planoGrande, lado, 0.08, true)
      }))
    )
  )
  await guardar(path.join(ICONOS, 'favicon.ico'), ico)
  await guardar(path.join(ICONOS, 'icon-32.png'), await baldosa(planoGrande, 32, 0.08, true))

  // Pantalla de inicio del teléfono. iOS no respeta la transparencia y compone
  // sobre negro, así que el icono va sobre baldosa sí o sí.
  await guardar(path.join(ICONOS, 'apple-icon-180.png'), await baldosa(fielGrande, 180, 0.16))
  await guardar(path.join(ICONOS, 'icono-192.png'), await baldosa(fielGrande, 192, 0.16))
  await guardar(path.join(ICONOS, 'icono-512.png'), await baldosa(fielGrande, 512, 0.16))
  // Android recorta el icono con la forma que tenga el sistema y solo garantiza
  // el círculo interior del 80%: esta copia deja ese margen.
  await guardar(path.join(ICONOS, 'icono-maskable-512.png'), await baldosa(fielGrande, 512, 0.26))

  const ancho = Math.max(...informe.map(([n]) => n.length))
  let total = 0
  for (const [nombre, bytes] of informe) {
    total += bytes
    console.log(`  ${nombre.padEnd(ancho)}  ${(bytes / 1024).toFixed(1)} kB`)
  }
  console.log(`\n  ${informe.length} piezas, ${(total / 1024).toFixed(1)} kB en total`)
}

await main()
