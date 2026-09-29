/**
 * Genera `guia/index.html`, la guía visual de la marca.
 *
 *   node scripts/generar-guia.mjs
 *
 * Se abre directo en el navegador, sin servidor. Los colores se escriben desde
 * `color/tokens.json` al generar, no se copian a mano: la guía no puede
 * enseñar un coral distinto del que dice el archivo. Las imágenes se enlazan
 * con rutas relativas al repositorio.
 */

import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Luminancia relativa, para decidir si el rótulo de una muestra va claro u oscuro. */
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function escala(nombre, valores) {
  const n = Object.keys(valores).length
  return `<div class="escala" style="--pasos:${n}">${Object.entries(valores)
    .map(([paso, hex]) => {
      const tinta = luminancia(hex) > 0.4 ? '#182424' : '#FFFFFF'
      return `<div class="muestra" style="background:${hex};color:${tinta}"><b>${esc(nombre)}-${paso}</b><span>${hex}</span></div>`
    })
    .join('')}</div>`
}

async function main() {
  const t = JSON.parse(await readFile(path.join(RAIZ, 'color/tokens.json'), 'utf8'))
  const fotos = (await readdir(path.join(RAIZ, 'fotografia'))).filter((f) => f.endsWith('.jpg')).sort()
  const tarjetas = (await readdir(path.join(RAIZ, 'tarjetas-sociales/compuestas'))).filter((f) => f.endsWith('.jpg')).sort()
  // Las capturas más recientes de los sitios: la carpeta `sitios-AAAA-MM-DD` con la fecha mayor.
  const carpetasSitios = (await readdir(path.join(RAIZ, 'aplicaciones'))).filter((d) => /^sitios-\d{4}-\d{2}-\d{2}$/.test(d)).sort()
  const ultima = carpetasSitios.at(-1)
  const capturas = ultima
    ? (await readdir(path.join(RAIZ, 'aplicaciones', ultima))).filter((f) => f.endsWith('-escritorio.jpg')).sort()
    : []
  const { estados, ...marca } = t.color

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Marca Fintide</title>
<!-- Generado por scripts/generar-guia.mjs. No se edita a mano. -->
<link rel="icon" href="../iconos/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;800&display=swap">
<style>
  @font-face { font-family: "Jakarta local"; font-weight: 600; src: url("../tipografia/jakarta-600.woff") format("woff"); }
  @font-face { font-family: "Jakarta local"; font-weight: 800; src: url("../tipografia/jakarta-800.woff") format("woff"); }
  :root {
    --tinta: ${t.color.slate.valores['900']};
    --tenue: ${t.color.slate.valores['500']};
    --fondo: ${t.color.slate.valores['50']};
    --panel: #FFFFFF;
    --borde: ${t.color.slate.valores['200']};
    --marca: ${t.color.teal.valores['900']};
    --accion: ${t.color.coral.valores['500']};
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--fondo); color: var(--tinta);
    font: 400 16px/1.6 ${t.tipografia.familia.replace('"Plus Jakarta Sans",', '"Plus Jakarta Sans", "Jakarta local",')}; }
  header { background: ${t.degradado['liquido-hondo']}; color: #fff; padding: 56px 16px 64px; }
  header .contenido, main { max-width: 1040px; margin: 0 auto; }
  header img { height: 56px; width: auto; display: block; }
  header p { max-width: 560px; margin: 24px 0 0; color: ${t.color.teal.valores['100']}; }
  main { padding: 0 16px 80px; }
  h2 { font-weight: 600; font-size: 1.5rem; letter-spacing: -0.02em; color: var(--marca); margin: 56px 0 8px; }
  h3 { font-weight: 600; font-size: 1rem; margin: 28px 0 8px; }
  p.uso { color: var(--tenue); margin: 0 0 16px; max-width: 680px; }
  .fila { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
  .lamina { border-radius: ${t.radio.panel}; padding: 32px; display: grid; place-items: center; min-height: 160px;
    box-shadow: ${t.sombra.baja}; border: 1px solid var(--borde); }
  .lamina img { max-width: 100%; height: 48px; width: auto; }
  .lamina.oscura { background: var(--marca); border-color: transparent; }
  .lamina.clara { background: var(--panel); }
  .pie { font-size: 0.8125rem; color: var(--tenue); margin-top: 8px; }
  .escala { display: grid; grid-template-columns: repeat(var(--pasos), minmax(0, 1fr)); border-radius: ${t.radio.panel}; overflow: hidden; box-shadow: ${t.sombra.baja}; }
  .muestra { padding: 36px 12px 12px; display: flex; flex-direction: column; font-size: 0.75rem; min-width: 0; }
  .muestra b { font-weight: 600; }
  .muestra span { font-variant-numeric: tabular-nums; opacity: 0.85; }
  .degradados { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
  .degradados div { height: 120px; border-radius: ${t.radio.panel}; color: #fff; padding: 12px; font-size: 0.8125rem; font-weight: 600; display: flex; align-items: flex-end; }
  .iconos { display: flex; gap: 24px; align-items: flex-end; flex-wrap: wrap; }
  .iconos figure { margin: 0; text-align: center; font-size: 0.75rem; color: var(--tenue); }
  .iconos img { display: block; margin: 0 auto 6px; image-rendering: auto; }
  .tipo { background: var(--panel); border: 1px solid var(--borde); border-radius: ${t.radio.panel}; padding: 24px; }
  .tipo .grande { font-size: 2.5rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; color: var(--marca); }
  .tipo .medio { font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; margin-top: 12px; }
  .tipo .cifra { font-variant-numeric: tabular-nums; font-weight: 600; font-size: 1.25rem; margin-top: 12px; }
  .fotos { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
  .fotos figure { margin: 0; }
  .fotos img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: ${t.radio.control}; display: block; }
  .fotos figcaption { font-size: 0.75rem; color: var(--tenue); margin-top: 4px; overflow-wrap: anywhere; }
  .tarjetas img { aspect-ratio: 1200 / 630; }
  .capturas img { aspect-ratio: 3 / 4; object-position: top; }
  @media (max-width: 720px) { .escala { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  code { font-size: 0.875em; background: ${t.color.teal.valores['50']}; padding: 1px 5px; border-radius: 4px; }
  a { color: var(--marca); }
</style>
</head>
<body>
<header><div class="contenido">
  <img src="../logotipo/logotipo-fondo-oscuro.svg" alt="Fintide">
  <p>La identidad de Fintide en una página: logotipo, color, tipografía e imagen. La fuente de todo está en este repositorio; esta guía se genera a partir de ella.</p>
</div></header>
<main>

<h2>Logotipo</h2>
<p class="uso">El símbolo va a la izquierda y el nombre al lado. Sobre fondo oscuro, cinta blanca y nombre blanco; sobre fondo claro, la variante con la cinta en verde azulado y el nombre en <code>teal-900</code>. No se rediseña, no se recolorea y no se le pone el punto coral que tenía antes.</p>
<div class="fila">
  <div><div class="lamina oscura"><img src="../logotipo/logotipo-fondo-oscuro.svg" alt="Logotipo sobre fondo oscuro"></div><div class="pie"><code>logotipo/logotipo-fondo-oscuro.svg</code></div></div>
  <div><div class="lamina clara"><img src="../logotipo/logotipo-fondo-claro.svg" alt="Logotipo sobre fondo claro"></div><div class="pie"><code>logotipo/logotipo-fondo-claro.svg</code></div></div>
</div>

<h3>Símbolo e iconos</h3>
<p class="uso">A 48 px y menos va la versión aplanada, sobre baldosa verde azulada: a esa medida el cruce translúcido de las cintas es una mancha. El porqué está en <a href="../docs/simbolo.md">docs/simbolo.md</a>.</p>
<div class="iconos">
  <figure><img src="../simbolo/simbolo-fondo-claro.png" height="96" alt=""><code>simbolo-fondo-claro.png</code></figure>
  <figure><img src="../iconos/icono-192.png" width="96" height="96" alt=""><code>icono-192.png</code></figure>
  <figure><img src="../iconos/apple-icon-180.png" width="60" height="60" alt=""><code>apple-icon-180.png</code></figure>
  <figure><img src="../iconos/icon-32.png" width="32" height="32" alt=""><code>icon-32.png</code></figure>
</div>

<h2>Color</h2>
${Object.entries(marca)
  .map(([nombre, g]) => `<h3>${esc(nombre)}</h3><p class="uso">${esc(g.$uso)}</p>${escala(nombre, g.valores)}`)
  .join('\n')}
<h3>Estados</h3>
<p class="uso">${esc(estados.$uso)}</p>
${Object.entries(estados.valores).map(([n, v]) => escala(n, v)).join('<div style="height:8px"></div>')}

<h3>Gráficas</h3>
<p class="uso">${esc(t.grafica.$uso)}</p>
${escala('grafica', t.grafica.valores)}
<p class="uso" style="margin-top:8px"><b>Pendiente:</b> ${esc(t.grafica.$pendiente)}</p>

<h3>Degradados</h3>
<p class="uso">${esc(t.degradado.$uso)}</p>
<div class="degradados">
${Object.entries(t.degradado)
  .filter(([n]) => !n.startsWith('$'))
  .map(([n, v]) => `<div style="background:${v}">--${esc(n)}</div>`)
  .join('\n')}
</div>

<h2>Tipografía</h2>
<p class="uso">${esc(t.tipografia.$uso)}</p>
<div class="tipo">
  <div class="grande">Liquidez para tu equipo</div>
  <div class="medio">Adelanto y crédito de nómina</div>
  <p>Plus Jakarta Sans, en 400 para el cuerpo del texto. Se lee desde el primer instante y deja a los títulos el peso.</p>
  <div class="cifra">$12,345.67</div>
  <p>Las cifras monetarias van con números tabulares. Donde hay un costo va el CAT, con «Sin IVA» pegado a la cifra.</p>
</div>

<h2>Imagen</h2>
<p class="uso">Abstracta: cintas y vidrio en verde azulado y coral. Sin personas, para que ninguna se lea como un cliente real.</p>
<div class="fotos">
${fotos.map((f) => `<figure><img src="../fotografia/${f}" alt="" loading="lazy"><figcaption>${esc(f)}</figcaption></figure>`).join('\n')}
</div>

<h3>Tarjetas sociales</h3>
<div class="fotos tarjetas">
${tarjetas.map((f) => `<figure><img src="../tarjetas-sociales/compuestas/${f}" alt="" loading="lazy"><figcaption>${esc(f)}</figcaption></figure>`).join('\n')}
</div>

${ultima ? `<h2>La marca aplicada</h2>
<p class="uso">Los dos sitios públicos tal como estaban el ${esc(ultima.slice(7))}, en escritorio. Las de celular y las de agosto están en <code>aplicaciones/</code>.</p>
<div class="fotos capturas">
${capturas.map((f) => `<figure><a href="../aplicaciones/${ultima}/${f}"><img src="../aplicaciones/${ultima}/${f}" alt="" loading="lazy"></a><figcaption>${esc(f.replace('-escritorio.jpg', ''))}</figcaption></figure>`).join('\n')}
</div>` : ''}

<h2>Voz</h2>
<p class="uso">En español y sin anglicismos, sin métricas ni testimonios inventados, con el CAT y «Sin IVA» donde hay un costo, y de tú. Las reglas completas, con su porqué, en <a href="../voz/redaccion.md">voz/redaccion.md</a>.</p>

</main>
</body>
</html>
`
  await writeFile(path.join(RAIZ, 'guia/index.html'), html)
  console.log('  guia/index.html')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
