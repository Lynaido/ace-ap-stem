const axios = require('axios');

async function loginAndGetToken() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    console.log(response.data.accessToken);
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
    // If login fails, try to register
    try {
      await axios.post('http://localhost:3001/api/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      console.log(response.data.accessToken);
    } catch (registerError) {
      console.error('Registration failed:', registerError.response ? registerError.response.data : registerError.message);
    }
  }
}

loginAndGetToken();
