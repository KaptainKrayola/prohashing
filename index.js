const events = require('events');
const util = require('util');

//this is required because the prohashing certificate doesn't get a long well with node.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const prohashing = function (config) {
	const self = this;
	self.config = config;
	self.wampConnection = false;
	self.wampUser = config.wampUser || 'web';
	self.wampPassword = config.wampPassword || 'web';
	self.wampSession = false;
	self.subscribe = config.subscribe || 'all';

	if (config.debug) AUTOBAHN_DEBUG = true;
	const autobahn = require('autobahn');

	self.onChallenge = (session, method, extra) => {
		self.wampSession = session;
		if (method === 'wampcra')
			return autobahn.auth_cra.sign(self.wampPassword, extra.challenge);

	};

	self.initialSessionUpdatesReceived = (updates) => {
		self.onMinerUpdate(updates);
		self.wampSession.subscribe(`miner_update_diffs_${self.config.apiKey}`, self.onMinerUpdate);
	};

	self.initialBalanceUpdatesReceived = (updates) => {
		self.onBalanceUpdate(updates);
		self.wampSession.subscribe(`balance_updates_${self.config.apiKey}`, self.onBalanceUpdate);
	};

	self.initialProfitabilityUpdatesReceived = (updates) => {
		self.onProfitabilityUpdate(updates);
		self.wampSession.subscribe('profitability_updates', self.onProfitabilityUpdate);
	};

	self.initialSystemStatusUpdatesReceived = (updates) => {
		self.onSystemStatusUpdate(updates);
		self.wampSession.subscribe('general_updates', self.onSystemStatusUpdate);
	};

	self.connectionOpen = (session, details) => {
		if (self.subscribe.indexOf('miners') > -1 || self.subscribe === "all")
			session.call('f_all_miner_updates', [self.config.apiKey]).then(self.initialSessionUpdatesReceived);

		if (self.subscribe.indexOf('profitability') > -1 || self.subscribe === "all")
			session.call('f_all_profitability_updates').then(self.initialProfitabilityUpdatesReceived);

		if (self.subscribe.indexOf('systemStatus') > -1 || self.subscribe === "all")
			session.call('f_all_general_updates').then(self.initialSystemStatusUpdatesReceived);

		if (self.subscribe.indexOf('balanceStatus') > -1 || self.subscribe === "all")
			session.call('f_all_balance_updates').then(self.initialBalanceUpdatesReceived);

		if (self.subscribe.indexOf('blocks') > -1 || self.subscribe === "all")
			session.subscribe('found_block_updates', self.onBlockUpdate);

		if(self.subscribe.indexOf('miningFailures') > -1 || self.subscribe === "all")
			session.subscribe(`mining_failures_${self.config.apiKey}`, self.onMiningFailure);

		if(self.config.debug) console.log("Prohashing: Connected");
		self.emit("connected", session, details);
	};

	self.onSessionUpdate = (update) => {
		self.emit('sessionUpdate', update);
	};

	self.onBlockUpdate = (block) => {
		self.emit("block", block);
	};

	self.onMinerUpdate = (update) => {
		self.emit("minerStatus", update);
	};

	self.onBalanceUpdate = (update) => {
		self.emit("balanceStatus", update);
	};

	self.onProfitabilityUpdate = (update) => {
		self.emit("profitability", update);
	};

	self.onSystemStatusUpdate = (update) => {
		self.emit("systemStatus", update);
	};

	self.onMiningFailure = (update) => {
		self.emit('miningFailure', update);
	};

	const connDetails = {
		url: self.config.url || 'wss://live.prohashing.com:443/ws',
		realm: 'mining',
		authmethods: ['wampcra'],
		authid: self.wampUser,
		onchallenge: self.onChallenge,
	};
	self.wampConnection = new autobahn.Connection(connDetails);

	self.wampConnection.onopen = self.connectionOpen;
	if(self.config.debug) console.log("Prohashing: Open Connection");
	self.wampConnection.open();

	return this;
};

util.inherits(prohashing, events.EventEmitter);
module.exports = prohashing;
