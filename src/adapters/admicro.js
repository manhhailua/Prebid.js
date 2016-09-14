const bidfactory = require('../bidfactory.js');
const bidmanager = require('../bidmanager.js');
const request = require('../ajax');
const utils = require('../utils');
// var _ = require('lodash');

const AdmicroAdapter = function AdmicroAdapter() {

  /**
   *
   * @param params
   * @private
   */
  function _callBids(params) {
    let bids = params.bids || [];

    _requestBids(bids);
  }

  /**
   *
   * @param bids
   * @private
   */
  function _requestBids(bids) {
    utils.logInfo('Bids object', bids);

    bids.map(bid => {
      let data = utils.parseQueryStringParameters(bid.params);
      utils.logInfo('Current bid object', bid);
      utils.logInfo('Ads query string', data);

      /**
       * Make request to Admicro SSP API
       */
      request.ajax(
        'http://45.124.92.72:10000/ssp_request?' + data,
        function(responseText, response) {

          utils.logInfo('Admicro SSP response', response);

          var ads = JSON.parse(responseText);

          var bidObject = bidfactory.createBid(1);

          bidObject.bidderCode = bid.bidder;
          bidObject.cpm = ads.cpm;
          bidObject.ad = ads.src;
          bidObject.width = ads.width;
          bidObject.height = ads.height;

          // Local testing purpose
          if (location.search.indexOf("local_script=true") !== -1) {
            utils.logInfo('Local script is enabled!');

            bidObject.ad = bidObject.ad.replace(
              'http://adi.admicro.vn/adt/banners/nam2015/148/sspcallback/sspcallback.js',
              'http://nghiahop.xyz/sspcallback.js'
            );
          }

          utils.logInfo('AdMicro Ads', bidObject);

          bidmanager.addBidResponse(bid.placementCode, bidObject);
        }
      );
    });
  }

  // Export the callBids function, so that prebid.js can execute this function
  // when the page asks to send out bid requests.
  return {
    callBids: _callBids
  };
};

module.exports = AdmicroAdapter;