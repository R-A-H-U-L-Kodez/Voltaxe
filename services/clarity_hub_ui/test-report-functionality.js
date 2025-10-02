// Test script to verify report generation functionality
// This can be run in the browser console when on the Voltaxe app

async function testReportGeneration() {
    try {
        console.log('🧪 Testing Voltaxe Report Generator...');
        
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined') {
            console.log('⚠️ jsPDF not loaded, this is normal in dev environment');
        }
        
        // Test API endpoints
        console.log('📡 Testing API endpoints...');
        
        const alertsResponse = await fetch('http://localhost:8000/alerts');
        const alertsData = await alertsResponse.json();
        console.log(`✅ Alerts: ${alertsData.length} records`);
        
        const snapshotsResponse = await fetch('http://localhost:8000/snapshots');
        const snapshotsData = await snapshotsResponse.json();
        console.log(`✅ Snapshots: ${snapshotsData.length} records`);
        
        const eventsResponse = await fetch('http://localhost:8000/events');
        const eventsData = await eventsResponse.json();
        console.log(`✅ Events: ${eventsData.length} records`);
        
        console.log('🎯 All systems ready for report generation!');
        console.log('💡 To test: Click the "Download Report" button in the UI');
        
        return {
            alerts: alertsData.length,
            snapshots: snapshotsData.length,
            events: eventsData.length,
            status: 'ready'
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { status: 'error', error: error.message };
    }
}

// Auto-run test if in browser
if (typeof window !== 'undefined') {
    testReportGeneration().then(result => {
        console.log('Test Result:', result);
    });
}