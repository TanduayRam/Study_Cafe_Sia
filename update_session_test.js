fetch('http://localhost:3000/api/session-logs/1', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        endTime: '2026-10-31 22:00:00',
        status: 'Completed'
    })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(error => console.log(error));