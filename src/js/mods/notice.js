/**
 * xxx件商品更新
 */

function Notice(elem, opt) {
	this.$elem = elem;
	this.defaults = {
		delay: 1000,
		expireDays: 1,
		cookie_name: '_group' + (new Date().getMonth() + 1) + new Date().getDate() + '_'
	};
	this.options = $.extend({}, this.defaults, opt);
}

Notice.prototype = {
	constructor: Notice,
	show: function() {
		if (!this.isUse()) return false;
		var me = this;
		me.$elem.animate({
			transform: 'translate3d(0, 0, 0)'
		}, 400, 'ease', function() {
			me.hide()
		});
	},
	hide: function() {
		var me = this;
		setTimeout(function() {
			me.$elem.animate({
				transform: 'translate3d(0, -110%, 0)'
			}, 400, 'ease', function() {});
		}, me.options.delay)
	},
	isUse: function() {
		var count = 1;
		var date = new Date();
		var expireDays = this.options.expireDays;
		date.setTime(date.getTime() + expireDays * 24 * 3600 * 1000);
		if (!utils.getcookie(this.options.cookie_name)) {
			utils.setcookie(this.options.cookie_name, 1, date.toGMTString());
		} else {
			count = utils.getcookie(this.options.cookie_name);
			count++;
			utils.removecookie(this.options.cookie_name);
			utils.setcookie(this.options.cookie_name, count, date.toGMTString());
		}
		return count < 4 && count > 0
	}
};

$.fn.noticer = function(options) {
	var notice = new Notice(this, options);
	return notice.show();
};
