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
		auto: 200,
		startPage: 1,				//开始页数
		iScroll: '.J_iScroll',		//iScroll引用class
		isTabSticky: true,			//是否使用tab悬浮
		className: {
			tabWrap: 'J_tabWrap',			//tab外层包裹容器样式名
        	contWrap: 'J_contWrap',			//cont外层包裹容器样式名
        	cont: 'cont',					//cont容器名，与html中的名称对应上
        	contActive: 'cont-active', 		//选项卡切换时当前（显示）的样式名
        	items: '__items__'				//cont容器内用来包裹数据的容器样式名，与__loading__并列
		},
		render: function(callback) {
			//触发渲染函数 callback回调函数，可以在ajax中调用
		},		
		afterRender: function() {
			//渲染结束后的回调函数
		},			
		tabClick: function($obj) {
			//tab点击事件，$obj为当前被点击的元素，jq对象
		},				
		scroll: function(scrollTop) {
			//scroll事件 scrollTop为滚动页面时的top值
		}		
	}, options);

	//数据模型，不存放实际数据，供oCurTab使用
	this.model = {
		page: this.opts.startPage,   //起始页数，默认为1
		isRender: false,	//是否渲染过，默认未渲染
		isEnd: false, 		//是否结束，默认未结束，结束时停止调用load方法
		scroll: 0			//scrollTop值
	};

	this.WINDOW_HEIGHT = $(window).height();

	//jquery obj
	this.$tabWrap = $('.' + this.opts.className.tabWrap);
	this.$contWrap = $('.' + this.opts.className.contWrap);
	this.$cont = this.$contWrap.find('.' + this.opts.className.cont);
	
	//tab选项卡信息，存放一些由this.model生成的对象，没有选项卡时只有1组数据
	this.arr_tab = [];

	//当前选项卡索引，没有选项卡时默认为0
	this.curTabIndex = 0;

	//当前tab的数据，数据结构来自this.model
	this.oCurTab = {};

	//根据tab判断页面是否有选项卡
	this.isHasTab = this.$tabWrap.length ? true : false;

	this.y = 0; //window.scrollTo(x, y)的第二个参数

	this.xhr = null;

	this.loader = new Loading(this.opts.loading);

	this.timer = null; 			//load定时器
	this.isStopLoad = false; 	//是否停止滚动加载，默认不停止，如果停止，将不触发load方法

	this.init();
}

TSL.prototype = {

	init: function() { //做一些初始化工作

		var me = this;

		//tagItem：cont容器内用来放商品的div（<div class="__items__"></div>），此div与loading div并列同级
		var __item__ = '<div class="'+ me.opts.className.items +'"></div>';

		if (this.isHasTab) { //有tab选项卡

			if (this.opts.isTabSticky) { //使用tab悬浮
				this.sticky = me.$tabWrap.sticky({
					top: -1
				});
				//只有悬浮，才有跳转的意义
				this.y = this.sticky.arr_tops[0] + 2; //跳转悬浮位置，+2是为了保证处于悬浮状态
			}

			window.myScroll = new IScroll(me.opts.iScroll, {
				fixedScrollBar: true,
				bindToWrapper: false,
				eventPassthrough: true,
				scrollX: true,
				scrollY: false,
				preventDefault: false
			});
			

			//初始化dom和一些数据
			this.$tabWrap.find('li').each(function (index, el) {
				//根据数据模型初始化每个tab的数据
				me.arr_tab.push($.extend(true, {}, me.model));
				me.$cont.eq(index).append(__item__);
			});

			//绑定tab的click事件
			this.bindClick();

		} else { //没有选项卡，只有1条数据
			this.arr_tab.push($.extend(true, {}, me.model));
			this.$cont.append(__item__)
		}

		//有了arr_tab后可以获取到默认tab数据
		me.oCurTab = me.arr_tab[me.curTabIndex];

		this.load(function() {
			if (me.isHasTab) {
				var offsetTop = me.$tabWrap.offset().top,
					height = me.$tabWrap.height();
				//设置一下最小高，避免切换tab会跳动
				$(document.body).css('min-height', me.WINDOW_HEIGHT + offsetTop + height);
			}
		});

		this.loader.init();  //初始化loading，插入loading需要的样式
		this.bindEvent();
	},
	bindClick: function() {
		var me = this;

		this.$tabWrap.on('click', 'li', function() {
			
			if ($(this).hasClass('active')) {
				return false
			};

			var index = $(this).index();
			me.curTabIndex = index;
			
			me.oCurTab = me.arr_tab[index];

			$(this).addClass('active').siblings('li').removeClass('active');

			me.$cont.eq(index).addClass(me.opts.className.contActive).show()
			  .siblings('.' + me.opts.className.cont).removeClass(me.opts.className.contActive).hide();

			setTimeout(function () {
				window.myScroll.scrollToElement("li:nth-child(" + (index + 1) + ")", 200, true);
			}, 200);

			/**
			 * bug：切换tab时会触发底部上滑加载，导致无效加载。
			 * 本逻辑为切换tab时记录跳转位置：
			 * -----------------------------------------
			 * 如果tab悬浮
			 *    如果是第一次渲染，就让页面位于tab刚好悬浮位置
			 *    如果不是第一次，让页面位于记录的scroll值位置
			 * 如果tab没有悬浮
			 *    点任何tab,都不会触发scrollTo。
			 *    需要重置当前tab的scroll值为当前scrollTop
			 * 【注释①】，复现步骤：
			 *    a.点击tab1，滑动页面使tab悬浮，记下当前商品位置
			 *	  b.点击其他tab并将tab置为非悬浮，再点tab1
			*	  c.在非悬浮状态，从tab1点回刚才tab，然后使tab悬浮
			*	  d.点tab1，理论上tab1此时应该显示第一个商品（步骤b并未重置），不加这句会让显示商品变成步骤a的商品位置
			*/
			var cur_scroll = me.oCurTab.scroll;
			if (me.opts.isTabSticky && me.sticky.isFixed) { //支持sticky && tab悬浮
				if (!me.oCurTab.isRender) { //首次渲染
					window.scrollTo(0, me.y);
					me.load();
				} else { //不是首次渲染
					//如果其他tab为非悬浮状态，需要强制让其悬浮，否则页面会从tab悬浮变为tab非悬浮，影响用户体验
					cur_scroll = cur_scroll < me.sticky.arr_tops[0] ? me.y : cur_scroll;
					window.scrollTo(0, cur_scroll);
				}
			} else { //如果tab没有悬浮，直接跳到上个tab的滚动位置
				me.oCurTab.scroll = $(window).scrollTop(); //见：注释①
				if (!me.oCurTab.isRender) {
					me.load();
				}
			}

			//暴露click事件
			me.opts.tabClick.call(me, $(this));
		});
	},
	bindEvent: function() {
		var me = this;
		window.addEventListener('scroll', function () {
			if (me.loader.isLoading() || me.isStopLoad) {
				return false
			}
			var scrollTop = $(window).scrollTop();
			var docHeight = $(document.body).height();
			if (scrollTop >= docHeight - me.WINDOW_HEIGHT) { //满足到底部的条件
				me.load();
			}

			if (me.isHasTab) {
				//根据滚动，记录当前tab的数据
				me.oCurTab.scroll = scrollTop
			}

			//暴露滚动事件
			me.opts.scroll.call(me, scrollTop);
		});
	},
	getContainer: function() {
		var $container = this.$cont.eq(this.curTabIndex);
		this.loader.container = $container;
	},
	load: function(callback) { //参数：回调函数，此函数需放入ajax.success内执行
		if (this.arr_tab[this.curTabIndex].isEnd) {
			return false
		}
		var me = this;
		me.getContainer();
		me.loader.show();
		clearTimeout(me.timer);
		me.timer = setTimeout(function() {
			me.opts.render.call(me, function() {
				if (!me.isOut()) { //如果页面没有超过一屏，继续加载
					me.load();
					setTimeout(function() {
						
					}, me.opts.auto);
				} else {
					callback && callback();
					me.opts.afterRender.call(me);
				}
			})
		}, 500);
	},
	/**
	 * 阻止一次加载，然后立即解除阻止
	 */
	stopLoadOnce: function() {
		var me = this;
		me.isStopLoad = true;
		setTimeout(function() {
			me.isStopLoad = false;
		}, me.opts.auto + 50);
	},
	stopLoad: function() { //停止滚动事件
		this.isStopLoad = true;
	},
	isOut: function() {
		//如果当前容器的高度+距离顶部的距离 大于 屏幕高度 说明超过一屏
		return (this.loader.container.height() + this.loader.container.offset().top > this.WINDOW_HEIGHT) ? true : false
	},
	/**
	 * 重新加载功能
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


