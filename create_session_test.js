fetch('http://localhost:3000/api/session-logs', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        userId: 2,
        studyZoneId: 3,
        startTime: '2026-10-31 21:00:00',
        endTime: null,
        status: 'Active'
    })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(error => console.log(error));