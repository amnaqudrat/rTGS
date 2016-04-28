var express = require('express');
var router = express.Router();
var mote_uri = 'aaaa::c30c:0:0:3';
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');
var Protocol = "HTTP";
// create MYSQL Server connection to store data
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost', // default
  user     : 'root',  // default
  password : '',  // default set password	1234
  database : 'rtgs' // app database name
});
connection.connect();
var request = require('request');

/* GET HTTP Data. */
//	http://localhost:3000/getHttpData?uri=aaaa::c30c:0:0:3
router.get('/', function(req, res, next) {
	var mote_uri = req.query.uri;
	var start = new Date();
	request('http://['+mote_uri+']', function (error, response, payload) {
		if (!error && response.statusCode == 200) {
		var RTT = new Date() - start;
			h_payload = decoder.write(payload);
					//  populate database
	      //  MessageID, UpTime, ClockTime, Temperature, Battery, Status  //<-- This
	      var string = "";
	      string =String(h_payload);
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

			res.send(h_payload);
		}
	})

});

module.exports = router;