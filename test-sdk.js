
import { MalawiCurriculumClient } from './src/MalawiCurriculumClient.js';

// Use the known test key or replace with yours
const API_KEY = 'YOUR_API_KEY'; // Replace with your actual key
const BASE_URL = 'https://malawi-curricular-api-production.up.railway.app/api/v1';

async function testSDK() {
    console.log('🧪 Testing Malawi Curriculum SDK...');

    const client = new MalawiCurriculumClient({
        apiKey: API_KEY,
        baseUrl: BASE_URL
    });

    try {
        console.log('\n📚 Fetching Subjects...');
        const subjects = await client.getSubjects();
        console.log(`✅ Success! Found ${subjects.length} subjects.`);
        if (subjects.length > 0) console.log('   Sample:', subjects[0]);

        console.log('\n🎓 Fetching Levels...');
        const levels = await client.getLevels();
        console.log(`✅ Success! Found ${levels.length} levels.`);
        if (levels.length > 0) console.log('   Sample:', levels[0]);

        console.log('\n📝 Fetching Resources (MSCE Mathematics)...');
        const resources = await client.getResources({
            level: 'MSCE',
            subject: 'Mathematics',
            limit: 5
        });
        console.log(`✅ Success! Found ${resources.length} resources.`);
        if (resources.length > 0) console.log('   Sample:', resources[0]);

    } catch (error) {
        console.error('❌ SDK Test Failed:', error.message);
        if (error.cause) console.error('   Cause:', error.cause);
    }
}

testSDK();
