const fs = require('fs');
const path = require('path');

const backendDir = __dirname;
const dataDir = path.join(backendDir, 'data');

console.log('--- ARREGLANDO ESTRUCTURA DE DATOS ---');

// 1. Crear carpeta data si no existe
if (!fs.existsSync(dataDir)) {
    console.log('Creando carpeta data...');
    fs.mkdirSync(dataDir);
} else {
    console.log('La carpeta data ya existe.');
}

// 2. Mover db.json -> data/pendientes.json
const oldDbPath = path.join(backendDir, 'db.json');
const newDbPath = path.join(dataDir, 'pendientes.json');

if (fs.existsSync(oldDbPath)) {
    console.log('Moviendo db.json a data/pendientes.json...');
    fs.renameSync(oldDbPath, newDbPath);
} else {
    console.log('db.json no encontrado (¿ya se movió?)');
}

// 3. Mover orders.json -> data/orders.json
const oldOrdersPath = path.join(backendDir, 'orders.json');
const newOrdersPath = path.join(dataDir, 'orders.json');

if (fs.existsSync(oldOrdersPath)) {
    console.log('Moviendo orders.json a data/orders.json...');
    fs.renameSync(oldOrdersPath, newOrdersPath);
} else {
    console.log('orders.json no encontrado (¿ya se movió?)');
}

// 4. Mover requests.json -> data/requests.json
const oldReqPath = path.join(backendDir, 'requests.json');
const newReqPath = path.join(dataDir, 'requests.json');

if (fs.existsSync(oldReqPath)) {
    console.log('Moviendo requests.json a data/requests.json...');
    fs.renameSync(oldReqPath, newReqPath);
} else {
    console.log('requests.json no encontrado (¿ya se movió?)');
}

console.log('--- REPARACION COMPLETADA ---');
