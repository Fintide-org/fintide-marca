# Tipografía

Una sola familia: **Plus Jakarta Sans**, de Tokotype, con licencia SIL Open
Font License 1.1 (`OFL.txt`). Se puede usar, incrustar y redistribuir; lo que
la licencia no deja es vender la fuente sola ni publicar una versión
modificada con el mismo nombre.

| Peso | Dónde |
| --- | --- |
| 400 | Cuerpo del texto |
| 500 | Énfasis, etiquetas |
| 600 | Títulos y el nombre del logotipo |
| 800 | Titulares de las tarjetas sociales |

Interletraje del nombre: −0.025 em (`tracking-tight`). Cifras monetarias con
números tabulares (`font-variant-numeric: tabular-nums`), para que las columnas
alineen.

## Los archivos

`jakarta-600.woff` y `jakarta-800.woff` son los que usa el monorepo para
componer las tarjetas sociales, y del 600 salieron las curvas de
`logotipo/nombre.svg`. En el producto la fuente la carga `next/font` desde
Google Fonts, que sirve todos los pesos.

Para documentos y presentaciones fuera del producto, la familia completa está
en [Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans).
