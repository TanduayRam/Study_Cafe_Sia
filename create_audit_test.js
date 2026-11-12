fetch('http://localhost:3000/api/audit-logs', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        userId: 2,
        action: 'CREATE',
        tableName: 'session_logs',
        recordId: 1,
        description: 'Created a new study session'
    })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(error => console.log(error));