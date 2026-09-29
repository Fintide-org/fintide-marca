# La marca aplicada

Cómo se ve la identidad puesta en el producto. Sirve para presentaciones,
para quien diseña algo nuevo y quiere ver el conjunto, y para comparar antes y
después de un cambio.

Estas capturas **no son piezas de la marca**: son fotografías de un momento
del sitio. No entran en `npm run comprobar` y llevan la fecha en el nombre de
la carpeta.

| Carpeta | Qué hay |
| --- | --- |
| `sitios-2026-09-29/` | Las diez páginas públicas (cinco de empresas, cinco de colaboradores), en escritorio a 1440 px y en celular a 390 px (2×), página completa. Ya con el símbolo y el logotipo actuales. |
| `historico/sitios-2026-08-01/` | Las capturas del 1 de agosto de 2026, antes de que llegara el símbolo: el nombre todavía iba en texto con el punto coral. Convertidas a JPEG; los PNG originales están fuera del repositorio. |

## Volver a capturar

```bash
npx playwright install chromium   # la primera vez
node scripts/capturar-sitios.mjs
```

Crea `sitios-<fecha de hoy>/`. Cuando la nueva sustituya a la anterior, mueve
la anterior a `historico/` si documenta un cambio que vale la pena ver, o
bórrala si no. El portal y el back office no se capturan: piden sesión y
enseñarían datos de personas.
