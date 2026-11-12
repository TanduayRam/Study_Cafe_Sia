fetch('http://localhost:3000/api/alerts', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        userId: 2,
        message: 'Welcome to Study Cafe!',
        alertType: 'System'
    })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(error => console.log(error));