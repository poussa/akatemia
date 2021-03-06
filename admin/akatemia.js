#!/usr/bin/env node

var admin = require('firebase-admin');
if (typeof process.env.TARGET_ENV == "undefined")
  process.env.TARGET_ENV = 'production'

if (process.env.TARGET_ENV == 'production')
  var serviceAccount = require('./akatemia-tennis-firebase-adminsdk.json');
else if (process.env.TARGET_ENV == 'testing')
    var serviceAccount = require('./akatemia-testing-firebase-adminsdk.json');
else {
    console.log('Unknown environment: ' + process.env.TARGET_ENV);
    process.exit(1);
}
var fs = require('fs');
var csv = require('csv-parser');
var path = require('path');
var nconf = require('nconf');
var moment = require('moment')

nconf.argv()
   .env()
   .file({ file: path.join(__dirname, 'config.json') });

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://akatemia-tennis.firebaseio.com"
});

var collection = '/members'
var reservations = "/reservations"

var db = admin.firestore();

const manual = "" +
"usage:\n" +
"  --get-members [<email>]: list all members\n" +
"  --del-member <email> : delete a member\n" +
"  --add-member <email> <lastname> <firstname> : add new member\n" +
"  --add-members <file> : add/update members from csv file\n" +
"  --get-users : list all users\n" +
"  --get-user <email> : list a user\n" +
"  --del-user <uid> : delete an user\n" +
"  --add-user <email> <password> <displayname> : add new user\n" +
"  --update-user <uid> <displayname> : update user\n" +
"  --get-reservations [--details] : get all reservations\n" +
"  --get-reservation <email> : get all reservations for a user\n" +
"  --get-reservation <day> : get all reservations for a day\n" +
"\n" +
"<option> means --option value\n" +
"env: " + process.env.TARGET_ENV


function usage() {
    console.log(manual);
    process.exit(1);
}

function get_members(email) {
    let ref = db.collection(collection);
    if (email != null)
        ref = ref.where('email', '==', email);
    ref.get().then(snapshot => {
        console.log("Found users: ", snapshot.size);
        snapshot.forEach(doc => {
            let user = doc.data();
            console.log("%s, %s, %s", user.firstName, user.lastName, user.email);
        })
    }).catch(error => {
        console.log(error.message);
    })
}

function del_member(email) {
    // TODO: doc id is now email so this can be simplified
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
    }).catch(error => {
        console.log(error.message);
    })
}

function add_member(user) {
    db.collection(collection).doc(user.email).set(user).then(function() {
        console.log(user);
    }).catch(function(error) {
        console.error(error.message);
    });
}

function add_members(file) {
    fs.createReadStream(file)
    .pipe(csv(['firstName', 'lastName', 'email']))
    .on('data', function (data) {
        let user = {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.trim(),
            valid: true
        }
        db.collection(collection).doc(user.email).set(user)
        .then(function() {
            console.log(user);
        })
        .catch(function(error) {
            console.error("Error writing document: ", error);
        });
    });
}

function get_users(nextPageToken) {
    admin.auth().listUsers(1000)
    .then(function(listUsersResult) {
        listUsersResult.users.forEach(function(userRecord) {
            console.log(userRecord.toJSON());
        });
    })
    .catch(function(error) {
        console.log(error.message);
    })
    .finally(function() {
        admin.app().delete();
    });
}

function get_user(email) {
    admin.auth().getUserByEmail(email)
    .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log(userRecord.toJSON());
    })
    .catch(function(error) {
        console.log(error.message);
    })
    .finally(function() {
        admin.app().delete();
    });
}

function add_user(user) {
    admin.auth().createUser(user)
    .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully created new user:", userRecord.uid);
    })
    .catch(function(error) {
        console.log(error.message);
    })
    .finally(function() {
        admin.app().delete();
    });
}

function update_user(uid, displayName) {
    admin.auth().updateUser(uid, {
        displayName: displayName,
      })
    .then(function(userRecord) {
        console.log("Successfully updated user", userRecord.toJSON());
    })
    .catch(function(error) {
        console.log("Error updating user:", error);
    })
    .finally(function() {
        admin.app().delete();
    });
}

function del_user(uid) {
    admin.auth().deleteUser(uid)
    .then(function() {
      console.log("Successfully deleted user");
    })
    .catch(function(error) {
      console.log(error.message);
    })
    .finally(function() {
        admin.app().delete();
    });
}

function get_reservations() {
    let ref = db.collection(reservations).orderBy("starttime");
    ref.get().then(snapshot => {
        console.log("Reservations:", snapshot.size);
        snapshot.forEach(doc => {
            let data = doc.data();
            if (nconf.get('details')) {
                console.log(data);
            }
            let str1 = "";
            let str2 = "";
            if (data.courts[0].booked) 
                str1 = data.courts[0].user;
            if (data.courts[1].booked) 
                str2 = data.courts[1].user;
            if (data.courts[0].booked || data.courts[1].booked) {
                var starttime = moment.unix(data.starttime._seconds);
                console.log("%s,%s,%s", starttime.format('DD-MM-YY,HH:mm'), str1, str2);
            }
        })
    }).catch(error => {
        console.log(error.message);
    })
}

function get_reservation(email) {
    // TODO: HERE, this does not work (array of objects...)
    admin.auth().getUserByEmail(email)
    .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log(userRecord.uid);
        let ref = db.collection(reservations).where('courts', 'array-contains', userRecord.uid)
        ref.get().then(snapshot => {
            console.log("Reservations: ", snapshot.size);
            snapshot.forEach(doc => {
                let data = doc.data();
                let str = "";
                if (data.courts[0].booked) 
                    str += " 1: " + data.courts[0].user;
                if (data.courts[1].booked) 
                    str += " 2: " + data.courts[1].user;
                if (nconf.get('details')) {
                    str += " " + doc.id;
                }
                if (data.courts[0].booked || data.courts[0].booked)         
                    console.log("%s: ", data.starttime, str);
            })
        }).catch(error => {
            console.log(error.message);
        })
    })
    .catch(function(error) {
        console.log(error.message);
    })
}

if (nconf.get('get-members')) {
    let email = nconf.get('email');
    get_members(email);
} else if (nconf.get('del-member')) {
    let email = nconf.get('email');
    if (email == undefined)
        usage();
    del_member(email);
} else if (nconf.get('add-member')) {
    let email = nconf.get('email');
    let lastname = nconf.get('lastname');
    let firstname = nconf.get('firstname');
    if (email == undefined || lastname == undefined || firstname == undefined)
      usage();
    let member = {firstName: firstname, lastName: lastname, email: email, valid: true}
    add_member(member);
} else if (nconf.get('add-members')) {
    let file = nconf.get('file');
    add_members(file);
} else if (nconf.get('get-users')) {
    get_users();
} else if (nconf.get('get-user')) {
    let email = nconf.get('email');
    if (email == undefined)
        usage();
    get_user(email);
} else if (nconf.get('del-user')) {
    let uid = nconf.get('uid');
    if (uid == undefined)
        usage();
    
    del_user(uid);
} else if (nconf.get('update-user')) {
    let uid = nconf.get('uid');
    let displayName = nconf.get('displayname');
    if (uid == undefined || displayName == undefined)
        usage();

    update_user(uid, displayName);
} else if (nconf.get('add-user')) {
    let email = nconf.get('email');
    let password = nconf.get('password');
    let displayname = nconf.get('displayname');

    if (email == undefined || password == undefined || displayname == undefined)
        usage();

    let user = {email: email, password: password, displayName: displayname, disabled: false}
    console.log(user);
    add_user(user);
} else if (nconf.get('get-reservations')) {
    get_reservations();
} else if (nconf.get('get-reservation')) {
    let email = nconf.get('email');

    if (email == undefined)
        usage();
    get_reservation(email);
} else {
    usage();
}
