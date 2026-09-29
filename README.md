# Marca Fintide

La identidad de Fintide en un solo lugar: el símbolo y el logotipo, el color,
la tipografía, la imagen y la voz. Todo lo derivado se puede reproducir desde
sus fuentes, y hay una comprobación que avisa si esto y el producto se separan.

Para verla sin leer nada: abre **`guia/index.html`** en el navegador.

## Qué hay

| Carpeta | Qué guarda |
| --- | --- |
| `simbolo/` | `original.jpg`, el símbolo tal como lo entregó el dueño, y los dos maestros recortados: `simbolo.png` (fondo oscuro) y `simbolo-fondo-claro.png` |
| `logotipo/` | El logotipo completo en SVG y PNG (1× y 2×) para fondo oscuro y claro, y `nombre.svg`, el nombre solo en curvas |
| `iconos/` | Favicon, icono de iOS y los tres del manifiesto |
| `color/` | `tokens.json`, la fuente de la paleta, sombras, radios y degradados, y `tokens.css`, derivado para Tailwind 4 |
| `tipografia/` | Plus Jakarta Sans 600 y 800, con su licencia OFL |
| `fotografia/` | Las diez imágenes abstractas de la marca y dónde se usa cada una |
| `tarjetas-sociales/` | Fondos y tarjetas compuestas (1200×630) de cada página |
| `voz/` | Cómo escribe la marca, y por qué casi todo tiene consecuencia regulatoria |
| `docs/` | Por qué el símbolo se recortó y se aplanó como se hizo |
| `guia/` | La guía visual, generada |

## Lo que no se hace

- **El símbolo no se rediseña.** Ni se vectoriza, ni se recolorea, ni se le
  agrega el punto coral que tenía el nombre antes de que hubiera símbolo.
- **Las piezas derivadas no se editan a mano.** Se edita la fuente y se corre
  `npm run generar`. Un PNG retocado deja de ser del original, y
  `npm run comprobar` lo detecta.
- **No se usa el coral para decorar.** Es el color de la acción.

## Cómo se trabaja

```bash
npm install
npm run generar      # símbolo e iconos, logotipo, tokens.css y la guía, desde sus fuentes
npm run comprobar    # que todo lo derivado salga idéntico de sus guiones
FINTIDE_MONOREPO=../../Documents/Fintide npm run comprobar   # y que coincida con el producto
npm run comprobar -- --probar   # y que cada regla sepa ponerse en rojo
```

`comprobar` revisa dos cosas:

1. **Reproducibilidad.** Regenera todo en una copia y exige que cada pieza
   salga idéntica a la guardada: los PNG pixel a pixel (la compresión cambia
   de bytes entre macOS y Linux sin cambiar la imagen) y lo demás byte a byte.
   Las piezas se generan en ARM (Apple Silicon) y el CI corre en
   `macos-latest` para comparar exacto. En x86, la ampliación de libvips
   redondea distinto los tres iconos que se agrandan (hasta 36 niveles en los
   bordes): ahí se avisa como redondeo, no como rojo. Un retoque a mano rebasa
   ese margen y sigue saliendo en rojo.
2. **Deriva con el monorepo.** Los colores de `tokens.json` contra los de
   `apps/web/src/app/globals.css`, las piezas del símbolo y la tipografía
   contra las que sirve el producto, y el trazo de `nombre.svg` contra el de
   `components/marca/logotipo.tsx`. Si no le dices dónde está el monorepo, dice
   «sin revisar» y no da un verde falso.

`--probar` estropea a propósito una copia —un pixel de un icono, un color— y
exige que la regla que corresponde falle. Existe por la lección del monorepo:
una regla que nadie ha visto ponerse en rojo no protege nada.

## Relación con el monorepo

Hoy el producto (`Fintide-org/Fintide`) tiene su propia copia de las piezas:
`assets/marca/`, `apps/web/public/marca/`, los iconos de `apps/web/src/app/`,
los tokens en `globals.css` y el trazo en `logotipo.tsx`. Este repositorio las
reúne con su porqué y la comprobación de deriva vigila que no se separen.
Todavía no las publica: si un día el monorepo las toma de aquí, se decide en
un pull request aparte.

Un cambio de marca es, por ahora, **dos cambios**: aquí la fuente, allá la
copia. La comprobación de deriva se pone en rojo mientras falte uno de los dos.
