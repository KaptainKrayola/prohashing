# prohashing
Simple implementation of the Prohashing WAMP interface

## Installation
```npm install prohashing```

## Config
* ```apiKey``` Your Prohashing API Key
* ```degug``` True or False on whether or not to output debugging information
* ```subscribe``` Either "all" (for all events) or an array containing the events you want to subscribe to.  
Options are : ```['miners', 'profitability', 'systemStatus', 'blocks']``` .  See the API Documentation https://prohashing.com/help.html for full details on each.

## Usage
```javascript
const prohashing = require("./prohashing")
const connection = new prohashing({ 
	apiKey: "0a7a6fade943f7b6b9e96b4d1516bfcc733b5158af18d1b43aeec7e45a238c02", 
	debug: false ,
	subscribe : ['systemStatus', 'miners']
})

connection.on("minerStatus", (update) => {
	console.log("MINER UPDATE")
	console.log(update)
})

connection.on("connected", (details, session) => {
	console.log("Connected to Prohashing WAMP")
})

connection.on("block", (block) => {
	console.log("BLOCK UPDATE")
	console.log(block)
})

connection.on("systemStatus", (status)=>{
	console.log("STATUS", status)
})
```
