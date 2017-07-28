/**
 * TSL(Tab-Scroll-Load)
 * tab切换、ajax数据加载、向上滑动加载
 */

//lib
var IScroll = require('./lib/iscroll-lite.js'); //iScroll轻量版

//mods
require('./mods/sticky.js'); //解决移动端fixed平滑吸顶
var Loading = require('./mods/loading.js');

function TSL(options) {

	//配置项
	this.opts = $.extend({}, {
		startPage: 1,				//开始页数
		iScroll: '.J_iscroll',		//iScroll需要使用的元素
		className: {
			tab: 'J_tab',			//tab区class
			conts: 'J_cont',		//tab cont区父class
			cont: 'cont',			//tab cont区每个容器class
			items: '__items__'		//商品列表外层总的容器class，与loading的div同级
		},
		render: function(callback) {
			//触发渲染函数 callback回调函数，可以在ajax中调用
		},		
		afterRender: function() {
			//渲染结束后的回调函数
		},			
		click: function($curTab) {
			//点击tab时的函数 $curTab为jq对象，当前被点击的li元素
		},				
		scroll: function(scrollTop) {
			//scroll事件 scrollTop为滚动页面时的top值
		}		
	}, options);

	//数据模型，不存放实际数据
	this.model = {
		page: this.opts.startPage,
		isRender: false,
		isEnd: false,
		scroll: 0
	};

	this.WINDOW_HEIGHT = $(window).height();

	//jquery obj
	this.$tab = $('.' + this.opts.className.tab);
	this.$conts = $('.' + this.opts.className.conts);
	this.$cont = null; //后面init时会赋值
	
	//tab选项卡信息，存放一些由this.model生成的对象，没有选项卡时只有1组数据
	this.tabs = [];

	//当前选项卡索引，没有选项卡时默认为0
	this.curTabIndex = 0;

	//根据elemTab判断页面是否有选项卡
	this.isHasTab = this.$tab.length ? true : false;

	this.y = 0; //window.scrollTo(x, y)的第二个参数

	this.xhr = null;

	this.loader = new Loading(this.opts.loading);

	this.timer = null; 			//load定时器
	this.isStopLoad = false; 	//是否禁止滚动事件
	this.isStopLoop = false; 	//是否停止自动加载

	this.init();
}

TSL.prototype = {

	init: function() { //做一些初始化工作

		var me = this;

		var html = '';
		var oPage = {};
		var sCont = '<div class="'+ me.opts.className.cont +'"><div class="'+ me.opts.className.items +'"></div></div>';
		if (this.isHasTab) { //有tab选项卡

			//tab悬浮
			this.sticky = me.$tab.sticky({
				top: -1
			});

			this.y = this.sticky.offsetTop + 2; //跳转悬浮位置
			
			//scroll bar
			window.myScroll = new IScroll(this.opts.iScroll, {
				fixedScrollBar: true,
				bindToWrapper: false,
				eventPassthrough: true,
				scrollX: true,
				scrollY: false,
				preventDefault: false
			});

			//绑定tab的click事件
			this.bindClick();

			//初始化dom和一些数据
			this.$tab.find('li').each(function (index, el) {
				//根据数据模型初始化每个tab的数据
				me.tabs.push($.extend(true, {}, me.model));
				html += sCont;
			});

		} else {
			html = sCont;
			me.tabs.push($.extend(true, {}, me.model));
		}

		this.$conts.empty().append(html);
		this.$cont = this.$conts.find('.' + this.opts.className.cont);

		this.load(function() {
			if (me.isHasTab) {
				//设置一下最小高，避免切换tab会跳动
				$(document.body).css('min-height', me.WINDOW_HEIGHT + me.sticky.offsetTop);
			}
		});

		this.loader.init();  //初始化loading，插入loading需要的样式
		this.bindEvent();
	},
	bindClick: function() {
		var me = this;

		this.$tab.on('click', 'li', function() {

			if ($(this).hasClass('active')) return false;

			var index = $(this).index();
			me.curTabIndex = index;

			var curTab = me.tabs[index];

			$(this).addClass('active').siblings('li').removeClass('active');
			me.$cont.eq(index).css('display', 'block').siblings('.' + me.opts.className.cont).css('display', 'none');

			setTimeout(function () {
				window.myScroll.scrollToElement("li:nth-child(" + (index + 1) + ")", 200, true);
			}, 200);

			/**
			 * tab切换会触发翻页效果，导致切换后的tab会跳至上个tab的位置
			 * --------------
			 * 如果tab悬浮
			 *    如果是第一次渲染，就让scroll定在sticky.offsetTop位置
			 *    如果不是第一次，就去scroll位置
			 * 如果tab没有悬浮
			 *    点任何tab,都不会触发scrollTo。
			 *    需要重置当前tab的scroll值为当前scrollTop
			 * 注释①，复现步骤：
			 *    a.点击tab1，滑动当前tab到某个商品位置，此时tab为悬浮状态
			 *	  b.点击其他tab，将tab置为非悬浮，再点tab1
			*	  c.在非悬浮状态，从tab1点回刚才tab，然后使tab悬浮
			*	  d.点tab1，理论上tab1此时应该显示第一个商品（步骤b并未重置），不加这句会让显示商品变成步骤a的商品位置
			*/
			var cur_scroll = curTab.scroll;
			if (me.sticky.isFixed) { //tab悬浮
				if (!curTab.isRender) { //首次渲染
					window.scrollTo(0, me.y);
					me.load(function () { //加载数据，滚动至tab刚好悬浮的位置
						window.scrollTo(0, me.y);
					});
				} else { //不是首次渲染
					//如果其他tab为非悬浮状态，需要强制让其悬浮，否则页面会从tab悬浮变为tab非悬浮，影响用户体验
					cur_scroll = cur_scroll < me.sticky.offsetTop ? me.y : cur_scroll;
					window.scrollTo(0, cur_scroll);
				}
			} else { //如果tab没有悬浮，直接跳到上个tab的滚动位置
				curTab.scroll = $(window).scrollTop(); //见：注释①
				if (!curTab.isRender) {
					me.load();
				}
			}

			me.opts.click.call(me, $(this));

		});
	},
	bindEvent: function() {
		var me = this;
		window.addEventListener('scroll', function () {

			var scrollTop = $(window).scrollTop();
			me.opts.scroll.call(me, scrollTop);

			if (me.loader.isLoading() || me.isStopLoad) return false;
			var docHeight = $(document.body).height();
			if (scrollTop >= docHeight - me.WINDOW_HEIGHT) { //满足到底部的条件
				me.load();
			}

			if (me.isHasTab) {
				//根据滚动，记录当前tab的数据
				me.tabs[me.curTabIndex].scroll = scrollTop;
			}
		});
	},
	getContainer: function() {
		var $container = this.$conts.find('.' + this.opts.className.cont).eq(this.curTabIndex);
		this.loader.container = $container || $(document.body);
	},
	load: function(callback) { //参数：回调函数，此函数需放入ajax.success内执行
		var me = this;
		if (me.isStopLoad) return false;
		me.getContainer();
		me.loader.show();
		clearTimeout(me.timer);
		me.timer = setTimeout(function() {
			me.opts.render.call(me, function() {
				if (!me.isStopLoop && !me.isOutScreen()) { //如果页面没有超过一屏，继续加载
					setTimeout(function() {
						me.load();
					}, 200);
				} else {
					callback && callback();
					me.opts.afterRender.call(me);
				}
			})
		}, 500);
	},
	/**
	 * 阻止一次scroll时间，然后立即解除阻止
	 */
	stopEventOnce: function() {
		var me = this;
		me.isStopLoad = true;
		setTimeout(function() {
			me.isStopLoad = false;
		}, 300)
	},
	stopEvent: function() {
		this.isStopLoad = true;
	},
	stopLoop: function() {
		this.isStopLoop = true;
	},
	isOutScreen: function() {
		//如果当前容器的高度+距离顶部的距离 大于 屏幕高度 说明超过一屏
		if (this.loader.container.height() + this.loader.container.offset().top > this.WINDOW_HEIGHT) {
			return true
		}
		return false
	},
	/**
	 * 数据加载失败，重新加载功能
	 */
	reload: function() {
		var me = this;
		me.loader.loading.html('<input value="重新加载" class="reloadBtn" type="button">');
		me.loader.container.find('.' + me.loader.className).on('click', '.reloadBtn', function() {
			me.loader.inform(me.loader.opts.html);
			me.load();
		});
	}
};

window.TSL = TSL;

if (typeof module != 'undefined' && module.exports) {
	module.exports = TSL;
}


