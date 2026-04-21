const fs = require('fs');
const path = require('path');

// Caminho onde o Prisma espera o certificado
const certPath = path.join(process.cwd(), 'prisma', 'ca.pem');

// Nome da variável de ambiente na Vercel
const caCert = process.env.DATABASE_SSL_CA;

if (caCert) {
    try {
        // Garante que o diretório existe
        const dir = path.dirname(certPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Escreve o arquivo
        fs.writeFileSync(certPath, caCert);
        console.log('✅ SSL CA certificate created successfuly at:', certPath);
    } catch (error) {
        console.error('❌ Error creating SSL CA certificate:', error);
        process.exit(1);
    }
} else {
    // Se o arquivo já existir no disco (ambiente local), não faz nada
    if (fs.existsSync(certPath)) {
        console.log('ℹ️  SSL CA certificate already exists locally. Skipping creation.');
    } else {
        console.log('⚠️  DATABASE_SSL_CA environment variable not found and no local ca.pem detected.');
    }
}
