fetch('http://localhost:3000/api/session-logs/4', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        endTime: '2026-11-01 12:00:00',
        status: 'Completed'
    })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(error => console.error(error));