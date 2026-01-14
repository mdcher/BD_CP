const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const correctHash = '$2a$10$gs12d4QKQ4vv8lWlKAIEAusoZ9M4.W9Nd051j0q4iSOTsOQM77.4a';

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1473',
    database: 'library_db'
});

async function updatePasswords() {
    try {
        await client.connect();
        console.log('Connected to database');

        // First, let's see current users
        const currentUsers = await client.query(
            'SELECT userid, fullname, role, contactinfo, LEFT(password_hash, 30) as hash_preview FROM users ORDER BY userid'
        );
        console.log('\nCurrent users:');
        console.log(currentUsers.rows);

        // Update all user passwords to the correct hash
        const result = await client.query(
            `UPDATE users SET password_hash = $1 WHERE contactinfo LIKE '%@mail.com'`,
            [correctHash]
        );

        console.log(`\n✅ Updated ${result.rowCount} user passwords`);

        // Verify the update
        const updatedUsers = await client.query(
            'SELECT userid, fullname, role, contactinfo, LEFT(password_hash, 30) as hash_preview FROM users ORDER BY userid'
        );
        console.log('\nUpdated users:');
        console.log(updatedUsers.rows);

        console.log('\nPassword for all test users is now: password123');
        console.log('\nTest user credentials:');
        console.log('  Reader: ivan@mail.com / password123');
        console.log('  Librarian: librarian@mail.com / password123');
        console.log('  Accountant: accountant@mail.com / password123');
        console.log('  Admin: admin@mail.com / password123');

    } catch (error) {
        console.error('Error updating passwords:', error);
    } finally {
        await client.end();
    }
}

updatePasswords();
