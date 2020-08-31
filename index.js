var express = require("express");
var bodyParser = require("body-parser");
var _ = require("lodash");
const escapeJSON = require("escape-json-node");
var app = express();
const { PORT = 3333 } = process.env;
var client = require("./EsUtil");

app.use(bodyParser.json());

var timeserie = require("./series");
var countryTimeseries = require("./country-series");

var now = Date.now();

for (var i = timeserie.length - 1; i >= 0; i--) {
  var series = timeserie[i];
  var decreaser = 0;
  for (var y = series.datapoints.length - 1; y >= 0; y--) {
    series.datapoints[y][1] = Math.round((now - decreaser) / 1000) * 1000;
    decreaser += 50000;
  }
}

var annotation = {
  name: "annotation name",
  enabled: true,
  datasource: "generic datasource",
  showLine: true
};

var annotations = [
  {
    annotation: annotation,
    title: "Donlad trump is kinda funny",
    time: 1450754160000,
    text: "teeext",
    tags: "taaags"
  },
  {
    annotation: annotation,
    title: "Wow he really won",
    time: 1450754160000,
    text: "teeext",
    tags: "taaags"
  },
  {
    annotation: annotation,
    title: "When is the next ",
    time: 1450754160000,
    text: "teeext",
    tags: "taaags"
  }
];

var tagKeys = [{ type: "string", text: "Country" }];

var countryTagValues = [{ text: "SE" }, { text: "DE" }, { text: "US" }];

var now = Date.now();
var decreaser = 0;
for (var i = 0; i < annotations.length; i++) {
  var anon = annotations[i];

  anon.time = now - decreaser;
  decreaser += 1000000;
}

var table = {
  columns: [
    { text: "Time", type: "time" },
    { text: "Country", type: "string" },
    { text: "Number", type: "number" }
  ],
  rows: [
    [1234567, "SE", 123],
    [1234567, "DE", 231],
    [1234567, "US", 321]
  ]
};

function setCORSHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "accept, content-type");
}

var now = Date.now();
var decreaser = 0;
for (var i = 0; i < table.rows.length; i++) {
  var anon = table.rows[i];

  anon[0] = now - decreaser;
  decreaser += 1000000;
}

app.get("/", (req, res) => {
  res.send(200);
});

/*var client = new Client.Client({
  host: "http://log-es.europrod.learnindialearn.org"
});*/

async function logsValue(start_Time,end_Time,sizeReq) {
  const result = await client.getClient().search({
    index: "logstash*",
    type: "_doc",
    body: {
       size: sizeReq,
        query: {
          bool: {
            filter: [
              {
                range: {
                  "@timestamp": {
                    gte: start_Time.getTime(),
                    lte: end_Time.getTime()
                  }
                }
              },
              {
                query_string: {
                  analyze_wildcard: true,
                  query: "kubernetes.container_name.keyword : lil-cron"
                }
              }
            ]
          }
        }
      }
    
  });
  var log_arg=[];
  let log =[];
  result.body.hits.hits.forEach(hit => {
    //log_parse.push((hit._source.log));
   try{
      log.push(JSON.parse(hit._source.log))
      //console.log('log--------------------',log);
    }catch(err){
     // console.log('not json object',hit._source.log)
    }
    });
   return log;
}

app.post("/search", function(req, res) {
  searchRes = ["lil-cron"]
  res.send(searchRes);
  res.end();
});

app.post("/annotations", function(req, res) {
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);
  res.json(annotations);
  res.end();
});

app.post("/query", async function(req, res) {
  const start_Time = new Date(req.body.range.from);
  const end_Time = new Date(req.body.range.to);
  //console.log("test", start_Time);
  let sizeReq = 50;
 /* if(req.body.data){
    sizeReq = req.body.data.size || 500;
  }*/
  const req_log_value = await logsValue(start_Time,end_Time,sizeReq);
  //console.log('0-0-0-0-0-0-0-0-0',req_log_value);
  console.log('final value', req_log_value);
  const rowsValue = req_log_value.map(val=>{
    return {
      level: val.level, 
      pid: val.pid,
      hostname:val.hostname,
      arg1name:val.arg1 && val.arg1.name || '',
      arg1cron:val.arg1 && val.arg1.cron || '',
      arg1startTime: val.arg1 && val.arg1.startTime || '',
      arg2: val.arg2 || ''
    }
  });
  let rows = rowsValue.map(obj=>{
     return (Object.values(obj));
   })
  //console.log('final bao------------------', finalRowVAlue);
  const argObject = await getKeys(req_log_value);
  //console.log('TYPE OF -=-=-=-=-=',  argObject);
  var arr = [];
  Array.prototype.contains = function(v) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] === v) return true;
    }
    return false;
  };
  Array.prototype.unique = function() {
    
    for (var i = 0; i < argObject.length; i++) {
      if (!arr.contains(argObject[i])) {
        arr.push(argObject[i]);
      }
    }
    return arr;
  }

  var uniques = argObject.unique();

  
//console.log('distince-----------',uniques);
  let keys =[];
  //let rows=[];
  let argsValue = [];
  /*for(let i=0 ; i<8 ; i++){
  keys=Object.keys(req_log_value[i]);
  }*/

function getKeys(obj) {
  return Object.keys(obj).reduce((r, k) => {
    r.push(k);

    if(Object(obj[k]) === obj[k])
      r.push(...getKeys(obj[k]));

    return r;
  }, [])
}
   
let columns = [];
var strType = ['string'];

for (var i = 0; i < uniques.length; i++) {
  try{
    if(isNaN(uniques[i]))
    columns.push({
     text: uniques[i],  
     type: strType
     });
     }catch(err){
    }
}
//  console.log('arg value****************', columns);
/*for(let i=0 ; i<req_log_value.length ; i++){
  rows.push(Object.values(req_log_value[i]));
  }*/
  let test_array = [];
   test_array.push({columns,rows,"type":"table"});
   //console.log('gyufhjhg', JSON.stringify(test_array));
   res.status(200).send(test_array)
});

app.all("/tag[-]keys", function(req, res) {
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  res.json(tagKeys);
  res.end();
});

app.all("/tag[-]values", function(req, res) {
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  if (req.body.key == "City") {
    res.json(cityTagValues);
  } else if (req.body.key == "Country") {
    res.json(countryTagValues);
  }
  res.end();
});

app.listen(PORT);

console.log("Server is listening to port ", `${PORT}`);
