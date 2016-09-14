import bidfactory from 'src/bidfactory';
import bidmanager from 'src/bidmanager';
import { ajax } from 'src/ajax';
import * as utils from 'src/utils';

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
   * Call bids requests
   * @param  {[array]} bids [array of bids objects]
   * @return {[void]}       [return nothing]
   */
  function _requestBids(bids) {
    // utils.logInfo('Bids object', bids);

    for (let i = 0; i < bids.length; i++) {
      let bid = bids[i];
      // utils.logInfo('Current bid object', bid);

      _request(bid);
    }
  }

  /**
   * Send AJAX request to SSP Service
   * @param  {[object]} bid         [single bid object]
   * @return {[void]}               [return nothing]
   */
  function _request(bid) {
    let queryString = utils.parseQueryStringParameters(bid.params);
    // utils.logInfo('Ads query string', queryString);

    ajax(
      // URL
      'http://45.124.92.72:10000/ssp_request?' + queryString,
      // Callback
      function(responseText, response) {
        // utils.logInfo('Admicro SSP response', response);

        let ads = JSON.parse(responseText);
        let bidObject = bidfactory.createBid(1);

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

        // utils.logInfo('AdMicro Ads', bidObject);

        bidmanager.addBidResponse(bid.placementCode, bidObject);
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