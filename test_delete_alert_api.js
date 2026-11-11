
async function testDeleteAlert() {
    try {
        const response = await fetch(
            'http://localhost:3000/api/alerts/2',
            {
                method: 'DELETE'
            }
        );

        const data = await response.json();

        console.log('Delete Response:');
        console.log(data);

        const check = await fetch(
            'http://localhost:3000/api/alerts/2'
        );

        const result = await check.json();

        console.log('Check Deleted Alert:');
        console.log(result);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testDeleteAlert();
