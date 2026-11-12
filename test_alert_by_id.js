
async function testAlertById() {
    try {
        const response = await fetch(
            'http://localhost:3000/api/alerts/2'
        );

        const data = await response.json();

        console.log('Single Alert Retrieved:');
        console.log(data);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAlertById();
