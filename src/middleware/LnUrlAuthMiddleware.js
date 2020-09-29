const _ = require('underscore');
const crypto = require('crypto');
const debug = {
	error: require('debug')('passport-lnurl-auth:middleware:error'),
};
const fs = require('fs');
const lnurl = require('lnurl');
const path = require('path');
const querystring = require('querystring');
const secp256k1 = require('secp256k1');

const map = {
	session: new Map(),
};

const Middleware = function(options) {
	options = _.defaults(options || {}, {
		// The externally reachable URL for the lnurl-auth middleware.
		// It should resolve to THIS endpoint on your server.
		callbackUrl: null,
		// The URL of the "Cancel" button on the login page.
		// When set to NULL or some other falsey value, the cancel button will be hidden.
		cancelUrl: null,
	});
	options.qrcode = _.defaults(options.qrcode || {}, {
		errorCorrectionLevel: 'L',
		margin: 2,
		type: 'image/png',
	})
	if (!options.callbackUrl) {
		throw new Error('Missing required middleware option: "callbackUrl"');
	}
	return function(req, res, next) {
		if (req.query.k1 || req.query.key || req.query.sig) {
			// Check signature against provided linking public key.
			// This request could originate from a mobile app (ie. not their browser).
			let session;
			try {
				if (!req.query.k1) {
					throw new Error('Missing required parameter: "k1"', 400);
				}
				if (!req.query.sig) {
					throw new Error('Missing required parameter: "sig"', 400);
				}
				if (!req.query.key) {
					throw new Error('Missing required parameter: "key"', 400);
				}
				session = map.session.get(req.query.k1);
				if (!session) {
					throw new Error('Secret does not match any known session', 400);
				}
				const k1 = Buffer.from(req.query.k1, 'hex');
				const signature = secp256k1.signatureImport(Buffer.from(req.query.sig, 'hex'));
				const linkingPublicKey = Buffer.from(req.query.key, 'hex');
                const signatureOk = secp256k1.verify(k1, signature, linkingPublicKey);
                console.log({linkingPublicKey, signatureOk});
				if (!signatureOk) {
					throw new Error('Invalid signature', 400);
				}
				session.lnurlAuth = session.lnurlAuth || {};
				session.lnurlAuth.linkingPublicKey = req.query.key;
			} catch (error) {
                console.log(error)
				if (!error.status) {
					debug.error(error);
					error = new Error('Unexpected error');
					error.status = 500;
				}
				return res.status(error.status).json({
					status: 'ERROR',
					reason: error.message
				});
			}
            // Signature check passed.
            console.log("will save session...")
            console.log(session)
			return session.save(function(error) {
                console.log("session saved...")
                console.log({error:error})
				if (error) {
					debug.error(error);
					return res.status(500).json({
						status: 'ERROR',
						reason: 'Unexpected error',
					});
                }
                console.log({session})
				res.status(200).json({ status: 'OK' });
			});
		}
		// req.session = req.session || {};
		req.session.lnurlAuth = req.session.lnurlAuth || {};
		let k1 = req.session.lnurlAuth.k1 || null;
		if (!k1) {
			k1 = req.session.lnurlAuth.k1 = generateSecret(32, 'hex');
			map.session.set(k1, req.session);
		}
		// Show login page.
		return res.status(200).send(getLoginPageHtml(k1, options));
	};
};

const deepClone = function(obj) {
	return JSON.parse(JSON.stringify(obj));
};

const getLoginPageHtml = function(k1, options) {
	options = deepClone(options);
	options.callbackUrl += '?' + querystring.stringify({
		k1,
		tag: 'login',
	});
    const encoded = lnurl.encode(options.callbackUrl);
    return {url:'lightning:' + encoded} ;
	// return generateQrCode('lightning:' + encoded, options.qrcode).then(dataUri => {
	// 	const data = _.extend({}, {
	// 		encoded,
	// 		dataUri
	// 	}, _.pick(options, 'cancelUrl'));
	// 	return getTemplateHtml('login', data);
	// });
};

const templatesDir = path.join(__dirname, '..', 'templates');
const getTemplateHtml = function(name, data) {
	return new Promise(function(resolve, reject) {
		const filePath = path.join(templatesDir, 'login.html');
		fs.readFile(filePath, function(error, contents) {
			if (error) return reject(error);
			let html;
			try {
				const template = Handlebars.compile(contents.toString());
				html = template(data);
			} catch (error) {
				return reject(error);
			}
			resolve(html);
		});
	});
};

const generateSecret = function(numBytes, encoding) {
	numBytes = numBytes || 32;
	encoding = encoding || 'hex';
	return crypto.randomBytes(numBytes).toString(encoding);
};

const generateQrCode = function(data, options) {
	return new Promise(function(resolve, reject) {
		QRCode.toDataURL(data, options, function(error, dataUri) {
			if (error) return reject(error);
			resolve(dataUri);
		});
	});
};

module.exports = Middleware;
