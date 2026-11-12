fetch('http://localhost:3000/api/session-logs', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        userId: 2,
        studyZoneId: 3,
        startTime: '2026-11-01 10:00:00',
        expectedEndTime: '2026-11-01 12:00:00',
        endTime: null,
        status: 'Active'
    })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));