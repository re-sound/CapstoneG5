# 📖 Manual de Instalación y Despliegue - Atreu Temperature

Este manual describe detalladamente los pasos necesarios para instalar, configurar y ejecutar el sistema **Atreu Temperature**.

El sistema se compone de dos partes principales:
1.  **Backend**: Una API REST construida con Node.js, Express y TypeScript, que utiliza **Supabase** como base de datos en tiempo real.
2.  **Frontend**: Una aplicación web moderna construida con React, Vite y TailwindCSS.

---

## 📋 1. Requisitos Previos

Antes de comenzar, asegúrate de tener instalado el siguiente software en tu equipo:

*   **Node.js**: Versión 20 o superior (LTS recomendado). [Descargar Node.js](https://nodejs.org/)
*   **Git**: Para clonar el repositorio. [Descargar Git](https://git-scm.com/)
*   **Cuenta de Supabase**: Necesaria para la base de datos y autenticación. Regístrate en [supabase.com](https://supabase.com).

---

## 🛠️ 2. Configuración del Backend (Server)

El backend maneja la lógica de negocio, la conexión con la base de datos y la simulación de sensores.

### 2.1 Instalación de Dependencias

1.  Abre una terminal en la raíz del proyecto.
2.  Navega a la carpeta del servidor:
    ```bash
    cd server
    ```
3.  Instala las dependencias:
    ```bash
    npm install
    ```

### 2.2 Configuración de Variables de Entorno

1.  En la carpeta `server`, crea un archivo llamado `.env` duplicando el archivo de ejemplo:
    ```bash
    cp env.example .env
    ```
    *(En Windows, puedes copiar y pegar el archivo `env.example` y renombrarlo a `.env`)*

2.  Edita el archivo `.env` con tus credenciales de Supabase. Debería verse así:

    ```env
    # Configuración de Supabase
    SUPABASE_URL=tu_project_url_de_supabase
    SUPABASE_ANON_KEY=tu_anon_key_de_supabase

    # Puerto del servidor
    PORT=4000
    ```

    > **¿Dónde encontrar estas credenciales?**
    > Ve a tu Dashboard de Supabase -> Project Settings -> API.

### 2.3 Configuración de la Base de Datos

El proyecto incluye un script automatizado para crear todas las tablas y datos necesarios en Supabase.

1.  Ejecuta el script de configuración desde la carpeta `server`:
    ```bash
    npm run setup
    ```

    Este comando:
    *   Creará las tablas: `tunnels`, `readings`, `processes`, `process_history`.
    *   Insertará datos iniciales (7 túneles de ejemplo).

---

## 💻 3. Configuración del Frontend (Cliente)

La aplicación web permite visualizar los datos y controlar los procesos.

### 3.1 Instalación de Dependencias

1.  Abre una nueva terminal en la **raíz del proyecto** (`atreu-temperature/`).
2.  Instala las dependencias:
    ```bash
    npm install
    ```


## 🚀 4. Ejecución del Proyecto

La forma más sencilla de trabajar es ejecutar todo el sistema (Backend, Simulador y Frontend) con un solo comando.

### Opción A: Modo Desarrollo Completo (Recomendado)

Desde la **raíz del proyecto**:

```bash
npm run start:all
```

Este comando iniciará concurrentemente:
1.  **Backend Real**: Conectado a tu base de datos Supabase.
2.  **Simulador Real**: Generará datos de temperatura falsos y los enviará a Supabase para que veas actividad en tiempo real.
3.  **Frontend**: Lanzará la aplicación web (generalmente en `http://localhost:5173`).

### Opción B: Ejecución Manual por partes

Si prefieres tener control individual, puedes abrir terminarles separadas:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev:real
```

**Terminal 2 (Simulador - Opcional):**
```bash
cd server
npm run dev:sim-real
```

**Terminal 3 (Frontend):**
```bash
# En la raíz del proyecto
npm run dev
```

---

## ❓ Solución de Problemas Comunes

### Error: "connection refused" o API no conecta
*   Verifica que el backend esté corriendo en el puerto 4000.
*   Asegúrate de que no haya otro servicio ocupando ese puerto.

### Error con Supabase
*   Verifica que tus credenciales en `server/.env` sean correctas (URL y Anon Key).
*   Asegúrate de haber corrido `npm run setup` al menos una vez para crear las tablas.

### Datos no se actualizan
*   Verifica que el simulador (`dev:sim-real`) esté corriendo si estás en entorno de pruebas.
*   Revisa la consola del navegador (F12) para ver si hay errores de red.

---

## 📚 Documentación Adicional

*   Para detalles sobre la migración a Supabase, consulta `MIGRACION-SUPABASE.md`.
*   Para ayuda general del proyecto original, consulta `README-AYUDA.md`.
