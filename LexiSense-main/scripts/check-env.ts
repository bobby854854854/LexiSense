import 'dotenv/config'

const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'OPENAI_API_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
  'APP_URL',
]

const optionalEnvVars = ['REDIS_URL', 'LOG_LEVEL', 'NODE_ENV']

console.log('🔍 Production Environment Check\n')

let missingRequired = []
let presentOptional = []

// Check required variables
requiredEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`)
  } else {
    console.log(`❌ ${varName}: Missing`)
    missingRequired.push(varName)
  }
})

console.log('\n📋 Optional Variables:')
optionalEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`)
    presentOptional.push(varName)
  } else {
    console.log(`⚠️  ${varName}: Not set (will use defaults)`)
  }
})

console.log('\n📊 Summary:')
console.log(
  `Required: ${requiredEnvVars.length - missingRequired.length}/${requiredEnvVars.length}`
)
console.log(`Optional: ${presentOptional.length}/${optionalEnvVars.length}`)

if (missingRequired.length > 0) {
  console.log('\n❌ Missing required environment variables:')
  missingRequired.forEach((varName) => console.log(`   - ${varName}`))
  process.exit(1)
} else {
  console.log('\n🚀 Environment ready for production!')
}
