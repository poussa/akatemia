#! node
var moment = require('moment-timezone');
require('moment-timezone/moment-timezone-utils')

const tz_name = "Europe/Helsinki";

var zones = [];
let zone = moment.tz.zone(tz_name)

// For tz.add(...)
var subset = moment.tz.filterYears(zone, 2018);
console.log("\"" + moment.tz.pack(subset) + "\"")

// For tz.load(...)
zones.push(zone)
let input = {}
input.version = "2018"
input.zones = zones;
input.links = [];

let pack = moment.tz.filterLinkPack(input, 2018, 2018)
console.log(JSON.stringify(pack));