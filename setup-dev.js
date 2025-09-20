const fs = require('fs');

// Create .env.local for development
const envContent = `# Database
DATABASE_URL="file:./dev.db"

# JWT Secrets (for development)
JWT_SECRET="dev-jwt-secret-key-12345"
JWT_REFRESH_SECRET="dev-refresh-secret-key-12345"

# Stripe (test keys)
STRIPE_SECRET_KEY="sk_test_fake_key_for_development"
STRIPE_PUBLISHABLE_KEY="pk_test_fake_key_for_development"
STRIPE_WEBHOOK_SECRET="whsec_fake_webhook_secret"

# SendGrid Email (fake for development)
SENDGRID_API_KEY="SG.fake_sendgrid_key"

# Google Maps (fake for development)
GOOGLE_MAPS_API_KEY="AIza_fake_google_maps_key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza_fake_google_maps_key"

# Server Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SERVER_URL="http://localhost:3000"
NODE_ENV="development"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
`;

fs.writeFileSync('.env.local', envContent);
console.log('✅ Created .env.local for development');

console.log('\n🚀 Development setup complete!');
console.log('📝 Next steps:');
console.log('1. Run: npm run db:generate');
console.log('2. Run: npm run db:push');
console.log('3. Run: npm run db:seed');
console.log('4. Run: npm run dev');
console.log('\n💡 Authentication now uses userId/password instead of OTP');
