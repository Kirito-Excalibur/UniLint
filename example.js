
var a=25
var b=30
var c=11

//request fetch
fetch("https://api.example.com/data")
	.then(response => response.json())
	.then(data => console.log(data))
	.catch(error => console.error("Error fetching data:", error));