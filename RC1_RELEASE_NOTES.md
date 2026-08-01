# Radar BM — Release Candidate 1

## Cambios realizados

- Se eliminó la activación de Boards desde celdas ordinarias. Sólo el botón explícito de la fila de título puede activar y reordenar un Board.
- Se conservó intacta la edición por doble clic, Enter, Escape y pérdida de foco.
- El indicador Oficial / Heath / Mi evaluación ahora permanece sticky bajo la barra principal.
- El drawer incorpora las pestañas Trayectoria profesional y Formación académica.
- Las experiencias se clasifican de forma reproducible por institución, cargo y descripción en Política monetaria, Finanzas públicas, Ambas o No computa.
- La metodología distingue la propuesta original de Jonathan Heath de la adaptación del RAdarMonetario.
- Se agregó transparencia sobre inteligencia artificial, revisión continua y changelog.

## Decisiones de diseño

Los datos académicos ausentes se muestran como N/D: RC1 no inventa ni deriva grados, instituciones o reconocimientos. La clasificación profesional es visual y no modifica cálculos ni datos históricos.

## Validaciones ejecutadas

- Lint, TypeScript y compilación de producción.
- Serie mensual: 378 fechas, cero duplicados y cero huecos.
- Matriz: encabezado único y sticky, bloques múltiples y ausencia de tarjetas.
- Edición: recálculo inmediato, indicador naranja, hash y restauración.
- Sincronización gráfica y selección explícita de Board.
- Revisión responsive sin desbordamiento horizontal en anchura de laptop.
- Consola sin errores.

## Incidencias detectadas y resueltas

- Clic simple en una celda reordenaba Boards: resuelto al retirar acciones de las filas y celdas.
- El indicador de modo desaparecía al desplazarse: resuelto con jerarquía sticky.
- El drawer no separaba trayectoria y formación: resuelto con dos pestañas.

## Pendientes

- Completar formación académica estructurada cuando existan fuentes documentales suficientes.
- Incorporar al changelog futuras correcciones históricas con fecha y evidencia.
- Evaluar división de código para reducir el tamaño del bundle en una versión posterior.
