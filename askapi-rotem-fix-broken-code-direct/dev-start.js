#!/usr/bin/env node
/**
 * Development startup script
 * Starts both backend and frontend for development
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting development environment...');
console.log('📁 Backend will run on: http://localhost:5000');
console.log('📁 Frontend will run on: http://localhost:5173');
console.log('');

// Start backend
console.log('🔧 Starting backend...');
const backend = spawn('python', ['app.py'], {
    cwd: path.join(__dirname, 'Backend'),
    stdio: 'inherit'
});

// Wait a moment for backend to start
setTimeout(() => {
    console.log('🎨 Starting frontend...');
    const frontend = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'Frontend'),
        stdio: 'inherit'
    });

    // Handle process termination
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down development environment...');
        backend.kill();
        frontend.kill();
        process.exit();
    });

    frontend.on('close', (code) => {
        console.log(`Frontend exited with code ${code}`);
        backend.kill();
    });
}, 2000);

backend.on('close', (code) => {
    console.log(`Backend exited with code ${code}`);
}); 