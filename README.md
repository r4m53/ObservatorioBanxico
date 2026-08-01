# Radar BM · RAdarMonetario

Aplicación pública para comparar el perfil técnico e institucional de la Junta de Gobierno del Banco de México.

## Fuente de verdad

El libro `data/master/RAdarMonetario_Indice_Heath_FINAL_CORREGIDO_v20260729.xlsm` es la fuente autoritativa. La aplicación nunca lo modifica. El proceso `scripts/extract_workbook.py` produce `public/data/radar-bm.json`.

## Desarrollo

```powershell
python scripts/extract_workbook.py
npm install
npm run dev
```

## Publicación

Cada envío a `main` activa `.github/workflows/deploy.yml` y publica el sitio en GitHub Pages bajo `/RAdarMonetario/`.

## Estados

- **Observatorio:** estimaciones oficiales del proyecto.
- **Heath:** calificaciones históricas publicadas o reconstruidas, claramente identificadas.
- **Personalizada:** modificaciones temporales guardadas exclusivamente en `sessionStorage`.

Radar BM reconoce la metodología de evaluación publicada por Jonathan Heath. Las reconstrucciones, ampliaciones y calificaciones propias son responsabilidad exclusiva de RAdarMonetario.
