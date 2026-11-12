fetch('http://localhost:3000/api/engine/check', {
    method: 'POST'
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));