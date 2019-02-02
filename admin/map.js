var items = [
    {starttime: 7, endtime: 8},
    {starttime: 8, endtime: 9},
    {starttime: 9, endtime: 10},
    {starttime: 10, endtime: 11},
    {starttime: 11, endtime: 12}
];
var items_with_court = [
    {starttime: 7, endtime: 8, courts:[{court: 1, booked: false}, {court: 2, booked: false}]},
    {starttime: 8, endtime: 9, courts:[{court: 1, booked: false}, {court: 3, booked: false}]},
    {starttime: 9, endtime: 10, courts:[{court: 1, booked: false}, {court: 2, booked: false}]},
    {starttime: 10, endtime: 11, courts:[{court: 1, booked: false}, {court: 2, booked: false}]},
    {starttime: 11, endtime: 12, courts:[{court: 1, booked: false}, {court: 2, booked: false}]}
];

var snap = [
    {starttime: 8, endtime: 9, courts:[{court: 1, booked: true, user: "saku"}, {court: 2, booked: false}]},
    {starttime: 9, endtime: 10, courts:[{court: 1, booked: true, user: "john"}, {court: 2, booked: true, user: "janne"}]},
    {starttime: 10, endtime: 11, courts:[{court: 1, booked: true, user: "viitala"}, {court: 2, booked: false}]}
];

//console.log(JSON.stringify(items));
//console.log(JSON.stringify(snap));

/*let update = items.map((elem) => {
    let e = elem; e.courts[0].booked = true; 
    return e;
})*/

let reduced = items.reduce((accumulator, currentValue, currentIndex) => {
    return accumulator.concat(currentValue.starttime);
}, []);

//console.log(reduced);

let foo = items.map((item, idx) => 
    snap.reduce((accumulator, value, index, arr) => {
        console.log(item)
        console.log(value)
        if (value.starttime == item.starttime)
            return value;
        else
            return accumulator;
    }, item));

console.log(JSON.stringify(foo));
//console.log(JSON.stringify(items));
