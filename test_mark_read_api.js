
async function testMarkRead() {
    try {
        const response = await fetch(
            'http://localhost:3000/api/alerts/2/read',
            {
                method: 'PATCH'
            }
        );

        const data = await response.json();

        console.log('Mark as Read Response:');
        console.log(data);

        const check = await fetch(
            'http://localhost:3000/api/alerts/2'
        );

        const updatedAlert = await check.json();

        console.log('Updated Alert:');
        console.log(updatedAlert);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testMarkRead();
