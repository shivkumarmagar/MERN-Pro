const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mongodb://localhost:27017/doctor_appointments'
    }
  }
});

async function testAuth() {
  try {
    console.log('Testing authentication...');
    
    // Create a test user
    const password = await bcrypt.hash('test123', 12);
    const user = await prisma.user.create({
      data: {
        userId: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: password,
        role: 'PATIENT'
      }
    });
    
    console.log('✅ User created:', user);
    
    // Test login
    const foundUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'test@example.com' },
          { userId: 'testuser' }
        ]
      }
    });
    
    console.log('✅ User found:', foundUser);
    
    // Test password verification
    const isValid = await bcrypt.compare('test123', foundUser.passwordHash);
    console.log('✅ Password valid:', isValid);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
