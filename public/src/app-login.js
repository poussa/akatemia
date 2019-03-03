import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import './shared-styles.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
class AppLogin extends PolymerElement {
  static get template() {
    return html`
    <style include="shared-styles">
      :host {
        display: block;
        padding: 10px;
      }
      paper-button {
        background-color: var(--app-primary-color);
        color: white;
        margin-top: 24px;
        margin-left: 0px;
      }
      paper-button[disabled] {
        background-color: var(--light-theme-disabled-color)
      }
      paper-checkbox {
        margin-top: 24px;
        --paper-checkbox-checked-color: var(--app-primary-color);
      }
    </style>
  
    <div>
      <h1>Kirjaudu</h1>
      <paper-input id="email" label="Sähköposti" disabled="[[user.loggedIn]]"></paper-input>
      <paper-input type="password" id="password" label="Salasana" disabled="[[user.loggedIn]]"></paper-input>
      <paper-checkbox id="password_lost" disabled="[[user.loggedIn]]" on-change="_password_lost_changed">Salasana unohtunut</paper-checkbox>
      <div>
        <template is="dom-if" if="[[!user.loggedIn]]">
          <paper-button id="btn" raised="" on-tap="_login">[[btnTextLogin]]</paper-button>
          <paper-button id="btnRegister" raised="" on-tap="_register" disabled="[[user.requestPassword]]">Rekisteröidy</paper-button>
        </template>
        <template is="dom-if" if="[[user.loggedIn]]">
          <paper-button raised="" on-tap="_logout">Ulos</paper-button>
        </template>
      </div>
    </div>
`;
  }

  static get is() { return 'app-login'; }
  ready() {
    super.ready();
    log("login: ready [start]")
    this.btnTextLogin = "Sisään";
    this.btnTextSend = "Lähetä";
    this.toast = document.querySelector("app-shell").shadowRoot.querySelector('#toast');
    log("login: ready [end]")
  }

  _register() {
    let email = this.$.email.value;
    let password = this.$.password.value;

    if (email == undefined || password == undefined) {
      this.toast.show("email/password is missing");
      return;
    }
    let query = firebase.firestore().collection("members").where('email', '==', email);

    query.get().then((snapshot) => {
      if (snapshot.size != 1) {
        this.toast.show('Invalid member.');
        return; 
      }
      let member = snapshot.docs[0].data();
      if (member.value == false) {
        this.toast.show('Invalid membership.');
        return;            
      }
      firebase.auth().createUserWithEmailAndPassword(email, password).then((result) => {
        log("New user: " + member.lastName);
        let displayName = member.firstName.charAt(0) + '.' + member.lastName
        result.user.updateProfile({displayName: displayName}).then(() => {
          // We need to set this here since onAuthStateChanged is already called
          // and does not pick up the displayName property change
          this.set('user.name', displayName);
          let message = 'Hello, ' + member.firstName + " " + member.lastName
          this.toast.show(message);
        }).catch((err) => {
          this.toast.show(err.message);
          error(err.message)
        });
      }).catch((err) => {
        this.toast.show(err.message);
        error(err.message)
      });
    }).catch((err) => {
      this.toast.show(err.message);
      error(err.message)
    });
  }

  _login() {
    let email = this.$.email.value;
    let password = this.$.password.value;

    if (email == undefined) {
      this.toast.show("email is missing");
      return;
    }

    if (this.$.password_lost.checked) {
      firebase.auth().sendPasswordResetEmail(email).then(() => {
        this.toast.show("email sent");
        this.shadowRoot.querySelector("#btn").textContent = this.btnTextLogin;
        this.set('user.requestPassword', false);
         // this does not generate event so btn text not changed
        this.$.password_lost.checked = false;
      }).catch((error) => {
        this.toast.show("error in email sending");
      });
      return;
    }

    if (password == undefined) {
      this.toast.show("password is missing");
      return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password).then((response) => {
      console.log("app-login: login")
    })
    .catch((err) => {
      console.log(err.message)
      this.toast.show(err.message);
    });
  }

  _logout() {
   firebase.auth().signOut().then(() => {
     this.$.password.value = "";
   }).catch((err) => {
     console.log(err.message)
   })
 }

  _password_lost_changed(event) {
    var button = this.shadowRoot.querySelector("#btn")
    if (this.$.password_lost.checked) {
      button.textContent = this.btnTextSend;
      this.set('user.requestPassword', true);
    }
    else {
      button.textContent = this.btnTextLogin;
      this.set('user.requestPassword', false);
    }
  }
}
window.customElements.define(AppLogin.is, AppLogin);
