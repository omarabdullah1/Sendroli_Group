const axios = require('axios');

async function testLoyaltySystem() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123',
      forceLogin: true
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');
    
    console.log('📊 Fetching client statistics with loyalty scores...');
    const statsResponse = await axios.get('http://localhost:5000/api/clients/statistics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = statsResponse.data.data;
    
    console.log('\n' + '='.repeat(80));
    console.log('🏅 MOST LOYAL CLIENT');
    console.log('='.repeat(80));
    
    if (data.overallStats.mostLoyalClient) {
      const loyal = data.overallStats.mostLoyalClient;
      console.log(`👤 Name: ${loyal.name}`);
      console.log(`🏆 Loyalty Score: ${loyal.loyaltyScore}/100`);
      console.log(`⭐ Tier: ${loyal.loyaltyTier}`);
      console.log(`📦 Total Orders: ${loyal.totalOrders}`);
      console.log(`�� Total Value: EGP ${loyal.totalValue.toLocaleString()}`);
      console.log(`✅ Payment Rate: ${loyal.paymentRate}%`);
      console.log(`📅 Client Age: ${loyal.clientAgeDays} days`);
    } else {
      console.log('No clients found');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 TOP 5 CLIENTS BY LOYALTY SCORE');
    console.log('='.repeat(80));
    
    const sortedByLoyalty = [...data.clients]
      .sort((a, b) => b.statistics.loyaltyScore - a.statistics.loyaltyScore)
      .slice(0, 5);
    
    sortedByLoyalty.forEach((client, index) => {
      console.log(`\n${index + 1}. ${client.name}`);
      console.log(`   Score: ${client.statistics.loyaltyScore} | Tier: ${client.statistics.loyaltyTier}`);
      console.log(`   Orders: ${client.statistics.totalOrders} | Payment: ${client.statistics.paymentRate}%`);
      console.log(`   Age: ${client.statistics.clientAgeDays} days | Orders/month: ${client.statistics.ordersPerMonth}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 LOYALTY TIER DISTRIBUTION');
    console.log('='.repeat(80));
    
    const tierCounts = {
      Platinum: 0,
      Gold: 0,
      Silver: 0,
      Bronze: 0
    };
    
    data.clients.forEach(client => {
      tierCounts[client.statistics.loyaltyTier]++;
    });
    
    console.log(`🥇 Platinum: ${tierCounts.Platinum} clients`);
    console.log(`🥇 Gold: ${tierCounts.Gold} clients`);
    console.log(`🥈 Silver: ${tierCounts.Silver} clients`);
    console.log(`🥉 Bronze: ${tierCounts.Bronze} clients`);
    
    console.log('\n✅ Loyalty system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testLoyaltySystem();
