// File server.js khusus untuk menjalankan Next.js Standalone di cPanel
const path = require('path');
process.env.NODE_ENV = 'production';

// cPanel seringkali menjalankan aplikasi di port tertentu, ambil dari ENV atau default ke 3000
const port = process.env.PORT || 3000;

// Memuat server standalone bawaan Next.js
require('dotenv').config(); // Pastikan dotenv dimuat jika ada
const server = require('./.next/standalone/server.js');
