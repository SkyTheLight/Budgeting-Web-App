import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = process.env.SEED_EMAIL || 'demo@budgetpro.app';
  const defaultPassword = 'password123';
  const password = process.env.SEED_PASSWORD || defaultPassword;
  const name = process.env.SEED_NAME || 'Demo User';

  // Never seed a known fallback credential against a reachable database.
  if (process.env.NODE_ENV === 'production' && password === defaultPassword && !process.env.SEED_PASSWORD) {
    throw new Error('Refusing to seed a well-known password in production. Set SEED_PASSWORD.');
  }
  if (!process.env.SEED_PASSWORD) {
    console.warn(`WARNING: using default demo password "${defaultPassword}" (set SEED_PASSWORD to override)`);
  }

  const hashedPassword = bcrypt.hashSync(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { name, password: hashedPassword },
    create: {
      email,
      name,
      password: hashedPassword,
    },
  });
  console.log(`Seed user ready (${email}).`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

