# Rediseño del Comparador Histórico

## Arquitectura

El comparador mantiene el estado temporal en el almacén global. `activeBoard` representa la Junta activa y es independiente de `selectedBoards`, que conserva hasta tres cortes visibles.

## Sincronización

La gráfica histórica se integra al comparador. Un clic en un punto llama a `selectBoard`, actualiza la fecha activa, incorpora el corte a la comparación y desplaza suavemente la tarjeta correspondiente. La selección de un selector, tarjeta o botón de navegación usa la misma acción. El punto activo y la tarjeta activa se resaltan con el color del modo vigente.

## Estructura, diseño y navegación

El comparador es una sola matriz con encabezados sticky que aparecen una única vez. Cada Junta agrega solamente una fila compacta de título, una fila por integrante y una fila destacada de promedios. La fecha y el promedio general aparecen en la fila de título; Persona, Cargo, Total y los diez criterios conservan columnas fijas. Los encabezados largos permiten dos líneas sin reducir la tipografía. Los botones “Junta anterior” y “Junta siguiente” avanzan sobre la línea temporal oficial.

La matriz usa todo el ancho disponible, espaciado vertical reducido y jerarquía visual inspirada en una terminal financiera. En pantallas de laptop evita desplazamiento horizontal; únicamente conserva una salida horizontal de seguridad por debajo de 1100 px.

## Rendimiento y compatibilidad

Sólo se renderizan los tres cortes elegidos. La serie de la gráfica se memoriza y se recalcula únicamente cuando cambian los datos, el origen o las ediciones. Las celdas siguen reutilizando `EditableScore`, por lo que se mantienen doble clic, Enter, Escape, pérdida de foco, color naranja, recálculo, hash y persistencia de sesión. También se preservan los modos Oficial, Reconstrucción Heath y Personalizada, la exportación PDF y la sincronización bidireccional.
