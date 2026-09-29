# Marca Fintide

**La fuente canónica de la identidad de Fintide.** Aquí están el símbolo, el
logotipo, el color, la tipografía, la iconografía, la imagen, la voz y cómo se
ve todo aplicado. Si algo de la marca dice una cosa aquí y otra en el producto,
una presentación o un proveedor, **vale lo de aquí**, y lo otro se corrige.

Para verla sin leer nada, abre **`guia/index.html`** en el navegador. No hace
falta instalar nada.

## Qué hay

| Carpeta | Qué guarda | Para quién |
| --- | --- | --- |
| `simbolo/` | `original.jpg`, el símbolo tal como lo entregó el dueño, y los dos maestros recortados: `simbolo.png` (fondo oscuro) y `simbolo-fondo-claro.png` | Todos |
| `logotipo/` | El logotipo completo en SVG y PNG (1× y 2×) para fondo oscuro y claro, y `nombre.svg`, el nombre solo en curvas | Todos |
| `iconos/` | Favicon, icono de iOS y los tres del manifiesto de Android | Desarrollo |
| `color/` | `tokens.json`, la fuente de la paleta, las gráficas, sombras, radios y degradados, y `tokens.css`, derivado para Tailwind 4 | Diseño, desarrollo |
| `tipografia/` | Plus Jakarta Sans 600 y 800 con su licencia, y qué peso va dónde | Todos |
| `iconografia/` | Lucide: cómo se usa y los 60 iconos que usa el producto | Diseño, desarrollo |
| `fotografia/` | Las diez imágenes abstractas de la marca y dónde va cada una | Todos |
| `tarjetas-sociales/` | Fondos y tarjetas terminadas (1200×630) de cada página | Comunicación |
| `aplicaciones/` | Capturas de los dos sitios en escritorio y celular: las de hoy y las de agosto, antes del símbolo | Todos |
| `voz/` | Cómo escribe la marca, y por qué casi todo tiene consecuencia regulatoria | Todos |
| `docs/` | Por qué el símbolo se recortó y se aplanó como se hizo | Diseño |
| `guia/` | La guía visual, generada | Todos |

### Lo que no está, a propósito

- **La plantilla Plax del sitio anterior** (`apps/landing`, retirado en
  agosto): sus rostros de stock, logos de marcas de ejemplo e iconos de Font
  Awesome no son de Fintide, y los rostros contradicen la regla de no poner
  personas.
- **El logotipo de Google** del botón «Entrar con Google»: es de Google.
- **Las exploraciones de logotipo anteriores** (otra F, una ola, dos versiones
  horizontales): se retiraron del monorepo cuando se cerró la decisión y no
  quedaron guardadas. El símbolo del dueño es el único.
- **Documentos que no son de marca**: el plan de negocios, contratos,
  comprobantes. Viven donde viven.
- **Lo que haya en Google Drive**: todavía no se revisó.

## Lo que no se hace

- **El símbolo no se rediseña.** Ni se vectoriza, ni se recolorea, ni se le
  agrega el punto coral que tenía el nombre antes de que hubiera símbolo.
- **Las piezas derivadas no se editan a mano.** Se edita la fuente y se corre
  `npm run generar`. Un PNG retocado deja de ser del original, y
  `npm run comprobar` lo detecta.
- **El coral no se usa para decorar.** Es el color de la acción.

## En cualquier computadora

Todo da el mismo resultado en macOS, Linux y Windows, en ARM y en x86. El CI
lo prueba en los tres sistemas en cada pull request. Hace falta Node 24.

```bash
npm install
npm run generar                                  # todo lo derivado, desde sus fuentes
npm run comprobar                                # que salga idéntico
npm run comprobar -- --monorepo ../Fintide       # y que el producto esté al día
npm run comprobar -- --probar                    # y que cada regla sepa ponerse en rojo
```

Son los mismos comandos en cualquier terminal: la ruta del monorepo va como
argumento y no como variable de entorno, que se escribe distinto en cada una.

`comprobar` revisa dos cosas:

1. **Reproducibilidad.** Regenera todo en una copia y exige que cada pieza
   salga idéntica a la guardada. Se compara lo que se ve: los PNG por pixel,
   los SVG con sus PNG incrustados decodificados, el ICO entrada por entrada y
   lo demás byte a byte. Los bytes de un PNG cambian de un sistema a otro
   aunque la imagen sea la misma, y eso no es una diferencia de marca.
2. **El producto al día.** Los colores contra `globals.css`, la paleta de las
   gráficas contra `reportes/paleta.ts`, las piezas del símbolo y la
   tipografía contra las que sirve el sitio, y el nombre contra el trazo de
   `logotipo.tsx`. Si no le dices dónde está el monorepo, dice «sin revisar» y
   no da un verde falso.

`--probar` estropea a propósito una copia —un icono retocado, un color, una
pieza que el producto no actualizó— y exige que la regla que toca falle. Existe
por la lección del monorepo: una regla que nadie ha visto ponerse en rojo no
protege nada.

## Cómo cambia la marca

La dirección va siempre **de aquí hacia afuera**:

1. Se cambia aquí la fuente (`tokens.json`, `nombre.svg`, un guion), se corre
   `npm run generar` y se abre el pull request.
2. El producto (`Fintide-org/Fintide`) toma lo nuevo en su propio pull
   request, que cita el de aquí. Mientras no lo toma,
   `npm run comprobar -- --monorepo …` sale en rojo, y eso es lo correcto: dice
   exactamente qué falta.
3. Presentaciones, documentos y proveedores descargan de aquí, no de una copia
   que alguien tenía en su computadora.

## Compartir con quien no usa GitHub

La carpeta entera se descarga como ZIP desde GitHub (**Code → Download ZIP**)
y la guía se abre con doble clic. Lo que más se pide:
`logotipo/logotipo-fondo-claro.svg` para documentos,
`logotipo/logotipo-fondo-oscuro.png` para fondos oscuros, `color/tokens.json`
para quien diseña y `voz/redaccion.md` para quien escribe.
