const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:10000/api/auth';
const testUser = {
    username: 'test_user_' + Date.now(),
    email: 'test_' + Date.now() + '@example.com',
    password: 'Password123!'
};

let authToken = '';

async function runTests() {
    console.log('🧪 Starting Comprehensive Auth Tests...\n');

    // 1. Test Registration
    try {
        console.log('1️⃣ Testing Registration...');
        const res = await axios.post(`${BASE_URL}/register`, testUser);
        console.log('✅ Registration Successful');
        if (res.data.token && res.data.user) {
            console.log('   - Token received');
            console.log('   - User data received');
        } else {
            console.log('   ❌ Response missing token or user data');
        }
    } catch (err) {
        console.error('❌ Registration Failed:', err.response?.data || err.message);
    }

    // 2. Test Duplicate Registration
    try {
        console.log('\n2️⃣ Testing Duplicate Registration...');
        await axios.post(`${BASE_URL}/register`, testUser);
        console.log('❌ Error: Duplicate registration allowed');
    } catch (err) {
        if (err.response?.status === 400) {
            console.log('✅ Correctly rejected duplicate registration:', err.response.data.message);
        } else {
            console.log('❌ Unexpected error on duplicate registration:', err.response?.status);
        }
    }

    // 3. Test Login
    try {
        console.log('\n3️⃣ Testing Login...');
        const res = await axios.post(`${BASE_URL}/login`, {
            username: testUser.username,
            password: testUser.password
        });
        console.log('✅ Login Successful');
        authToken = res.data.token;
    } catch (err) {
        console.error('❌ Login Failed:', err.response?.data || err.message);
    }

    // 4. Test Login with Wrong Password
    try {
        console.log('\n4️⃣ Testing Login with Wrong Password...');
        await axios.post(`${BASE_URL}/login`, {
            username: testUser.username,
            password: 'WrongPassword'
        });
        console.log('❌ Error: Login allowed with wrong password');
    } catch (err) {
        if (err.response?.status === 400) {
            console.log('✅ Correctly rejected wrong password:', err.response.data.message);
        } else {
            console.log('❌ Unexpected error on wrong password:', err.response?.status);
        }
    }

    // 5. Test JWT Validation (Get Me)
    try {
        console.log('\n5️⃣ Testing Protected Endpoint (GET /me)...');
        const res = await axios.get(`${BASE_URL}/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.data.success && res.data.user.username === testUser.username) {
            console.log('✅ Protected endpoint accessible with valid token');
            console.log('   - User correctly identified:', res.data.user.username);
        } else {
            console.log('❌ Protected endpoint returned unexpected data');
        }
    } catch (err) {
        console.error('❌ Protected Endpoint Failed:', err.response?.data || err.message);
    }

    // 6. Test Access with Invalid Token
    try {
        console.log('\n6️⃣ Testing Protected Endpoint with Invalid Token...');
        await axios.get(`${BASE_URL}/me`, {
            headers: { 'Authorization': `Bearer InvalidToken` }
        });
        console.log('❌ Error: Protected endpoint accessible with invalid token');
    } catch (err) {
        if (err.response?.status === 401) {
            console.log('✅ Correctly rejected invalid token');
        } else {
            console.log('❌ Unexpected error on invalid token:', err.response?.status);
        }
    }

    console.log('\n🏁 Auth Tests Complete.');
}

runTests();
