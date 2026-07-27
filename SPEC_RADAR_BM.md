# Radar BM — especificación funcional resumida

## Propósito

Radar BM transforma el libro maestro del Observatorio Banxico en una aplicación pública, estática y transparente. Permite comparar hasta tres composiciones históricas de la Junta de Gobierno, consultar las diez subcalificaciones, explorar perfiles, observar series y ensayar evaluaciones personalizadas.

## Principios

1. El `.xlsm` es la fuente autoritativa y nunca se modifica.
2. La aplicación consume JSON generado de manera reproducible.
3. No se muestran diferencias: la comparación corresponde al lector.
4. Toda edición es temporal, vive en `sessionStorage` y cambia el estado a “personalizada”.
5. Restablecer elimina las ediciones y recupera las estimaciones oficiales.
6. Los PDF identifican inequívocamente su origen.
7. Se reconoce a Jonathan Heath sin insinuar su aprobación de Radar BM.

## Vistas

- **Comparador:** última Junta por defecto y hasta dos adicionales; tablas completas, promedios y perfiles.
- **Histórico Radar BM:** línea histórica; cada punto abre la Junta correspondiente.
- **Experiencia:** total, monetaria y fiscal; los puntos llevan al comparador.
- **Metodología:** diez criterios, fuentes, reconocimiento y limitaciones.

## Identidad

Fondo oscuro (`#0b0b0b`), paneles `#151515`, naranja de acento `#f28c28`, tablas densas y números tabulares. Inspiración en terminales financieras sin copiar interfaces protegidas.
