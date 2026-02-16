const http = require('http');

function checkLogin(password) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ password });
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: body, password: password });
            });
        });

        req.on('error', (error) => {
            resolve({ error: error.message, password: password });
        });

        req.write(data);
        req.end();
    });
}

async function runTest() {
    console.log('--- DIAGNOSTICO DE LOGIN ---');
    console.log('Probando conección a http://localhost:3000...');

    // Test 1: coquito.2025
    const res1 = await checkLogin('coquito.2025');
    console.log(`\nIntento 1 (coquito.2025): Status ${res1.status}`);
    if (res1.status === 200) console.log('✅ EXITO! La contraseña es "coquito.2025"');
    else console.log('❌ FALLO. Respuesta:', res1.body);

    // Test 2: admin123
    const res2 = await checkLogin('admin123');
    console.log(`\nIntento 2 (admin123): Status ${res2.status}`);
    if (res2.status === 200) console.log('✅ EXITO! La contraseña es "admin123" (Valor por defecto)');
    else console.log('❌ FALLO. Respuesta:', res2.body);

    if (res1.error) console.log('\n❌ ERROR DE CONEXIÓN:', res1.error);
    console.log('\n----------------------------');
}

runTest();
