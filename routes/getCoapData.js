var express = require('express');
var router = express.Router();
var mote_uri = 'aaaa::c30c:0:0:2';
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');
var Protocol = "CoAP";
// create MYSQL Server connection to store data
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost', // default
  user     : 'root',  // default
  password : '',  // default set password	1234
  database : 'rtgs' // app database name
});
connection.connect();

var coap        = require('coap')

/* GET CoAP Data. */
//	http://localhost:3000/getCoapData?uri=aaaa::c30c:0:0:2
router.get('/', function(req, res, next) {
	var mote_uri = req.query.uri;
	var start = new Date();
	var c_req = coap.request('coap://[' + mote_uri + ']:5683/sens/mote')
	c_req.on('response', function(c_res) {
		var RTT = new Date() - start;
		//console.info("Execution time: %dms", RTT);
		c_payload = decoder.write(c_res.payload);
		//  populate database
	      //  MessageID, UpTime, ClockTime, Temperature, Battery, Status  //<-- This
	      var string = "";
	      string =String(c_payload);
	      string = string.split(",");
	      var MessageID = string[0];
	      var UpTime = string[1];
	      var ClockTime = string[2];
	      var Temperature = string[3];
	      var Battery = string[4];
	      var Status = string[5];
	      connection.query('INSERT INTO `rtgs-table` (MessageID, UpTime, ClockTime, Temperature, Battery, Status, Protocol) VALUES (\''+MessageID+'\',\''+UpTime+'\', \''+ClockTime+'\', \''+Temperature+'\', \''+Battery+'\', \''+Status+'\', \''+Protocol+'\')', function(err, rows, fields) {
	      	if (err) throw err;
	      });

		res.send(decoder.write(c_payload));
	})
	c_req.end()
});

module.exports = router;
