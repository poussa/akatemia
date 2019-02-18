import '@vaadin/vaadin-grid/vaadin-grid.js';

import '@polymer/paper-spinner/paper-spinner-lite.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { PolymerElement } from '@polymer/polymer/polymer-element.js';

class AppView extends PolymerElement {
  static get template() {
    return html`
    <style include="shared-styles iron-flex iron-flex-alignment iron-positioning">
      :host {
        display: block;
        height: 100%;
      }
      #grid {
        height: 100%;
      }
      paper-button {
        background-color: var(--app-primary-color);
        color: white;
      }
      paper-button[disabled] {
        background-color: var(--light-theme-disabled-color)
      }
      .details {
        padding: 10px;
        margin: 10px;
        display: flex;
        box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14);
      }
      [booked] {
        font-weight: bold;
      }
      paper-checkbox {
        --paper-checkbox-checked-color: var(--app-primary-color);
        @apply(--layout-horizontal);
        @apply(--layout-center);        
        @apply(--layout-center-justified);        
      }
    </style>

    <!--paper-spinner-lite id="spinner" active="[[loading]]"></paper-spinner-lite-->
    <vaadin-grid on-active-item-changed="_onActiveItemChanged" data-provider="[[dataProvider]]" size="[[size]]" id="grid">
      <template class="row-details">
        <div class="details">
          <paper-button disabled="[[!_canBook(item.courts)]]" on-tap="_reserve" id="btn_[[index]]" raised="">Varaa</paper-button>
          <paper-checkbox disabled="[[_isBooked(item.courts.0)]]" checked="[[item.courts.0.booked]]" class="flex center" id="cb_[[index]]_1">K1</paper-checkbox>
          <paper-checkbox disabled="[[_isBooked(item.courts.1)]]" checked="[[item.courts.1.booked]]" class="flex center" id="cb_[[index]]_2">K2</paper-checkbox>
        </div>
      </template>
      <vaadin-grid-column>
        <template class="header">Aika</template>
        <template>[[_getTime(item.starttime)]]</template>
      </vaadin-grid-column>
      <vaadin-grid-column>
        <template class="header">Kenttä 1</template>
        <template><div booked\$="[[item.courts.0.booked]]">[[item.courts.0.user]]</div></template>
      </vaadin-grid-column>
      <vaadin-grid-column>
        <template class="header">Kenttä 2</template>
        <template><div booked\$="[[item.courts.1.booked]]">[[item.courts.1.user]]</div></template>
      </vaadin-grid-column>
    </vaadin-grid>
`;
  }

  static get is() { return 'app-view'; }
  static get properties() {
    return {
      timestamp: {
        type: Number,
        observer: "_timestampChanged"
      },
      appconfig: Object,
      items: {
        type: Array,
        value: []
      },
      loading: {
          type: Boolean,
          notify: true
        }
    };
  }

  constructor() {
    super();
    this.toast = document.querySelector("app-shell").shadowRoot.querySelector('#toast');
    this.unsubscribe = null;
  }

  ready() {
    super.ready();
    const grid = this.$.grid;
    grid.size = this.appconfig.last_hour - this.appconfig.first_hour;
    this.db = firebase.firestore();

    this._initItems();

    this.dataProvider = (params, callback) => {
      let query = this.db.collection("reservations");
      let start = this.moment.clone().startOf('day').hour(this.appconfig.first_hour);
      let end = this.moment.clone().startOf('day').hour(this.appconfig.last_hour);            

      let format = 'DD.MM.YY  kk:mm (ZZ)'
      log("Query: %s - %s", start.format(format), end.format(format));
      query = query
              .orderBy('starttime')
              .startAt(start.toDate())
              .endAt(end.toDate());
      this.loading = true;
      if (this.unsubscribe != null) {
        this.unsubscribe();
      }
      this.unsubscribe = query.onSnapshot((snapshot) => {
        log("Reservations: ", snapshot.size);
        snapshot.forEach((doc) => {
          let data = doc.data();
          data.id = doc.id; // save the doc reference
          // TODO: how did this (prev version) work in v2018 ?
          let starttime = moment.unix(data.starttime.seconds);
          let endtime = moment.unix(data.endtime.seconds);
          this.items.forEach((item, idx) => {
            if (starttime.isSame(item.starttime)) {
              log('Match: %s (%o/%o)', 
                starttime.format(format), data.courts[0].booked, data.courts[1].booked);
              this.items[idx] = data;
              this.items[idx].starttime = starttime;
              this.items[idx].endtime = endtime;
            }
          })
        });
        callback(this.items, this.items.length);        
        this.loading = false;
      });
    }
  }

  _reserve(e) {
    let activeItem = this.$.grid.activeItem;
    let row = Number(e.target.id.split('_')[1]);
    // Access element inside generated template code
    let checkBox_0 = this.shadowRoot.querySelector("#cb_" + row + "_1");
    let checkBox_1 = this.shadowRoot.querySelector("#cb_" + row + "_2");
    if (checkBox_0.checked != activeItem.courts[0].booked) {
      activeItem.courts[0].booked = checkBox_0.checked;
      if (checkBox_0.checked) {
        activeItem.courts[0].user = this.user.name;
        activeItem.courts[0].uid = this.user.uid;
      }
      else {
        delete activeItem.courts[0].user;
        delete activeItem.courts[0].uid;
      }
    }
    if (checkBox_1.checked != activeItem.courts[1].booked) {
      activeItem.courts[1].booked = checkBox_1.checked;
      if (checkBox_1.checked) {
        activeItem.courts[1].user = this.user.name;
        activeItem.courts[1].uid = this.user.uid;
      }
      else {
        delete activeItem.courts[1].user;
        delete activeItem.courts[1].uid;
      }
    }
    log("reserve: ", activeItem);
    let collection = this.db.collection("reservations");
    let doc = {
      starttime: activeItem.starttime.toDate(),
      endtime: activeItem.endtime.toDate(),
      courts: activeItem.courts
    }
    if (activeItem.id == undefined) {
      // new reservation
      collection.add(doc).then((docRef) => {
        log("New doc added: ", docRef.id);
        this.$.grid.closeItemDetails(this.$.grid.activeItem);
        //TODO: when this is needed: this.$.grid.clearCache();
      })
      .catch((err) => {
        error("New doc add error, ", err);
      })
    }
    else {
      // existing reservation
      collection.doc(activeItem.id).update(doc).then(() => {
        log("Doc updated: ", activeItem.id);
        this.$.grid.closeItemDetails(this.$.grid.activeItem);
        //TODO: when this is needed: this.$.grid.clearCache();
      })
      .catch((err) => {
        error("Doc update failed, ", err);
      })
    }
  }
  _getTime(m) {
    return m.format('kk:mm');
  }
  _timestampChanged(newValue, oldValue) {
    this.moment = moment.unix(this.timestamp/1000);
    if (typeof newValue != "undefined") {
      this._updateItems();
      this.$.grid.clearCache();
    }
  }
  _initItems() {
    let first_hour = moment().startOf('day').hour(this.appconfig.first_hour);
    let last_hour = moment().startOf('day').hour(this.appconfig.last_hour);
    let duration = this.appconfig.duration;

    for (let hour = first_hour; hour.isBefore(last_hour); hour.add(duration, 'minutes')) {
      let row = {
        starttime: hour.clone(),
        endtime: hour.clone().add(duration, 'minutes')
      }
      row.courts = [];
      for (let court = 0; court < this.appconfig.courts; court++) {
        row.courts[court] = {court: court + 1, booked: false}
      }
      this.items.push(row);
    }
  }
  _updateItems() {
    let date = {
        year: this.moment.get('year'),
        month: this.moment.get('month'),
        date: this.moment.get('date')
    }
    this.items.forEach((item) => {
      item.starttime.set(date);
      item.endtime.date(date);
      delete item.id;
      item.courts.forEach((court) => {
        court.booked = false;
        delete court.user;
        delete court.uid;
      });
    });
  }
  _onActiveItemChanged(e) {
    if (this.user.loggedIn && this.user.connected) {
      this.$.grid.detailsOpenedItems = [e.detail.value];
    }
    else if (this.user.loggedIn == false) {
      this.toast.show("Kirjaudu sisään");
    }
  }
  _canBook(courts) {
    let result = false;
    
    for (let i = 0; i < courts.length; i++) {
      if (this._isBooked(courts[i]) == false) {
        result = true;
        break;
      }
    }
    return result;
  }
  _isBooked(details) {
    // slot is free
    if ((typeof details.uid == "undefined") || (details.uid == null))
      return false;

    // owner is the current user
    if (details.uid == this.user.uid)
      return false;
    
    return true;
  }
}
customElements.define(AppView.is, AppView);
