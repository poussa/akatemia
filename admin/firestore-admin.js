var admin = require('firebase-admin');
var serviceAccount = require('./akatemia-firebase-adminsdk.json');
var fs = require('fs');
var path = require('path');
var nconf = require('nconf');

nconf.argv()
   .env()
   .file({ file: path.join(__dirname, 'config.json') });

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

var collection = '/members'

var db = admin.firestore();

function db_write(booked) {
    let error = false;
    let msg = "";

    for (var day = 0; (day < dbConfig.days) && error == false; day++) {
        for (var hour = dbConfig.first; (hour < dbConfig.last + 1) && error == false; hour++) {
            let start = new Date(dbConfig.date);
            start.setDate(start.getDate() + day);
            start.setHours(hour);
            start.setMinutes(0);
            start.setSeconds(0);
            start.setMilliseconds(0);
            
            let end = new Date(start);
            end.setHours(end.getHours()+1);
            let booking = {
                starttime: start,
                endtime: end
            }
            let courts = [];
            for (court = 1; (court < (dbConfig.courts + 1)) && error == false; court++) {
                let obj = {court: court, booked: booked}
                if (booked) {
                    obj.user = "user_0"
                }
                courts.push(obj);
            }
            booking["courts"] = courts;
            console.log(booking)
            db.collection(collection).add(booking).then(function(docRef) {
                console.log("Document written with ID: ", docRef.id);
            }).catch(function(err) {
                console.error("Error adding document: ", err);
            });
        }
    }
}

function db_read() {
    db.collection(collection).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          console.log(doc.data())
        });
    })
    .catch((err) => {
        console.log("Read error: ", err);
    });
}

function create_query(lval, op, rval) {
    console.log("%s %s %s",lval, op, rval);
    return collectionFef = db.collection(collection).where(lval, op, rval);    
}

function db_query() {
    let queryRef = create_query('booked', '==', 'true');

    start = new Date(date);
    let end = new Date(start);
    end.setDate(end.getDate() + days);

    queryRef = db.collection(collection).orderBy('starttime').startAt(start).endAt(end)
    queryRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            console.log(doc.data());
        });
    })
    .catch((err) => {
        console.log(err);
    });
}

function db_delete() {
    console.log("use: firebase firestore:delete -r ", dbConfig.collection)
}

function deluser(email) {

    let ref = db.collection(collection);
    let query = ref.where('email', '==', email);
    query.get().then(snapshot => {
        console.log("Found users: ", snapshot.size);
        snapshot.forEach(doc => {
            console.log(doc.id, '=>', doc.data());
            ref.doc(doc.id).delete().then(res => {
                console.log("Deleted, ", res);
            }).catch(err => {
                console.log("Error in delete, ", err);
            })
        })
    }).catch(err => {
        console.log(err);
    })
}

function adduser(user) {
    db.collection(collection).add(user).then(function(docRef) {
        console.log("Document written with ID: ", docRef.id);
    }).catch(function(err) {
        console.error("Error adding document: ", err);
    });

}

if (nconf.get('write')) {
    db_write(true);
} else if (nconf.get('read')) {
    db_read();
} else if (nconf.get('query')) {
    db_query();
} else if (nconf.get('deluser')) {
    let email = nconf.get('email');
    deluser(email);
} else if (nconf.get('adduser')) {
    let email = nconf.get('email');
    let lastname = nconf.get('lastname');
    let firstname = nconf.get('firstname');
    let user = {firstName: firstname, lastName: lastname, email: email, valid: true}
    adduser(user);
} else {
    console.log("Don't know what to do?")
}

