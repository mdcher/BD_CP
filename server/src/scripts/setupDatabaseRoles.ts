import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Завантажуємо змінні середовища
dotenv.config({ path: path.join(__dirname, '../../config/.env') });

/**
 * Скрипт для налаштування ролей PostgreSQL
 *
 * Цей скрипт надає користувачу postgres членство в усіх ролях бібліотеки,
 * що дозволяє middleware переключатися між ролями за допомогою SET ROLE.
 *
 * ВАЖЛИВО: Запускається ОДИН РАЗ при початковому налаштуванні системи.
 *
 * Запуск: npm run setup-roles або ts-node src/scripts/setupDatabaseRoles.ts
 */
async function setupDatabaseRoles() {
  console.log('🔧 Початок налаштування ролей БД...\n');

  try {
    // Створюємо з'єднання з БД
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    console.log('✅ З\'єднання з БД встановлено\n');

    // Список ролей для надання доступу
    const roles = [
      'role_guest',
      'role_reader',
      'role_librarian',
      'role_accountant',
      'role_admin',
    ];

    console.log('📝 Надання членства в ролях користувачу postgres:\n');

    // Надаємо членство в кожній ролі
    for (const role of roles) {
      try {
        await connection.query(`GRANT ${role} TO postgres;`);
        console.log(`   ✅ ${role}`);
      } catch (err: any) {
        // Якщо роль вже надано, це не критична помилка
        if (err.message.includes('already a member')) {
          console.log(`   ℹ️  ${role} (вже надано)`);
        } else {
          console.error(`   ❌ ${role}: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Налаштування ролей завершено!\n');
    console.log('💡 Тепер можна запустити сервер: npm run dev\n');

    await connection.close();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Помилка налаштування ролей:', err.message);
    console.error('\n💡 Переконайтеся що:');
    console.error('   1. PostgreSQL запущено');
    console.error('   2. Файл .env містить правильні дані підключення');
    console.error('   3. Ролі створено в БД (scripts 05_roles_permissions.sql)\n');
    process.exit(1);
  }
}

// Запускаємо скрипт
setupDatabaseRoles();
