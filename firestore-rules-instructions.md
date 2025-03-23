# How to Update Firestore Security Rules

Since the Firebase CLI isn't available, you need to manually update the Firestore security rules through the Firebase console:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on "Firestore Database" in the left sidebar
4. Click on the "Rules" tab at the top
5. Replace the current rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only the user can read their own document, but admins can read all
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == userId;
      allow delete: if false; // Prevent deletion
    }
    
    // Patient details - only the patient and clinicians can read
    match /patientDetails/{docId} {
      allow read: if request.auth != null && 
                  (resource.data.userId == request.auth.uid || 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'clinician');
      allow create, update: if request.auth != null && 
                             request.resource.data.userId == request.auth.uid;
      allow delete: if false; // Prevent deletion
    }
    
    // Clinician details - clinicians can read/write their own, patients can read
    match /clinicianDetails/{docId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
                             request.resource.data.userId == request.auth.uid && 
                             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'clinician';
      allow delete: if false; // Prevent deletion
    }
    
    // Patients collection for profile data - users can read/write their own profile
    match /patients/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Clinicians collection for profile data - users can read/write their own profile
    match /clinicians/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Queries - patients can create and read their own, clinicians can read all and update for verification
    match /queries/{queryId} {
      allow read: if request.auth != null && 
                  (resource.data.userId == request.auth.uid || 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'clinician');
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                    (resource.data.userId == request.auth.uid || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'clinician');
      allow delete: if false; // Prevent deletion
    }
  }
}
```

6. Click "Publish" to apply the new rules

After publishing these updated rules, you should be able to save profile information without getting the "Missing or insufficient permissions" error. 