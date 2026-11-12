fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: 'Test Login',
        email: 'testlogin@example.com',
        password: 'CafeTest123!',
        role_id: 3
    })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(error => console.log(error));