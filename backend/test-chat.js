/**
 * Test script for AI Chat feature
 * Run with: node test-chat.js
 * 
 * Prerequisites:
 * 1. Backend server running (npm run dev)
 * 2. Valid JWT token (get from login)
 * 3. OpenAI API key configured in .env
 */

const API_BASE_URL = 'http://localhost:3001/api';

// Replace with your actual JWT token after logging in
const JWT_TOKEN = 'your-jwt-token-here';

async function testChatAPI() {
  console.log('🧪 Testing AI Chat API Integration\n');

  try {
    // Test 1: Create a new chat thread
    console.log('1️⃣ Creating new chat thread...');
    const createThreadResponse = await fetch(`${API_BASE_URL}/chat/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({
        title: 'Test Chat - Physics Help',
      }),
    });

    if (!createThreadResponse.ok) {
      throw new Error(`Failed to create thread: ${createThreadResponse.status}`);
    }

    const threadData = await createThreadResponse.json();
    const threadId = threadData.data.id;
    console.log(`✅ Thread created: ${threadId}\n`);

    // Test 2: Send a message
    console.log('2️⃣ Sending user message...');
    const sendMessageResponse = await fetch(
      `${API_BASE_URL}/chat/threads/${threadId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify({
          content: 'Can you explain how velocity and acceleration are related in physics?',
        }),
      }
    );

    if (!sendMessageResponse.ok) {
      throw new Error(`Failed to send message: ${sendMessageResponse.status}`);
    }

    const messageData = await sendMessageResponse.json();
    console.log(`✅ Message sent: ${messageData.data.id}\n`);

    // Test 3: Stream AI response
    console.log('3️⃣ Streaming AI response...');
    console.log('Response: ');
    
    // Note: EventSource doesn't work in Node.js without additional libraries
    // For testing, you can use curl or test in the browser
    console.log(`\n📝 To test streaming, open this URL in your browser:`);
    console.log(`${API_BASE_URL}/chat/threads/${threadId}/stream?token=${JWT_TOKEN}\n`);

    // Test 4: Get thread with messages
    console.log('4️⃣ Fetching thread with messages...');
    const getThreadResponse = await fetch(
      `${API_BASE_URL}/chat/threads/${threadId}`,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
      }
    );

    if (!getThreadResponse.ok) {
      throw new Error(`Failed to get thread: ${getThreadResponse.status}`);
    }

    const fullThread = await getThreadResponse.json();
    console.log(`✅ Thread retrieved with ${fullThread.data.messages.length} messages\n`);
    console.log('Messages:');
    fullThread.data.messages.forEach((msg, i) => {
      console.log(`  ${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
    });

    // Test 5: List all threads
    console.log('\n5️⃣ Fetching all threads...');
    const listThreadsResponse = await fetch(`${API_BASE_URL}/chat/threads`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
    });

    if (!listThreadsResponse.ok) {
      throw new Error(`Failed to list threads: ${listThreadsResponse.status}`);
    }

    const threads = await listThreadsResponse.json();
    console.log(`✅ Found ${threads.data.length} thread(s)\n`);

    console.log('✨ All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Thread creation');
    console.log('   ✅ Message sending');
    console.log('   ✅ Thread retrieval');
    console.log('   ✅ Thread listing');
    console.log('   ⚠️  SSE streaming (test manually in browser)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure backend server is running (npm run dev)');
    console.log('   2. Update JWT_TOKEN in this script with a valid token');
    console.log('   3. Check that OpenAI API key is configured in .env');
    console.log('   4. Verify database is running and migrated');
  }
}

// Run tests
testChatAPI();
