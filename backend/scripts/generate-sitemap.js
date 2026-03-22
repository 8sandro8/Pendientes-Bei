const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.SITE_URL || 'https://your-domain.com';
const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'pendientes.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'sitemap.xml');

function formatDate(date) {
  if (!date) {
    return new Date().toISOString().split('T')[0];
  }
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function generateSitemap() {
  let products = [];
  
  if (fs.existsSync(PRODUCTS_FILE)) {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    products = JSON.parse(data);
  }

  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/tienda', priority: '0.9', changefreq: 'weekly' },
    { loc: '/contacto', priority: '0.7', changefreq: 'monthly' },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  staticPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  products.forEach(product => {
    const productId = product.id || product.nombre;
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/product/${productId}</loc>\n`;
    xml += `    <lastmod>${formatDate(product.fecha)}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  const publicDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, xml, 'utf-8');
  console.log(`Sitemap generated: ${OUTPUT_FILE}`);
  console.log(`Total URLs: ${staticPages.length + products.length}`);
}

generateSitemap();