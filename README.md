# EchoPlay Backend

Backend para la aplicación EchoPlay - Sistema de gestión de música y playlists.

## 📁 Estructura del Proyecto

```
EchoPlay-backend/
├── config/
│   ├── constants.js      # Constantes globales (HOST, FILES_BASE)
│   └── database.js       # Configuración de PostgreSQL
├── middleware/
│   └── upload.js         # Configuración de Multer para uploads
├── routes/
│   ├── apk.js           # Endpoints de APK (upload, download, version)
│   ├── playlists.js     # Gestión de playlists
│   ├── songs.js         # Gestión de canciones
│   └── users.js         # Gestión de usuarios
├── utils/
│   └── normalize.js     # Funciones de normalización de strings
├── package.json
├── server.js            # Archivo principal del servidor
└── server.js.backup     # Backup del código anterior
```

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor
node server.js
```

## 🔧 Configuración

### Base de Datos (config/database.js)

```javascript
host: "localhost";
user: "echoplay";
password: "echoplay";
database: "echoplay";
port: 55432;
```

### Archivos (config/constants.js)

- **HOST**: `http://192.168.1.37:3000`
- **FILES_BASE**: `E:\\echoplay`

Los archivos se almacenan en:

- `E:\\echoplay\\covers` - Portadas de canciones
- `E:\\echoplay\\images` - Imágenes de perfil de usuarios
- `E:\\echoplay\\music` - Archivos de audio
- `E:\\echoplay\\apks` - Archivos APK

## 📡 Endpoints

### Usuarios (`/users`)

- `GET /users` - Obtener todos los usuarios
- `POST /users` - Crear usuario (con imagen)
- `PUT /users/:id` - Modificar usuario
- `DELETE /users/:id` - Eliminar usuario

### Playlists (`/playlists`)

- `GET /users/:userId/playlists` - Obtener playlists de un usuario
- `POST /playlists` - Crear playlist
- `DELETE /playlists/:playlistId` - Eliminar playlist
- `POST /playlists/:playlistId/songs` - Añadir canción a playlist
- `GET /playlists/:playlistId/songs` - Obtener canciones de una playlist
- `DELETE /playlists/:playlistId/songs/:songId` - Eliminar canción de playlist

### Canciones (`/songs`)

- `GET /songs` - Obtener todas las canciones
- `GET /songs/:id` - Obtener canción por ID
- `POST /songs/check` - Verificar si existe canción
- `POST /songs/upload` - Subir canción (cover + audio)

### APK (`/apk`, `/app`)

- `POST /apk/upload` - Subir archivo APK
- `GET /apk/download/:filename` - Descargar APK
- `GET /apk/list` - Listar todas las APKs
- `GET /app/version` - Obtener versión más reciente

## 🛠️ Tecnologías

- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **Multer** - Upload de archivos
- **CORS** - Manejo de peticiones cross-origin

## 📝 Notas

- El servidor corre en el puerto **3000** por defecto
- Las carpetas de archivos se crean automáticamente si no existen
- Se mantiene un backup del código anterior en `server.js.backup`
