const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const firestore = admin.firestore();

exports.newReservation = functions.firestore
  .document('reservations/{reservationID}')
  .onCreate(event => {
    var data = event.data.data();
    console.log(data);
    return {};
  });

exports.newAccount = functions.auth.user().onCreate(event => {
  const user = event.data;
  console.log(user);
  return {};
});
  
