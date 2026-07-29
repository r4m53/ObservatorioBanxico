# Serie histórica mensual de Radar BM

## Fuente de la línea temporal

La línea temporal se obtiene exclusivamente del rango definido `MonthlyDates` del
archivo maestro de Excel. Los selectores de las hojas comparadoras usan ese rango,
que comienza en `Monthly_Experience!A3` y contiene todos los cierres mensuales.

No se generan fechas a partir de publicaciones, evaluaciones ni cambios en la Junta.
El extractor conserva la lista del Excel en el campo `timeline` del archivo de datos.

## Determinación de la Junta vigente

`Board_Composition` contiene periodos inclusivos de vigencia (`Fecha inicio` y
`Fecha fin`). Para cada fecha mensual de `timeline`, Radar BM busca el único periodo
que cumple:

`Fecha inicio <= fecha de corte <= Fecha fin`

La fecha seleccionable y el periodo de composición son entidades distintas. Por
ello, un mismo periodo de Junta puede corresponder a muchos cierres mensuales.

## Reconstrucción de meses intermedios

Para cada integrante de la Junta vigente se utiliza la evaluación más reciente del
origen seleccionado cuya fecha sea menor o igual al cierre consultado. La evaluación
permanece vigente hasta que aparece otra evaluación del mismo origen. Este mecanismo
extiende la vigencia, pero no crea ni modifica calificaciones.

Si no existe una evaluación anterior compatible, la aplicación muestra `N/D`.
Los valores faltantes no se convierten en cero y no participan en promedios.

## Supuestos

- `MonthlyDates` es la referencia oficial del Comparador para las fechas disponibles.
- Los extremos de cada periodo de `Board_Composition` son inclusivos.
- Una evaluación conserva vigencia mientras no exista una posterior del mismo origen.
- La ausencia de una evaluación anterior se trata como información insuficiente.
- No se cambian metodología, totales, componentes ni integrantes registrados.

## Validación antes/después

| Concepto | Antes | Después |
|---|---:|---:|
| Fechas disponibles en el selector | 21 | 378 |
| Meses faltantes respecto a `MonthlyDates` | 357 | 0 |
| Fechas duplicadas | 0 | 0 |

Periodo validado: enero de 1995 a junio de 2026.

La validación automatizada comprueba igualdad exacta con `MonthlyDates`, orden
cronológico, cierre de mes, ausencia de duplicados y exactamente una Junta vigente
para cada fecha.
