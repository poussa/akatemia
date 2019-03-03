import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { setPassiveTouchGestures, setRootPath } from '@polymer/polymer/lib/utils/settings.js';
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/iron-selector/iron-selector.js';
import '@polymer/iron-input/iron-input.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-toast/paper-toast.js';
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/iron-meta/iron-meta.js';

import '@vaadin/vaadin-date-picker/theme/material/vaadin-date-picker-light.js';

import './app-icons.js';

// Gesture events like tap and track generated from touch will not be
// preventable, allowing for better scrolling performance.
setPassiveTouchGestures(true);

// Set Polymer's root path to the same value we passed to our service worker
// in `index.html`.
setRootPath(AppGlobals.rootPath);

moment.locale('fi');
moment.tz.add("Europe/Helsinki|EET EEST|-20 -30|010|1Vq10 1qM0|12e5");
moment.tz.setDefault("Europe/Helsinki");

class AppShell extends PolymerElement {
  static get template() {
    return html`
    <style include="iron-flex iron-flex-alignment iron-flex-factors">
      :host {
        --app-primary-color: #4285f4;
        --app-secondary-color: black;

        height: 100%;
        display: block;
      }

      app-drawer-layout:not([narrow]) [drawer-toggle] {
        display: none;
      }

      app-header {
        color: #fff;
        background-color: var(--app-primary-color);
      }

      app-header paper-icon-button {
        --paper-icon-button-ink-color: white;
      }

      .drawer-list {
        margin: 0 20px;
      }

      .drawer-list a {
        display: block;
        padding: 0 16px;
        text-decoration: none;
        color: var(--app-secondary-color);
        line-height: 40px;
      }

      .drawer-list a.iron-selected {
        color: black;
        font-weight: bold;
      }
      iron-pages {
        height: 100%;
      }
      a > paper-icon-button {
        color: var(--app-primary-color);
      }
      .toolbar-item {
        margin-left: 8px;
        margin-top: 8px;
      }
      .toolbar-item-small {
        margin-left: 8px;
        margin-top: 8px;
        font-size: 16px;
      }

      vaadin-date-picker-light {
        background: none;
        color: black;
      }

      #datePicker input {
        border: none;
        font-size: var(--app-toolbar-font-size);
        background: none;
        color: white;
        text-align: center;
      }

      .container {
        @apply --layout-horizontal;
        @apply --layout-center;
        width: 100%;
      }

      #div-menu-picker {
        @apply --layout-flex;
      }
      #div-menu-navi {
        @apply --layout-flex;
      }
    </style>
        
    <iron-ajax auto="" url="appconfig.json" handle-as="json" last-response="{{appconfig}}"></iron-ajax>
    <iron-meta id="appconfig" key="config" value\$="{{appconfig}}"></iron-meta>
        
    <app-location route="{{route}}" url-space-regex="^[[rootPath]]">
    </app-location>

    <app-route route="{{route}}" pattern="[[rootPath]]:page" data="{{routeData}}" tail="{{subroute}}">
    </app-route>

    <app-drawer-layout fullbleed="" narrow="{{narrow}}">
      <!-- Drawer content -->
      <app-drawer id="drawer" slot="drawer" swipe-open="[[narrow]]">
        <app-toolbar>
          <div top-item="" main-title="" class="toolbar-item">Akatemia Tennis</div>
          <div bottom-item="" class="toolbar-item-small">[[user.name]]</div>
        </app-toolbar>
        <iron-selector selected="[[page]]" attr-for-selected="name" class="drawer-list" role="navigation">
          <a name="login" href="[[rootPath]]login"><paper-icon-button icon="app-icons:account-circle"></paper-icon-button>Kirjaudu</a>
          <a name="view" href="[[rootPath]]view"><paper-icon-button icon="app-icons:event"></paper-icon-button>Varaukset</a>
        </iron-selector>
      </app-drawer>

      <!-- Main content -->
      <app-header-layout has-scrolling-region="">

        <app-header slot="header">
          <app-toolbar>
            <div class="container">
              <paper-icon-button icon="app-icons:menu" drawer-toggle=""></paper-icon-button>
              <div id="div-menu-picker">
                <vaadin-date-picker-light on-value-changed="_dateChanged" min="2018-01-01" max="2019-12-31" id="datePicker">
                  <div>
                    <iron-input>
                      <input size="10">
                    </iron-input>
                  </div>
                </vaadin-date-picker-light>
              </div>
              <div id="div-menu-navi">
                <paper-icon-button icon="app-icons:navigate-before" on-tap="back"></paper-icon-button>
                <paper-icon-button icon="app-icons:navigate-next" on-tap="forward"></paper-icon-button>
              </div>
            </div>
          </app-toolbar>
        </app-header>

        <iron-pages selected="[[page]]" attr-for-selected="name" fallback-selection="view404" role="main">
          <app-login name="login" user="{{user}}"></app-login>
          <app-view name="view" user="[[user]]" timestamp="[[timestamp]]" appconfig="[[appconfig]]"></app-view>
          <app-view404 name="view404"></app-view404>
        </iron-pages>
      </app-header-layout>
    </app-drawer-layout>
    <paper-toast id="toast" text="toast"></paper-toast>
`;
  }

  static get is() { return 'app-shell'; }

  static get properties() {
    return {
      page: {
        type: String,

        reflectToAttribute: true,
        observer: '_pageChanged',
      },
      routeData: Object,
      subroute: Object,
      // This shouldn't be neccessary, but the Analyzer isn't picking up
      // Polymer.Element#rootPath
      rootPath: String,
      
      appconfig: Object,
      moment: {
        type: Object,
        value: moment().startOf('day'),
      },
      timestamp: {
        type: Number,
        value: moment().startOf('day').valueOf()
      }
    };
  }
  
  static get observers() {
    return [
      '_routePageChanged(routeData.page)',
    ];
  }

  constructor() {
    super();
    this.user = {name: '...', email: '', uid: '', loggedIn: false, connected: false, requestPassword: false}
  }
  ready() {
    super.ready();
    this.localize();
    this.formatDay();
    // Production config
    var production = {
      apiKey: "AIzaSyA5fEsZ7-JUiJQ3jFfHqizGkl95lrPi7ZQ",
      authDomain: "akatemia-tennis.firebaseapp.com",
      databaseURL: "https://akatemia-tennis.firebaseio.com",
      projectId: "akatemia-tennis",
      storageBucket: "akatemia-tennis.appspot.com",
      messagingSenderId: "794286885542"
    };
    // Testing config
    var testing = {
      apiKey: "AIzaSyBK4PYw2HChcmK9SsznDswvtC5UMrA2jiM",
      authDomain: "akatemia-testing.firebaseapp.com",
      databaseURL: "https://akatemia-testing.firebaseio.com",
      projectId: "akatemia-testing",
      storageBucket: "akatemia-testing.appspot.com",
      messagingSenderId: "248923693759"
    };

    firebase.initializeApp(production);
    firebase.database().ref(".info/connected").on("value", (snap) => {
      if (snap.val() === true) {
        log("Database connected");
        this.set('user.connected', true);
      } else {
        log("Database not connected");
        this.set('user.connected', false);
      }
    });
    firebase.auth().onAuthStateChanged((user) => {
      log("Auth state changed: ", user);
      if (user) {
        this.set('user.name', user.displayName);
        this.set('user.email', user.email)
        this.set('user.uid', user.uid);
        this.set('user.loggedIn', true);
        this.set('route.path', '/view/');
      }
      else {
        this.set('user.name', '');
        this.set('user.email', '')
        this.set('user.uid', '');
        this.set('user.loggedIn', false);
      }
    });
  }

  formatDay() {
    this.$.datePicker.value = this.moment.format('YYYY-MM-DD')
  }

  forward() {
    this.moment.add(1, 'days');
    this.timestamp = this.moment.valueOf();
    this.formatDay();
  }

  back() {
    this.moment.subtract(1, 'days');
    this.timestamp = this.moment.valueOf();
    this.formatDay();
  }

  _dateChanged(e) {
    // TODO: we get 2 events, first w/ date then w/ ""
    if (e.detail.value !== "") {
      console.log("date-picker: ", e.detail.value);
      let parts = e.detail.value.split('-');
      // TODO: this will break in any other date format...
      this.moment.set({
        year: parts[0],
        month: parseInt(parts[1]) - 1,
        date: parts[2]
      });
      this.timestamp = this.moment.valueOf();
      this.formatDay();
    }
  }

  handleAuthError() {
    console.log("AUTH ERROR");
  }

  _routePageChanged(page) {
    console.log('routePageChanged: ' + page)
    
    // If no page was found in the route data, page will be an empty string.
    // Default to 'view' in that case.
    this.page = page || 'view';

    // Close a non-persistent drawer when the page & route are changed.
    if (!this.$.drawer.persistent) {
      this.$.drawer.close();
    }
  }

  _pageChanged(page) {
    // Import the page component on demand.
    //
    // Note: `polymer build` doesn't like string concatenation in the import
    // statement, so break it up.
    log('pageChanged: ' + page)
    switch (page) {
      case 'view':
        import('./app-view.js').then((element) => {
          log('Module loaded:', page)
        }).catch((reason) => {
          error('Element failed to load: ', reason);
        });
        break;
      case 'login':
        import('./app-login.js').then((element) => {
          log('Module loaded:', page)
        }).catch((reason) => {
          error('Element failed to load: ', reason);
        });
        break;
      case 'view404':
        import('./app-view404.js').then((element) => {
          log('Module loaded:', page)
        }).catch((reason) => {
          error('Element failed to load: ', reason);
        });
        break;
      default:
        error("No such module", page);
    }
  }

  _showPage404() {
    this.page = 'view404';
  }

  localize() {
    this.$.datePicker.set('i18n.week','viikko');
    this.$.datePicker.set('i18n.calendar','kalenteri');
    this.$.datePicker.set('i18n.clear','tyhjennä');
    this.$.datePicker.set('i18n.today','tänään');
    this.$.datePicker.set('i18n.cancel','peruuta');
    this.$.datePicker.set('i18n.firstDayOfWeek',1);
    let months = 'tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesäkuu_heinäkuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu'.split('_');
    this.$.datePicker.set('i18n.monthNames', months);
    let weekdays = 'sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai'.split('_');
    this.$.datePicker.set('i18n.weekdays', weekdays);
    let weekdaysShort = 'su_ma_ti_ke_to_pe_la'.split('_');
    this.$.datePicker.set('i18n.weekdaysShort', weekdaysShort);
    this.$.datePicker.i18n.formatDate = function(date) {
      return moment(date).format('dd D.M');
    }
    this.$.datePicker.i18n.parseDate = null
  }
}

window.customElements.define(AppShell.is, AppShell);
