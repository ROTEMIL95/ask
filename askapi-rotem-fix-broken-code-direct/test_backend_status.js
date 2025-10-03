#!/usr/bin/env node
/**
 * Test backend status
 */

const http = require('http');

function testBackendStatus() {
    console.log('🔍 Testing backend status...');
    console.log('📁 Testing: http://localhost:5000');
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/',
        method: 'GET',
        timeout: 5000
    };

    const req = http.request(options, (res) => {
        console.log(`✅ Backend is running! Status: ${res.statusCode}`);
        console.log(`📝 Response headers:`, res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('📝 Response preview:', data.substring(0, 200) + '...');
        });
    });

    req.on('error', (err) => {
        console.log('❌ Backend is NOT running or not accessible');
        console.log('🔍 Error:', err.message);
        console.log('');
        console.log('💡 To fix this:');
        console.log('1. Make sure the backend is running:');
        console.log('   cd Backend');
        console.log('   python app.py');
        console.log('');
        console.log('2. Or use the development script:');
        console.log('   node dev-start.js');
    });

    req.on('timeout', () => {
        console.log('⏰ Backend request timed out');
        req.destroy();
    });

    req.end();
}

testBackendStatus(); 