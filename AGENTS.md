# AGENTS.md — marca Fintide

Lo mínimo para cambiar este repositorio sin romper la marca. El porqué de cada
punto está en `README.md` y en `docs/simbolo.md`.

1. **No edites piezas derivadas.** `simbolo/simbolo*.png`, `iconos/*`,
   `logotipo/logotipo-*`, `color/tokens.css` y `guia/index.html` salen de
   guiones. Edita la fuente (`simbolo/original.jpg`, `logotipo/nombre.svg`,
   `color/tokens.json`, `scripts/*.mjs`) y corre `npm run generar`.
2. **No rediseñes el símbolo.** Ni lo vectorices, ni cambies sus colores, ni
   inventes una variante nueva. Es el que entregó el dueño.
3. **Corre la comprobación antes del commit:**
   `FINTIDE_MONOREPO=<ruta al monorepo> npm run comprobar -- --probar`.
   Un «sin revisar» en la deriva no es un verde.
4. **Un cambio de color o de pieza también toca el monorepo.** Abre el pull
   request de `Fintide-org/Fintide` que mueve `globals.css` o la pieza, y cítalo
   en el de aquí. Hasta que los dos se fusionen, la deriva está en rojo, y eso
   es lo correcto.
5. **Si añades una regla a `scripts/comprobar.mjs`, añade sus dos casos en
   `probar()`:** lo que prohíbe tiene que fallar y lo legítimo tiene que pasar.
6. **Todo en español**, sin anglicismos. La voz está en `voz/redaccion.md`.
7. **Fusión por merge commit**, nunca squash ni rebase, como en los otros dos
   repositorios. No se commitea a `main` directo.
