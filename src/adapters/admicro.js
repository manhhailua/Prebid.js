import bidfactory from 'src/bidfactory';
import bidmanager from 'src/bidmanager';
import { ajax } from 'src/ajax';
import * as utils from 'src/utils';

const AdmicroAdapter = function AdmicroAdapter() {

  /**
   * Default function for call bids
   * @param  {object} params  all params
   * @return {void}           void function
   */
  function _callBids(params) {
    let bids = params.bids || [];

    _requestBids(bids);
  }

  /**
   * Call bids requests
   * @param  {array} bids   array of bids objects
   * @return {void}         void function
   */
  function _requestBids(bids) {
    utils.logInfo('Bids object', bids);

    for (let i = 0; i < bids.length; i++) {
      let bid = bids[i];
      utils.logInfo('Current bid object', bid);

      _request(bid);
    }
  }

  /**
   * Send AJAX request to SSP Service
   * @param  {object} bid   single bid object
   * @return {void}         void function
   */
  function _request(bid) {
    ajax(
      // URL
      'http://45.124.92.72:10000/ssp_request',
      // Callback
      function(responseText, response) {
        utils.logInfo('Admicro SSP response', response);

        let ads = JSON.parse(responseText);
        let bidObject = bidfactory.createBid(1);

        bidObject.bidderCode = bid.bidder;
        bidObject.cpm = ads.cpm / 22270; // Convert VND to USD
        bidObject.ad = ads.src;
        bidObject.width = ads.width;
        bidObject.height = ads.height;

        // Local testing purpose
        if (location.search.indexOf("local_script=true") !== -1) {
          utils.logInfo('Local script is enabled!');

          // Using testing version instead of production version of sspcallback.js
          bidObject.ad = bidObject.ad.replace(
            'http://adi.admicro.vn/adt/banners/nam2015/148/sspcallback/sspcallback.js',
            'http://nghiahop.xyz/sspcallback.js'
          );
        }

        utils.logInfo('AdMicro Ads', bidObject);

        bidmanager.addBidResponse(bid.placementCode, bidObject);
      },
      // Query params
      bid.params,
      // AJAX options
      // .method - use GET or POST is okay
      // .contentType and .preflight is for preventing preflight requests by CORS
      {
        method: 'GET',
        contentType: 'application/x-www-form-urlencoded',
        preflight: false,
      }
    );
  }

  // Export the callBids function, so that prebid.js can execute this function
  // when the page asks to send out bid requests.
  return {
    callBids: _callBids
  };
};

module.exports = AdmicroAdapter;