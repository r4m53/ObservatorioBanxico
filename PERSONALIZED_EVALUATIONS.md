# Motor de evaluaciones personalizadas

## Arquitectura

El motor usa un store dedicado de Zustand como única fuente de verdad para el
estado de la sesión. El JSON oficial se carga como datos de solo lectura y nunca
se modifica. Las simulaciones se representan mediante una capa separada de
sobrescrituras (`edits`).

Cada sobrescritura se identifica por:

`fecha de Junta + evaluación vigente + criterio`

Este diseño evita que una simulación realizada en un cierre mensual altere otros
meses que reutilizan la misma evaluación oficial.

## Flujo de datos

1. La aplicación obtiene la evaluación oficial o la reconstrucción Heath vigente.
2. Para cada celda consulta primero la capa personalizada.
3. Si no existe una modificación usa la calificación original.
4. Totales, promedios, tablas, gráfica histórica y PDF se calculan dinámicamente
   con esas calificaciones efectivas.
5. Ningún promedio ni indicador derivado se almacena.

## Persistencia de sesión

Las modificaciones se guardan exclusivamente en `sessionStorage`, bajo la clave
`radar-bm-session`. El contenido incluye:

- origen base (`official` o `heath`);
- calificaciones modificadas;
- registro cronológico de cambios;
- fechas seleccionadas en el comparador.

No se escribe en el Excel, el JSON, archivos del proyecto ni servicios externos.
Al terminar la sesión del navegador, el navegador elimina esta información.

## Separación entre datos oficiales y personalizados

`sourceMode` determina la fuente base: Observatorio o Heath. `mode` describe el
contexto visible. Cuando no hay modificaciones coincide con `sourceMode`; al
existir al menos una sobrescritura cambia automáticamente a `custom`.

Restablecer elimina sobrescrituras y registro, conserva el origen base seleccionado
y regresa al estado Oficial o Reconstrucción Heath correspondiente.

## Edición y validación

Las celdas se editan mediante doble clic. Enter o pérdida de foco confirman;
Escape cancela. Solo se aceptan números finitos entre 0 y 10. Una modificación
se muestra en naranja institucional con el indicador `✎`.

## Motor de recálculo

Los selectores del store provocan un nuevo render inmediato. Las funciones puras
`effectiveScore`, `average` y `evaluationTotal` recalculan:

- total del integrante;
- promedios por criterio;
- promedio general de la Junta;
- serie histórica;
- valores y metadatos del PDF.

La huella SHA-256 de la sesión se vuelve a generar después de cada modificación,
cambio de origen o restauración. El PDF incorpora esa huella y genera además una
huella específica de la exportación y sus fechas.

## Registro interno

Cada operación conserva fecha de Junta, integrante, criterio, valor original,
nuevo valor, origen y timestamp. El registro queda disponible en `changes` para
funcionalidades futuras, pero todavía no se muestra en la interfaz.
