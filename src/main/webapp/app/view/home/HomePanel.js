/*
 * This file is part of ARSnova Mobile.
 * Copyright (C) 2011-2012 Christian Thomas Weber
 * Copyright (C) 2012-2014 The ARSnova Team
 *
 * ARSnova Mobile is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ARSnova Mobile is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ARSnova Mobile.  If not, see <http://www.gnu.org/licenses/>.
 */
Ext.define('ARSnova.view.home.HomePanel', {
	extend: 'Ext.Container',

	requires: [
		'ARSnova.view.home.SessionList',
		'ARSnova.view.Caption'
	],

	config: {
		fullscreen: true,
		scrollable: {
			direction: 'vertical',
			directionLock: true
		}
	},

	inClassRendered: false,
	userInClass: null,
	speakerInClass: null,
	outOfClass: null,

	/* toolbar items */
	toolbar: null,
	logoutButton: null,
	sessionLogoutButton: null,

	initialize: function () {
		this.callParent(arguments);

		this.logoutButton = Ext.create('Ext.Button', {
			text: Messages.LOGOUT,
			ui: 'back',
			handler: function () {
				ARSnova.app.getController('Auth').logout();
			}
		});

		this.toolbar = Ext.create('Ext.Toolbar', {
			title: 'Session',
			docked: 'top',
			ui: 'light',
			items: [
				this.logoutButton
			]
		});

		this.outOfClass = Ext.create('Ext.form.FormPanel', {
			title: 'Out of class',
			cls: 'standardForm',
			scrollable: null,

			items: [{
				xtype: 'button',
				ui: 'normal',
				text: 'Sessions',
				cls: 'forwardListButton',
				controller: 'user',
				action: 'index',
				handler: this.buttonClicked
			}]
		});

		this.sessionLoginForm = Ext.create('Ext.Panel', {
			layout: {
				type: 'vbox',
				pack: 'center',
				align: 'center'
			},

			items: [{
					xtype: 'panel',
					cls: null,
					html: 	"<div class='icon-logo'>" +
							"<span class='icon-logo-radar'>r</span>" +
							"<span class='icon-logo-ars'>a</span>" +
							"<span class='icon-logo-nova'>n</span>" +
							"</div>",
					style: {marginTop: '35px', marginBottom: '30px'}
				}, {
					submitOnAction: false,
					xtype: 'formpanel',
					cls: 'loginFieldSet',
					scrollable: null,
					width: '310px',
					margin: '0 auto',

					items: [{
						xtype: 'textfield',
						component: {
							xtype: 'input',
							cls: 'joinSessionInput',
							type: 'tel',
							maxLength: 16
						},
						name: 'keyword',
						placeHolder: Messages.SESSIONID_PLACEHOLDER,
						listeners: {
							scope: this,
							action: this.onSubmit
						}
					}, {
						xtype: 'button',
						ui: 'confirm',
						text: Messages.GO,
						handler: this.onSubmit,
						scope: this
					}]
			}]
		});

		this.lastVisitedSessionsForm = Ext.create('ARSnova.view.home.SessionList', {
			scrollable: null,
			cls: 'standardForm',
			title: Messages.LAST_VISITED_SESSIONS
		});

		this.mySessionsForm = Ext.create('ARSnova.view.home.SessionList', {
			scrollable: null,
			cls: 'standardForm',
			title: Messages.MY_SESSIONS
		});

		this.add([
			this.toolbar,
			this.sessionLoginForm,
			this.lastVisitedSessionsForm,
			this.mySessionsForm
		]);

		this.on('painted', function () {
			var tabPanel = ARSnova.app.mainTabPanel.tabPanel;

			tabPanel.removeClassFromTab('infoButtonBeforeLogin', tabPanel.infoTabPanel);
			this.loadVisitedSessions();
			this.loadMySessions();
		});
	},

	checkLogin: function () {
		if (ARSnova.app.loginMode == ARSnova.app.LOGIN_THM) {
			this.logoutButton.addCls('thm');
		}
	},

	buttonClicked: function (button) {
		ARSnova.app.getController(button.controller)[button.action]();
	},

	onSubmit: function () {
		ARSnova.app.showLoadMask(Messages.LOGIN_LOAD_MASK);

		// delete the textfield-focus, to hide the numeric keypad on phones
		this.down('textfield').blur();

		ARSnova.app.getController('Sessions').login({
			keyword: this.down('textfield').getValue().replace(/ /g, ""),
			destroy: false,
			panel: this
		});
	},

	loadVisitedSessions: function () {
		if (ARSnova.app.userRole == ARSnova.app.USER_ROLE_SPEAKER) return;
		var me = this;

		var hideLoadingMask = ARSnova.app.showLoadMask(Messages.LOAD_MASK_SEARCH);

		ARSnova.app.restProxy.getMyVisitedSessions({
			success: function (sessions) {
				me.displaySessions(sessions, me.lastVisitedSessionsForm, hideLoadingMask);
			},
			unauthenticated: function () {
				hideLoadingMask();
				ARSnova.app.getController('Auth').login({
					mode: ARSnova.app.loginMode
				});
			},
			failure: function () {
				hideLoadingMask();
				console.log('server-side error loggedIn.save');
				ARSnova.app.mainTabPanel.tabPanel.homeTabPanel.homePanel.lastVisitedSessionsForm.hide();
			}
		}, (window.innerWidth > 481 ? 'name' : 'shortname'));
	},

	loadMySessions: function () {
		if (ARSnova.app.userRole == ARSnova.app.USER_ROLE_SPEAKER) return;
		var me = this;

		var hideLoadingMask = ARSnova.app.showLoadMask(Messages.LOAD_MASK_SEARCH);

		ARSnova.app.sessionModel.getMySessions({
			success: function (response) {
				var sessions = Ext.decode(response.responseText);
				me.displaySessions(sessions, me.mySessionsForm, hideLoadingMask);
			},
			unauthenticated: function () {
				hideLoadingMask();
				ARSnova.app.getController('Auth').login({
					mode: ARSnova.app.loginMode
				});
			},
			failure: function () {
				hideLoadingMask();
				console.log('server-side error loggedIn.save');
				ARSnova.app.mainTabPanel.tabPanel.homeTabPanel.homePanel.mySessionsForm.hide();
			}
		}, (window.innerWidth > 481 ? 'name' : 'shortname'));
	},

	displaySessions: function (sessions, form, hideLoadingMask) {
		var caption = Ext.create('ARSnova.view.Caption');

		if (sessions && sessions.length !== 0) {
			form.removeAll();
			form.show();

			for (var i = 0; i < sessions.length; i++) {
				var session = sessions[i];

				var icon = "icon-users";
				if (session.courseType && session.courseType.length > 0) {
					icon = "icon-prof";
				}

				// Minimum width of 481px equals at least landscape view
				var displaytext = window.innerWidth > 481 ? session.name : session.shortName;
				var sessionButton = Ext.create('ARSnova.view.MultiBadgeButton', {
					xtype: 'button',
					ui: 'normal',
					text: Ext.util.Format.htmlEncode(displaytext),
					cls: 'forwardListButton',
					iconCls: icon + ' courseIcon',
					controller: 'sessions',
					action: 'showDetails',
					badgeCls: 'badgeicon',
					sessionObj: session,
					handler: function (options) {
						var hideLoadMask = ARSnova.app.showLoadMask(Messages.LOAD_MASK_LOGIN);
						ARSnova.app.getController('Sessions').login({
							keyword: options.config.sessionObj.keyword
						});
						hideLoadMask();
					}
				});
				sessionButton.setBadge([{badgeText: session.numUnanswered}]);
				form.addEntry(sessionButton);

				if (!session.active) {
					this.down('button[text=' + displaytext + ']').addCls("isInactive");
				}
			}
			caption.explainBadges(sessions, { questions: false, answers: false, interposed: false, unanswered: true });
			caption.explainStatus(sessions);
			form.addEntry(caption);
		} else {
			form.hide();
		}
		hideLoadingMask();
	}
});
