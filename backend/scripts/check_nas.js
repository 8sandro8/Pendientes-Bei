const fs = require('fs');
const path = require('path');

console.log('--- DIAGNOSTICO NAS ---');
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);

const backendPath = __dirname;
const frontendPath = path.join(backendPath, '../frontend');
const indexPath = path.join(frontendPath, 'index.html');

console.log('Frontend Path (Calculado):', frontendPath);
console.log('Index HTML Path (Calculado):', indexPath);

try {
    if (fs.existsSync(frontendPath)) {
        console.log('[OK] La carpeta frontend EXISTE.');
        const stats = fs.statSync(frontendPath);
        console.log('Permisos carpeta frontend:', stats.mode);
    } else {
        console.error('[ERROR] La carpeta frontend NO EXISTE en la ruta calculada.');
        // Intenta listar el directorio padre
        const parent = path.join(backendPath, '..');
        console.log(`Listando contenido de ${parent}:`);
        fs.readdirSync(parent).forEach(file => {
            console.log(' -', file);
        });
    }

    if (fs.existsSync(indexPath)) {
        console.log('[OK] El archivo index.html EXISTE.');
    } else {
        console.error('[ERROR] El archivo index.html NO SE ENCUENTRA.');
    }

    console.log('--- VERIFICACION DE DATOS ---');
    const dataDir = path.join(backendPath, 'data');
    if (fs.existsSync(dataDir)) {
        console.log('[OK] La carpeta data EXISTE.');
        console.log('Contenido de data:');
        fs.readdirSync(dataDir).forEach(file => {
            console.log(' -', file);
        });
    } else {
        console.error('[ERROR] La carpeta data NO EXISTE.');
    }

    console.log('Contenido raiz backend:');
    fs.readdirSync(backendPath).forEach(file => {
        if (file.endsWith('.json')) console.log(' -', file);
    });

} catch (err) {
    console.error('Error al chequear sistema de archivos:', err);
}
console.log('-----------------------');
