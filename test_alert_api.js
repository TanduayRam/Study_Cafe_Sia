
async function testAlertAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/alerts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: 1,
                message: 'Study Cafe notification',
                alertType: 'System'
            })
        });

        const data = await response.json();

        console.log('API Response:');
        console.log(data);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAlertAPI();
