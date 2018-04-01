var admin = require('firebase-admin');
var serviceAccount = require('./akatemia-firebase-adminsdk.json');
var fs = require('fs');
var csv = require('csv-parser');
var path = require('path');
var nconf = require('nconf');

nconf.argv()
   .env()
   .file({ file: path.join(__dirname, 'config.json') });

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://akatemia-d4c48.firebaseio.com"
});

var collection = '/members'

var db = admin.firestore();

const manual = "" +
"usage:\n" +
"  --get-members : list all members\n" +
"  --del-member <email> : delete a member\n" +
"  --add-member <email> <lastname> <firstname> : add new member\n" +
"  --add-members <file> : add/update members from csv file\n" +
"  --get-users : list all users\n" +
"  --get-user <email> : list a user\n" +
"  --del-user <uid> : delete an user\n" +
"  --add-user <email> <lastname> <firstname> : add new user\n" +
"\n" +
"<option> means --option value"

function usage() {
    console.log(manual);
    process.exit(1);
}

function get_members() {
    let ref = db.collection(collection);
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
    // List batch of users, 1000 at a time.
    admin.auth().listUsers(1000, nextPageToken)
    .then(function(listUsersResult) {
        listUsersResult.users.forEach(function(userRecord) {
            console.log(userRecord.toJSON());
        });
        /* NOTE: this hangs for some reason.
           NOTE2: We don't have this may users anyway...
        if (listUsersResult.pageToken) {
          // List next batch of users.
            get_users(listUsersResult.pageToken)
        }
        */
    })
    .catch(function(error) {
        console.log(error.message);
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
}

function add_user(user) {
    admin.auth().createUser(user)
    .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully created new user:", userRecord.uid);
    })
    .catch(function(error) {
        console.log(error.message);
    });
}

function del_user(uid) {
    admin.auth().deleteUser(uid)
    .then(function() {
      console.log("Successfully deleted user");
    })
    .catch(function(error) {
      console.log(error.message);
    });
}

if (nconf.get('get-members')) {
    get_members();
} else if (nconf.get('del-member')) {
    let email = nconf.get('email');
    del_member(email);
} else if (nconf.get('add-member')) {
    let email = nconf.get('email');
    let lastname = nconf.get('lastname');
    let firstname = nconf.get('firstname');
    let member = {firstName: firstname, lastName: lastname, email: email, valid: true}
    add_member(member);
} else if (nconf.get('add-members')) {
    let file = nconf.get('file');
    add_members(file);
} else if (nconf.get('get-users')) {
    get_users();
    admin.app().delete();
} else if (nconf.get('get-user')) {
    let email = nconf.get('email');
    if (email == undefined)
        usage();
    get_user(email);
    admin.app().delete();
} else if (nconf.get('del-user')) {
    let uid = nconf.get('uid');
    if (uid == undefined)
        usage();
    
    del_user(uid);
    admin.app().delete();
} else if (nconf.get('add-user')) {
    let email = nconf.get('email');
    let password = nconf.get('password');
    let displayname = nconf.get('displayname');

    if (email == undefined || password == undefined || displayname == undefined)
        usage();

    let user = {email: email, password: password, displayName: displayname, disabled: false}
    console.log(user);
    add_user(user);
    admin.app().delete();
} else {
    usage();
}

//process.exit(0);