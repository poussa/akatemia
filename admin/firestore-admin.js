var admin = require('firebase-admin');
var serviceAccount = require('./akatemia-firebase-adminsdk.json');
var fs = require('fs');
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

function usage() {
    console.log("invalid input");
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
    }).catch(err => {
        console.log(err);
    })
}

function del_member(email) {

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

function add_member(user) {
    db.collection(collection).add(user).then(function(docRef) {
        console.log("Document written with ID: ", docRef.id);
    }).catch(function(err) {
        console.error("Error adding document: ", err);
    });

}

function get_users(nextPageToken) {
    // List batch of users, 1000 at a time.
    admin.auth().listUsers(1000, nextPageToken)
      .then(function(listUsersResult) {
        listUsersResult.users.forEach(function(userRecord) {
          console.log("user", userRecord.toJSON());
        });
        if (listUsersResult.pageToken) {
          // List next batch of users.
          get_users(listUsersResult.pageToken)
        }
      })
      .catch(function(error) {
        console.log("Error listing users:", error);
      });
}

function get_user(email) {
    admin.auth().getUserByEmail(email)
    .then(function(userRecord) {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log(userRecord.toJSON());
    })
    .catch(function(error) {
      console.log("Error fetching user data:", error);
    })
}

function add_user(user) {
    admin.auth().createUser(user)
    .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully created new user:", userRecord.uid);
    })
    .catch(function(error) {
        console.log("Error creating new user:", error);
    });
}

function del_user(uid) {
    admin.auth().deleteUser(uid)
    .then(function() {
      console.log("Successfully deleted user");
    })
    .catch(function(error) {
      console.log("Error deleting user:", error);
    });
}

if (nconf.get('get-members')) {
    get_members();
} else if (nconf.get('del-member')) {
    del_member();
} else if (nconf.get('add-member')) {
    let email = nconf.get('email');
    let lastname = nconf.get('lastname');
    let firstname = nconf.get('firstname');
    let member = {firstName: firstname, lastName: lastname, email: email, valid: true}
    add_member(member);
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
} else if (nconf.get('add-user')) {
    let email = nconf.get('email');
    let password = nconf.get('password');
    let displayname = nconf.get('displayname');

    if (email == undefined || password == undefined || displayname == undefined)
        usage();

    let user = {email: email, password: password, displayName: displayname, disabled: false}
    console.log(user);
    add_user(user);
} else {
    console.log("Don't know what to do?")
}

//process.exit(0);