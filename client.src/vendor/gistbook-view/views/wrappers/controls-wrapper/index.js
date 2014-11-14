//
// controlsWrapper
// If the user is logged in, then this wraps every view. 
// It also manages shared cached data between the Display
// and Edit modes.
//

import * as bb from 'backbone';
import * as mn from 'marionette';
import DisplayWrapper from '../display-wrapper';
import EditWrapper from '../edit-wrapper';
import radioHelpers from '../../../helpers/radio-helpers';

export default mn.LayoutView.extend({
  template: 'controlsWrapper',

  className: 'controls-wrapper-view',

  tagName: 'li',

  initialMode: 'display',

  editOptions: {
    edit: true,
    delete: true,
    move: true
  },

  controlsWrapperOptions: [
    'cache',
    'editOptions',
    'initialMode',
    'gistbookChannel'
  ],

  regions: {
    wrapper: '.gistblock-wrapper'
  },

  ui: {
    addRow: '.gistbook-add-row',
    addText: '.add-text',
    addJavascript: '.add-javascript'
  },

  triggers: {
    'click @ui.addRow': 'add:row',
    'click @ui.addText': 'add:text',
    'click @ui.addJavascript': 'add:javascript'
  },

  // Sets our options, binds callback context, and creates
  // a cached model for users to mess around with
  initialize: function(options) {
    this.mergeOptions(options, this.controlsWrapperOptions);
    this._createCache();
  },

  onEdit: function() {
    this.showActive();
  },

  // Refactor to use the channel
  onDelete: function() {
    this.model.collection.remove(this.model);
  },

  // When the user cancels editing, first reset the cache to match
  // the saved state. Then, show the preview
  onCancel: function() {
    this._resetCache();
    this.showDisplay();
  },

  onAddText: function() {
    console.log('Adding Text!');
    // this.gistbookChannel.trigger('add:block', 'text', this.model);
  },

  onAddJavascript: function() {
    console.log('Adding JS!');
    // this.gistbookChannel.trigger('add:block', 'javascript', this.model);
  },

  showDisplay: function() {
    this.stopListening();
    var displayWrapper = this.getDisplayWrapper();
    this.getRegion('wrapper').show(displayWrapper);
    this.currentView = displayWrapper;
    this._configurePreviewListeners();
  },

  showActive: function() {
    this.stopListening();
    var editWrapper = this.getEditWrapper();
    this.getRegion('wrapper').show(editWrapper);
    this.currentView = editWrapper;
    this._configureEditListeners();
  },

  // When the user updates, first update the cache with the value
  // from the AceEditor. Then persist those changes to the actual model.
  // Finally, take them to the preview view.
  onUpdate: function() {
    this._updateCache();
    this._saveCache();
    this.showDisplay();
  },

  // Determine which view to show
  onRender: function() {
    if (this.initialMode === 'edit') {
      this.showActive();
    } else {
      this.showDisplay();
    }
  },

  getDisplayWrapper: function() {
    return new DisplayWrapper({
      mode: this.mode,
      editOptions: this.editOptions,
      model: this.getModel(),
      blockChannel: radioHelpers.objChannel(this.model)
    });
  },

  getModel: function() {
    var model;
    if (this.cache) {
      this.cachedModel = model = new bb.Model(
        this.model.toJSON()
      );
    } else {
      model = this.model;
    }
    return model;
  },

  getEditWrapper: function() {
    return new EditWrapper({
      model: this.cachedModel,
      blockChannel: radioHelpers.objChannel(this.model)
    });
  },

  // Store a cached model on the view. The user can manipulate
  // this all they want. If they save the block we will persist
  // it to the model
  _createCache: function() {
    this.cachedModel = new bb.Model(
      this.model.toJSON()
    );
  },

  // Call this when the user hits update and wants to save
  // their changes to the model
  _saveCache: function() {
    this.model.set(this.cachedModel.toJSON());
  },

  // If the user changes the cache and wants to reset it,
  // call this
  _resetCache: function() {
    this.cachedModel.set(this.model.toJSON());
  },

  // Update the cache with the latest content of the text editor. Only
  // makes sense to be called when the currentView is the cache
  _updateCache: function() {
    var cachedSource = this.getRegion('wrapper').currentView.cache;
    this.cachedModel.set('source', cachedSource);
  },

  _configureEditListeners: function() {
    this.listenTo(this.currentView, {
      cancel: this.onCancel,
      update: this.onUpdate,
      updateCache: this._updateCache
    });
  },

  _configurePreviewListeners: function() {
    this.listenTo(this.currentView, {
      edit: this.onEdit,
      delete: this.onDelete
    });
  }
});
