const {WebSocketServer} = require("ws");
const {SerialPort} = require("serialport");
const { ReadlineParser } = require('@serialport/parser-readline')
const express = require("express");
const app = express();
const expressPort = 3000;

const wsPort = 8080;
const wsServer = new WebSocketServer({port:wsPort})
const sockets = [];
let dataState = '{"uninitialized":true}';

wsServer.on("connection", s => sockets.push(s))
wsServer.on("close", closing => sockets.filter(s => s != closing))

SerialPort.list().then(portListings => {
  portListings.forEach(portListing => {
    const port = new SerialPort({path: portListing.path, baudRate: 115200});

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }))
    parser.on('data', data => {
      dataState = data;
      console.log(getDebugInfo())
      sockets.forEach(s => s.send(dataState));
    })
  })
});

app.get("/", (req, res) => {
  res.send("Hello from express");
});
app.use(express.static('static'))
app.listen(expressPort);

function getDebugInfo(){
  return `HTTP port : ${expressPort}
    WS port : ${wsPort}
    dataState : ${dataState}
    `
}