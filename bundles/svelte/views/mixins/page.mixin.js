
// Create mixin
riot.mixin('page', {
  /**
   * On init function
   */
  init() {
    // Set value
    this.page = this.eden.get('page');

    // On mount update
    if (!this.eden.frontend) return;

    // On mount
    this.eden.store.on('page', this.__pageEvent);

    // On unmount
    this.on('unmount', () => {
      // Off function
      this.eden.store.removeListener('page', this.__pageEvent);
    });
  },

  /**
   * On page listener
   *
   * @private
   */
  __pageEvent(page) {
    // Set page
    this.page = page;

    // Update view
    if (this.isMounted) this.update();
  },

  /**
   * Page set function
   *
   * @param  {String} key
   * @param  {*}      value
   */
  __pageSet(key, value) {
    // Get original
    const page = this.eden.get('page');

    // Set key value
    page[key] = value;

    // Set
    this.eden.set('page', page);
  },
});
