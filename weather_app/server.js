const express = require('express')
var cors = require('cors')
var request = require('request')
const https = require("https");
const bodyParser = require('body-parser');
var path = require('path');
const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))

//Set the base path to the angular-test dist folder
app.use(express.static(path.join(__dirname, 'dist/weaher_app')));

var originsWhitelist = [
  'http://localhost:4200',
  'http://ip-api.com/json'
];
var corsOptions = {
  origin: function(origin, callback){
        var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
        callback(null, isWhitelisted);
  },
  credentials:true
}

app.use(cors(corsOptions));

app.get("/demo", (req, res) => {
  const url = "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=" + req.query.input + "&types=(cities)&language=en&key=" + YOUR_GOOGLE_AUTOCOMPLETE_API;
  request(url, function (error, response, body) {
    res.send(body)
  });
});

app.get("/weatherCard", (req, res) => {
    let latitude = "";
    let longitude = "";
    let darkskyurl = "";
    const API_key = GOOGLE_API_KEY;
    const darsky_API = YOUR_DARKSKY_API_KEY;
    const url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + req.query.address + "&key=" + API_key;
    request(url, function (error, response, body) {
        body = JSON.parse(body);
        if(body["status"] == "ZERO_RESULTS") {
          res.send();
        }
        else if(body["status"] == "INVALID_REQUEST") {
          res.send();
        }
        else {
          latitude = body["results"][0]["geometry"]["location"]["lat"];
          longitude = body["results"][0]["geometry"]["location"]["lng"];
          darkskyurl = "https://api.darksky.net/forecast/" + darsky_API + "/" + latitude + "," + longitude;
          request(darkskyurl, function (error, response, bdy) {
              bdy = JSON.parse(bdy)
              res.send(bdy)
          });
        }
    });
  });

  app.get("/currentLocation", (req, res) => {
      let darkskyurl = "";
      const darsky_API = YOUR_DARKSKY_API_KEY;
      darkskyurl = "https://api.darksky.net/forecast/" + darsky_API + "/" + req.query.lat + "," + req.query.long;
      request(darkskyurl, function (error, response, bdy) {
        bdy = JSON.parse(bdy)
        res.send(bdy)
    });
  });

  app.get("/getStateSeal", (req, res) => {
    const API_key = YOUR_GOOGLE_CUSTOM_API_KEY;
    const SEARCH_ENGINE_ID = YOUR_SEARCH_ENGINE_ID;
    const url = "https://www.googleapis.com/customsearch/v1?q=" + req.query.state + "%20State%20Seal&cx=" + SEARCH_ENGINE_ID + "&imgSize=huge&imgType=news&num=1&searchType=image&key=" + API_key;
    request(url, function (error, response, body) {
        body = JSON.parse(body);
        res.send(body);
    });
  });


  app.get("/getDetailedWeather", (req, res) => {
    const darsky_API = YOUR_DARKSKY_API_KEY;
    darkskyurl = "https://api.darksky.net/forecast/" + darsky_API + "/" + req.query.latitude + "," + req.query.longitude + "," + req.query.time;
    request(darkskyurl, function (error, response, body) {
      body = JSON.parse(body);
      res.send(body);
    });
  });

app.listen(8081, function () {
  console.log('Example app listening on port 8081!')
})


