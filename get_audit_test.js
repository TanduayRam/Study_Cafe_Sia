fetch('http://localhost:3000/api/audit-logs')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(error => console.log(error));