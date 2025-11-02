# 🚀 Inicio Rápido del Proyecto Atreu

Este directorio contiene scripts para iniciar automáticamente todos los servicios del proyecto Atreu de una vez.

## 📋 Servicios que se inician:

1. **Backend Real** - Puerto 3000 (API principal)
2. **Simulador Backend** - Puerto 3001 (Simulación de datos)
3. **Frontend React** - Puerto 5173 (Interfaz web)

## 🎯 Opciones de Inicio:

### Opción 1: Script de Windows (Recomendado)
```bash
# Doble click en el archivo o ejecutar:
start-all.bat
```

### Opción 2: Script de PowerShell
```powershell
# Ejecutar en PowerShell:
.\start-all.ps1
```

### Opción 3: Comando NPM (Una sola terminal)
```bash
# Desde la carpeta atreu-temperature:
cd atreu-temperature
npm run start:all
```

## 🔧 Características:

- **Ventanas separadas**: Cada servicio se ejecuta en su propia ventana de terminal
- **Colores identificativos**: Cada servicio tiene un color diferente para fácil identificación
- **Inicio automático**: Todos los servicios se inician automáticamente en secuencia
- **Detención fácil**: Cierra las ventanas individuales para detener servicios específicos

## 📝 Notas:

- Asegúrate de tener todas las dependencias instaladas (`npm install` en cada carpeta)
- El frontend estará disponible en: http://localhost:5173
- El backend estará disponible en: http://localhost:3000
- El simulador estará en: http://localhost:3001

## 🛠️ Comandos individuales:

Si necesitas ejecutar servicios por separado:

```bash
# Backend Real
cd atreu-temperature/server
npm run dev:real

# Simulador
cd atreu-temperature/server  
npm run dev:sim-real

# Frontend
cd atreu-temperature
npm run dev
```

¡Disfruta desarrollando! 🎉