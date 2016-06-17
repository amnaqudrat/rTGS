var express = require('express');
var ping = require ("net-ping");
var router = express.Router();
var mote_uri = 'aaaa::c30c:0:0:4';

var MessageID     = "nil";
var UpTime        = "nil";
var ClockTime     = "nil";
var Temperature   = "nil";
var Battery       = "nil";
var PowTrace      = "nil";
var RTT			      = "nil";
var PrevMessageID = "nil";
/*-------------------- PING Lib Configs ---------------------*/
// Default options
var options = {
  networkProtocol: ping.NetworkProtocol.IPv6,
  packetSize: 64,
  retries: 1,
  sessionId: (process.pid % 65535),
  timeout: 10000,
  ttl: 128
};
var session = ping.createSession (options);

session.on ("error", function (error) {
  console.trace (error.toString ());
});
/*-------------------- End PING Lib Configs ------------------*/

var request_counter = 1;
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');
m_payload = "";
// create MYSQL Server connection to store data
var mysql      = require('mysql');
var connection = mysql.createConnection({
host     : 'localhost', // default
user     : 'root',  // default
password : '',  // default
database : 'rtgs-db' // app database name
});
connection.connect();

var mqtt = require('mqtt')
, client = mqtt.connect();
//console.log(client);
/* GET MQTT Data. */
//	http://localhost:3000/getMqttData?uri=aaaa::c30c:0:0:4
router.get('/', function(req, res, next) {
  var mote_uri        = req.query.uri ? req.query.uri : mote_uri ;
  var duration_sec    = req.query.d   ? req.query.d   : '1' ;
  var n_hops          = req.query.h   ? req.query.h   : '1' ;
  /*-------------------- get Round Trip Time ---------------------*/
  session.pingHost (mote_uri, function (rtt_error, mote_uri, sent, rcvd) {
    RTT = rcvd - sent;
    //console.log ("Target " + mote_uri + ": RTT (ms=" + RTT + ")");

    if(!rtt_error){
      /*-------------------- get Payload ---------------------*/
        // MQTT_0.5Sec_3Hop
        var Protocol = 'MQTT_'+ duration_sec +'Sec_'+ n_hops +'Hop';
        client.subscribe('iot-2/evt/status/fmt/json', function(){/* console.log("Event: subscribed on topic"); */});
        
        client.on('message', function(topic, payload) {
          m_payload = decoder.write(payload);
            //  populate database
            //  MessageID, UpTime, ClockTime, Temperature, Battery, Status, RTT  //<-- This
            var string = "";
            string =String(m_payload);
            string = string.split(",");
            MessageID   = (string[0]) ? string[0] : '0' ;
            if(MessageID != PrevMessageID){
              UpTime      = (string[1]) ? string[1] : '0' ;
              ClockTime   = (string[2]) ? string[2] : '0' ;
              Temperature = (string[3]) ? string[3] : '0' ;
              Battery     = (string[4]) ? string[4] : '0' ;
              Status      = (string[5]) ? string[5] : '0' ;
              connection.query('INSERT INTO `rtgs-tbl` (MessageID, UpTime, ClockTime, Temperature, Battery, Status, Protocol, RTT) VALUES (\''+MessageID+'\',\''+UpTime+'\', \''+ClockTime+'\', \''+Temperature+'\', \''+Battery+'\', \''+Status+'\', \''+Protocol+'\', \''+RTT+'\')', function(err, rows, fields) {
                if (err) throw err;
              });
              PrevMessageID = MessageID;
            }
            client.on('error', function(error) {
              request_counter = request_counter + 1;
              console.log("[===============< " + request_counter + " >===============]\n");
              console.log(error);
              console.log("[==================================]\n");
              return;
            })

//            client.end('', function(){console.log("Event: Ended with Acknowledgement sent");});
//            client.unsubscribe('iot-2/evt/status/fmt/json', function(){console.log("Event: un-subscribed on topic");});
});

        res.send(m_payload + "," + RTT);

        /*-------------------- End get Payload ---------------------*/
      }else{
        console.log("MQTT: Ping failed, Device is not reachable, Trying again ... \n");
          return;	// No RTT
        }

      });
  /*-------------------- End get Round Trip Time ---------------------*/
});

module.exports = router;
