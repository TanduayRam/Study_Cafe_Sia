fetch('http://localhost:3000/api/audit-logs/1', {
    method: 'DELETE'
})
.then(res => res.json())
.then(data => console.log(data))
.catch(error => console.log(error));