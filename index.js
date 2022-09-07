const { networkInterfaces } = require("os");
const { WebSocketServer } = require("ws");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const express = require("express");

const localIP = Object.entries(networkInterfaces()).find((kv) => kv[0].toLowerCase().includes("wi-fi"))[1]
.find((v) => v.family.toString().includes("4")).address
console.dir(localIP);

const app = express();
const expressPort = 3000;

const wsPort = 8080;
const wsServer = new WebSocketServer({ port: wsPort });
const sockets = [];
let dataState = '{"uninitialized":true}';

wsServer.on("connection", (s) => sockets.push(s));
wsServer.on("close", (closing) => sockets.filter((s) => s != closing));

SerialPort.list().then((portListings) => {
  portListings.forEach((portListing) => {
    try{
      const port = new SerialPort({ path: portListing.path, baudRate: 115200 });

      port.on("error", e => console.error(e));

      const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
      parser.on("data", (data) => {
        dataState = data;
        console.log(getDebugInfo());
        sockets.forEach((s) => s.send(dataState));
      });
    }catch(e){}
  });
});

app.get("/", (req, res) => {
  res.send("Hello from express");
});
app.use(express.static("static"));
app.listen(expressPort);

function getDebugInfo() {
  return `local IPV4 : ${localIP}
    HTTP port : ${expressPort}
    WS port : ${wsPort}
    dataState : ${dataState}
    `;
}
