/**
 * Admin Claim Setter Script (Node.js)
 *
 * Usage:
 *   1. Download your service account key JSON from Firebase Console:
 *      Project Settings -> Service Accounts -> Generate new private key
 *   2. Save it as `serviceAccountKey.json` in this `firebase/` directory (gitignored).
 *   3. Run:
 *      node firebase/set-admin.js user@example.com
 *
 * This assigns the custom claim `{ admin: true }` to the specified user account.
 * Once assigned, the user will be granted write access on Firestore and Storage
 * via the security rules without exposing any secret keys to the client app.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: firebase/serviceAccountKey.json not found.');
  console.error('Please download your Service Account Key from the Firebase Console.');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node firebase/set-admin.js <user-email>');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setAdminClaim(userEmail) {
  try {
    const user = await admin.auth().getUserByEmail(userEmail);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Success! Set admin: true custom claim for: ${userEmail} (${user.uid})`);
    console.log('The user must sign out and sign back in for the token claim to refresh.');
    process.exit(0);
  } catch (error) {
    console.error('Error setting custom claim:', error);
    process.exit(1);
  }
}

setAdminClaim(email);
