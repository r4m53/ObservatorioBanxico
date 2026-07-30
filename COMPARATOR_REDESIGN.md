# Rediseño del Comparador Histórico

## Arquitectura

El comparador mantiene el estado temporal en el almacén global. `activeBoard` representa la Junta activa y es independiente de `selectedBoards`, que conserva hasta tres cortes visibles.

## Sincronización

La gráfica histórica se integra al comparador. Un clic en un punto llama a `selectBoard`, actualiza la fecha activa, incorpora el corte a la comparación y desplaza suavemente la tarjeta correspondiente. La selección de un selector, tarjeta o botón de navegación usa la misma acción. El punto activo y la tarjeta activa se resaltan con el color del modo vigente.

## Diseño y navegación

Las Juntas se presentan como tarjetas verticales uniformes. El encabezado resume fecha, gobernador, subgobernadores, promedio general y tipo de evaluación. Cada integrante tiene una sección propia y las calificaciones se distribuyen en una cuadrícula adaptable. Los botones “Junta anterior” y “Junta siguiente” avanzan sobre la línea temporal oficial.

## Rendimiento y compatibilidad

Sólo se renderizan los tres cortes elegidos. La serie de la gráfica se memoriza y se recalcula únicamente cuando cambian los datos, el origen o las ediciones. El rediseño reutiliza las funciones existentes y preserva los modos Oficial, Reconstrucción Heath y Personalizada, la exportación PDF y la serie mensual auditada.
