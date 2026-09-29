# AGENTS.md — marca Fintide

Lo mínimo para cambiar este repositorio sin romper la marca. Este repositorio
es la fuente canónica: el producto y todo lo demás toman de aquí, nunca al
revés. El porqué de cada punto está en `README.md` y en `docs/simbolo.md`.

1. **No edites piezas derivadas.** `simbolo/simbolo*.png`, `iconos/*`,
   `logotipo/logotipo-*`, `color/tokens.css` y `guia/index.html` salen de
   guiones. Edita la fuente (`simbolo/original.jpg`, `logotipo/nombre.svg`,
   `color/tokens.json`, `scripts/*.mjs`) y corre `npm run generar`.
2. **No rediseñes el símbolo.** Ni lo vectorices, ni cambies sus colores, ni
   inventes una variante nueva. Es el que entregó el dueño.
3. **Corre la comprobación antes del commit:**
   `npm run comprobar -- --monorepo <ruta al monorepo> --probar`.
   Un «sin revisar» en la deriva no es un verde.
4. **Un cambio de color o de pieza también toca el producto.** Abre el pull
   request de `Fintide-org/Fintide` que lo toma y cítalo en el de aquí. Hasta
   que los dos se fusionen, la deriva está en rojo, y eso es lo correcto.
5. **Nada que dependa de la computadora.** Si una pieza nueva sale distinta
   en Windows, Linux o macOS, o en ARM y x86, arregla el guion: no metas una
   tolerancia. El CI la prueba en los tres sistemas. Las rutas, con
   `path.join`; los guiones que se ejecutan solos, con `pathToFileURL`.
6. **Si añades una regla a `scripts/comprobar.mjs`, añade sus dos casos en
   `probar()`:** lo que prohíbe tiene que fallar y lo legítimo tiene que pasar.
7. **Las capturas de `aplicaciones/` no son piezas.** Se rehacen con
   `scripts/capturar-sitios.mjs` en una carpeta con fecha; no entran en la
   comprobación.
8. **Todo en español**, sin anglicismos. La voz está en `voz/redaccion.md`.
9. **Fusión por merge commit**, nunca squash ni rebase, como en los otros dos
   repositorios. No se commitea a `main` directo.
