fetch('http://localhost:3000/api/session-logs')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(error => console.log(error));