const events = require('events')
const util = require('util')

//this is required because the prohashing certificate doesn't get a long well with node.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const prohashing = function (config) {
	var self = this
	self.wampConnection = false
	self.wampUser = 'web'
	self.wampPassword = 'web'
	self.wampSession = false
	self.config = config
	self.subscribe = config.subscribe || 'all'

	if (config.debug) AUTOBAHN_DEBUG = true;
	const autobahn = require('autobahn')

	self.onChallenge = (session, method, extra) => {
		wampSession = session
		if (method == 'wampcra') {
			return autobahn.auth_cra.sign(self.wampPassword, extra.challenge);
		}
	}

	self.initialSessionUpdatesReceived = (updates) => {
		self.onMinerUpdate(updates)
		wampSession.subscribe(`miner_updates_${self.config.apiKey}`, self.onMinerUpdate)
	}

	self.initialProfitabilityUpdatesReceived = (updates) => {
		self.onProfitabilityUpdate(updates)
		wampSession.subscribe('profitability_updates', self.onProfitabilityUpdate);
	}

	self.initialSystemStatusUpdatesReceived = (updates) => {
		self.onSystemStatusUpdate(updates)
		wampSession.subscribe('general_updates', self.onSystemStatusUpdate);
	}

	self.connectionOpen = (session, details) => {
		if (self.subscribe.indexOf('miners') > -1 || self.subscribe == "all") wampSession.call('f_all_miner_updates', [self.config.apiKey]).then(self.initialSessionUpdatesReceived)
		if (self.subscribe.indexOf('profitability') > -1 || self.subscribe == "all") wampSession.call('f_all_profitability_updates').then(self.initialProfitabilityUpdatesReceived)
		if (self.subscribe.indexOf('systemStatus') > -1 || self.subscribe == "all") wampSession.call('f_all_general_updates').then(self.initialSystemStatusUpdatesReceived)
		if (self.subscribe.indexOf('blocks') > -1 || self.subscribe == "all") wampSession.subscribe('found_block_updates', self.onBlockUpdate);

		self.emit("connected", session, details)
	}

	self.onBlockUpdate = (block) => {
		self.emit("block", block)
	}

	self.onMinerUpdate = (update) => {
		self.emit("minerStatus", update)
	}

	self.onProfitabilityUpdate = (update) => {
		self.emit("profitability", update)
	}

	self.onSystemStatusUpdate = (update) => {
		self.emit("systemStatus", update)
	}

	self.wampConnection = new autobahn.Connection({
		url: 'wss://live.prohashing.com:443/ws',
		realm: 'mining',
		authmethods: ['wampcra'],
		authid: self.wampUser,
		onchallenge: self.onChallenge,
	});

	self.wampConnection.onopen = self.connectionOpen
	self.wampConnection.open()

	return this
}

util.inherits(prohashing, events.EventEmitter)
module.exports = prohashing