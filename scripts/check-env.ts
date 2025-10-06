import { config } from 'dotenv';

config();

const requiredEnvVars = [
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'SESSION_SECRET'
];

const optionalEnvVars = [
  'NODE_ENV',
  'PORT'
];

console.log('🔍 Checking environment variables...\n');

let hasErrors = false;

// Check required variables
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Missing (required)`);
    hasErrors = true;
  } else if (value.includes('your_') || value.includes('_here')) {
    console.log(`⚠️  ${varName}: Placeholder value detected`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: Set`);
  }
});

// Check optional variables
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`ℹ️  ${varName}: Not set (optional)`);
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Environment setup incomplete');
  console.log('\nNext steps:');
  console.log('1. Update .env file with real values');
  console.log('2. Get OpenAI API key from https://platform.openai.com/api-keys');
  console.log('3. Set up PostgreSQL database');
  process.exit(1);
} else {
  console.log('✅ Environment setup complete');
}