---
description: Actualizar repositorio en GitHub automáticamente
---

# Workflow: Actualizar Git

Este workflow actualiza automáticamente el repositorio de GitHub con los últimos cambios.

// turbo-all

## Pasos:

1. Agregar todos los cambios al stage
```bash
git add .
```

2. Crear commit con mensaje automático
```bash
git commit -m "Actualización automática del sistema"
```

3. Subir cambios al repositorio remoto
```bash
git push origin main
```

✅ Los cambios han sido subidos exitosamente al repositorio.
