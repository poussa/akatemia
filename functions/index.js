const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore();

exports.newReservation = functions.region('europe-west1').firestore
  .document('reservations/{reservationID}')
  .onCreate((snap, context) => {
    var data = snap.data();
    console.log(data);
    return {};
  });

exports.newAccount = functions.region('europe-west1').auth
  .user()
  .onCreate((userRecord, context) => {
  const user = userRecord.metadata;
  console.log(user);
  return {};
});
  
