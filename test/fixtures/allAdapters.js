exports.getAllAdaptersString = function () {
  return `var AardvarkAdapter = require(\'./adapters/aardvark.js\');\n    exports.registerBidAdapter(new AardvarkAdapter(), \'aardvark\');\nvar AdbladeAdapter = require(\'./adapters/adblade.js\');\n    exports.registerBidAdapter(new AdbladeAdapter(), \'adblade\');\nvar AdbutlerAdapter = require(\'./adapters/adbutler.js\');\n    exports.registerBidAdapter(new AdbutlerAdapter(), \'adbutler\');\nvar AdequantAdapter = require(\'./adapters/adequant.js\');\n    exports.registerBidAdapter(new AdequantAdapter(), \'adequant\');\nvar AdformAdapter = require(\'./adapters/adform.js\');\n    exports.registerBidAdapter(new AdformAdapter(), \'adform\');\nvar AdmediaAdapter = require(\'./adapters/admedia.js\');\n    exports.registerBidAdapter(new AdmediaAdapter(), \'admedia\');\nvar AolAdapter = require(\'./adapters/aol.js\');\n    exports.registerBidAdapter(new AolAdapter(), \'aol\');\nvar AppnexusAdapter = require(\'./adapters/appnexus.js\');\n    exports.registerBidAdapter(new AppnexusAdapter(), \'appnexus\');\nvar AppnexusAstAdapter = require(\'./adapters/appnexusAst.js\');\n    exports.registerBidAdapter(new AppnexusAstAdapter(), \'appnexusAst\');\nvar GetintentAdapter = require(\'./adapters/getintent.js\');\n    exports.registerBidAdapter(new GetintentAdapter(), \'getintent\');\nvar HiromediaAdapter = require(\'./adapters/hiromedia.js\');\n    exports.registerBidAdapter(new HiromediaAdapter(), \'hiromedia\');\nvar IndexExchangeAdapter = require(\'./adapters/indexExchange.js\');\n    exports.registerBidAdapter(new IndexExchangeAdapter(), \'indexExchange\');\nvar KruxlinkAdapter = require(\'./adapters/kruxlink.js\');\n    exports.registerBidAdapter(new KruxlinkAdapter(), \'kruxlink\');\nvar KomoonaAdapter = require(\'./adapters/komoona.js\');\n    exports.registerBidAdapter(new KomoonaAdapter(), \'komoona\');\nvar OpenxAdapter = require(\'./adapters/openx.js\');\n    exports.registerBidAdapter(new OpenxAdapter(), \'openx\');\nvar PiximediaAdapter = require(\'./adapters/piximedia.js\');\n    exports.registerBidAdapter(new PiximediaAdapter(), \'piximedia\');\nvar PubmaticAdapter = require(\'./adapters/pubmatic.js\');\n    exports.registerBidAdapter(new PubmaticAdapter(), \'pubmatic\');\nvar PulsepointAdapter = require(\'./adapters/pulsepoint.js\');\n    exports.registerBidAdapter(new PulsepointAdapter(), \'pulsepoint\');\nvar RubiconAdapter = require(\'./adapters/rubicon.js\');\n    exports.registerBidAdapter(new RubiconAdapter(), \'rubicon\');\nvar SonobiAdapter = require(\'./adapters/sonobi.js\');\n    exports.registerBidAdapter(new SonobiAdapter(), \'sonobi\');\nvar SovrnAdapter = require(\'./adapters/sovrn.js\');\n    exports.registerBidAdapter(new SovrnAdapter(), \'sovrn\');\nvar SpringserveAdapter = require(\'./adapters/springserve.js\');\n    exports.registerBidAdapter(new SpringserveAdapter(), \'springserve\');\nvar TripleliftAdapter = require(\'./adapters/triplelift.js\');\n    exports.registerBidAdapter(new TripleliftAdapter(), \'triplelift\');\nvar TwengaAdapter = require(\'./adapters/twenga.js\');\n    exports.registerBidAdapter(new TwengaAdapter(), \'twenga\');\nvar YieldbotAdapter = require(\'./adapters/yieldbot.js\');\n    exports.registerBidAdapter(new YieldbotAdapter(), \'yieldbot\');\nvar NginadAdapter = require(\'./adapters/nginad.js\');\n    exports.registerBidAdapter(new NginadAdapter(), \'nginad\');\nvar BrightcomAdapter = require(\'./adapters/brightcom.js\');\n    exports.registerBidAdapter(new BrightcomAdapter(), \'brightcom\');\nvar WideorbitAdapter = require(\'./adapters/wideorbit.js\');\n    exports.registerBidAdapter(new WideorbitAdapter(), \'wideorbit\');\nvar JcmAdapter = require(\'./adapters/jcm.js\');\n    exports.registerBidAdapter(new JcmAdapter(), \'jcm\');\nvar UnderdogmediaAdapter = require(\'./adapters/underdogmedia.js\');\n    exports.registerBidAdapter(new UnderdogmediaAdapter(), \'underdogmedia\');\nvar MemeglobalAdapter = require(\'./adapters/memeglobal.js\');\n    exports.registerBidAdapter(new MemeglobalAdapter(), \'memeglobal\');\nvar CentroAdapter = require(\'./adapters/centro.js\');\n    exports.registerBidAdapter(new CentroAdapter(), \'centro\');\nvar RoxotAdapter = require(\'./adapters/roxot.js\');\n    exports.registerBidAdapter(new RoxotAdapter(), \'roxot\');\nexports.aliasBidAdapter(\'appnexus\',\'brealtime\');\nexports.aliasBidAdapter(\'appnexus\',\'pagescience\');\nexports.aliasBidAdapter(\'appnexus\',\'defymedia\');\nexports.videoAdapters = ["appnexusAst"];`;
};